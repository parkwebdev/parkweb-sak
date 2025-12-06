# ChatPad Widget Architecture

Technical documentation for the ChatPad embeddable chat widget.

## Table of Contents

1. [Overview](#overview)
2. [Build Architecture](#build-architecture)
3. [Loading Strategy](#loading-strategy)
4. [Widget Configuration](#widget-configuration)
5. [Real-time Features](#real-time-features)
6. [Server-Side Link Preview Caching](#server-side-link-preview-caching)
7. [Visitor Analytics](#visitor-analytics)
8. [Performance Optimizations](#performance-optimizations)
9. [Security](#security)

---

## Overview

The ChatPad widget is a high-performance, embeddable chat interface that can be added to any website. It provides AI-powered conversations with optional human takeover, a help center, and lead capture functionality.

### Key Features

- **AI Chat**: Conversational AI powered by RAG (Retrieval Augmented Generation)
- **Human Takeover**: Team members can take over conversations in real-time
- **Help Center**: Searchable help articles with categories
- **Lead Capture**: Configurable contact forms with custom fields
- **Announcements**: Promotional banners and news items
- **Voice Messages**: Audio recording and playback
- **File Attachments**: Image and document uploads
- **Message Reactions**: Emoji reactions with real-time sync
- **Read Receipts**: Visual confirmation of message delivery and reading
- **Link Previews**: Server-side cached previews for instant rendering
- **Sound Settings**: User-controllable notification sounds

---

## Build Architecture

The widget has a **separate build entry point** from the main application to minimize bundle size.

### Directory Structure (Post-Refactoring)

```
src/widget/
├── ChatWidget.tsx          # Orchestrator component (~530 lines)
├── types.ts                # TypeScript interfaces and types
├── constants.ts            # CSS vars, position classes, lazy imports
├── api.ts                  # Widget API functions
├── NavIcons.tsx            # Navigation icons with fill animation
├── CSSAnimatedItem.tsx     # CSS-only animated list item
├── CSSAnimatedList.tsx     # CSS-only animated list container
├── category-icons.tsx      # Help category icon mapping
├── hooks/
│   ├── index.ts            # Barrel exports with JSDoc
│   ├── useWidgetConfig.ts  # Config fetching and state
│   ├── useConversations.ts # Conversation CRUD operations
│   ├── useRealtimeMessages.ts  # Real-time message subscriptions
│   ├── useTypingIndicator.ts   # Supabase presence for typing
│   ├── useConversationStatus.ts # Status change subscriptions
│   ├── useParentMessages.ts    # postMessage communication
│   ├── useSoundSettings.ts     # Sound preference persistence
│   ├── useVisitorPresence.ts   # Visitor presence tracking
│   └── useVisitorAnalytics.ts  # Page visit analytics
├── components/
│   ├── index.ts            # Barrel exports with JSDoc
│   ├── ContactForm.tsx     # User info collection form
│   ├── MessageBubble.tsx   # Single message display
│   ├── MessageInput.tsx    # Text input with actions
│   ├── WidgetHeader.tsx    # Header with nav
│   ├── WidgetNav.tsx       # Bottom navigation
│   ├── TakeoverBanner.tsx  # Human takeover notice
│   ├── TypingIndicator.tsx # Agent typing dots
│   └── FloatingButton.tsx  # Chat open/close button
├── views/
│   ├── index.ts            # Barrel exports with JSDoc
│   ├── HomeView.tsx        # Home screen with announcements
│   ├── MessagesView.tsx    # Conversation list
│   ├── ChatView.tsx        # Active conversation
│   └── HelpView.tsx        # Help center with search
└── utils/
    ├── index.ts            # Barrel exports with JSDoc
    ├── formatting.ts       # Time and text formatting
    ├── validation.ts       # Form validation utilities
    ├── session.ts          # Session/storage utilities
    └── referrer.ts         # Referrer journey utilities
```

### Build Configuration

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    input: {
      main: 'index.html',
      widget: 'widget.html'
    }
  }
}
```

### Widget Entry (`widget-entry.tsx`)

The widget entry is minimal - no `AuthProvider`, `ThemeProvider`, or routing:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './widget.css';  // Minimal CSS subset

const WidgetPage = React.lazy(() => import('./pages/WidgetPage'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <WidgetPage />
    </Suspense>
  </React.StrictMode>
);
```

### CSS Optimization (`widget.css`)

The widget uses a minimal CSS file instead of the full `index.css`:

- Only light mode variables (no dark mode)
- Essential base styles only
- Optimized font loading (3 weights: 400, 500, 600)
- **Size reduction**: ~50KB → ~15KB

---

## Loading Strategy

The widget uses an **Intercom-style instant loading** approach for optimal perceived performance.

### Loading Sequence

```
1. Page Load
   ├── Widget loader script executes
   ├── Config fetch begins (parallel)
   └── Floating button renders immediately

2. Button Hover/Touch (Preload Phase)
   ├── Preconnect hints added for widget domain
   ├── Iframe created in background (hidden)
   └── Widget starts loading in iframe

3. Button Click (Instant Open)
   ├── Container visibility toggled
   └── Widget appears instantly (~50ms)

4. Widget Ready
   └── Full interactivity available
```

### Loader Script (`chatpad-widget.js`)

The loader script is served by the `serve-widget` edge function:

```javascript
(function() {
  // Read configuration from script attributes
  var script = document.currentScript;
  var agentId = script.getAttribute('data-agent-id');
  var position = script.getAttribute('data-position') || 'bottom-right';
  
  // Create floating button immediately
  var button = createFloatingButton();
  
  // Preload on hover
  button.addEventListener('mouseenter', preloadWidget);
  button.addEventListener('touchstart', preloadWidget);
  
  // Toggle on click
  button.addEventListener('click', toggleWidget);
  
  function preloadWidget() {
    if (iframe) return;
    addPreconnectHints();
    createIframe();
  }
  
  function createIframe() {
    iframe = document.createElement('iframe');
    iframe.src = `${appUrl}/widget?agentId=${agentId}`;
    // Hidden until ready signal received
    container.style.display = 'none';
    container.appendChild(iframe);
  }
})();
```

### Ready Handshake

Widget signals readiness to parent via postMessage:

```typescript
// ChatWidget.tsx
useEffect(() => {
  window.parent.postMessage({ type: 'chatpad-widget-ready' }, '*');
}, []);

// chatpad-widget.js
window.addEventListener('message', function(event) {
  if (event.data.type === 'chatpad-widget-ready') {
    container.style.display = 'block';
  }
});
```

---

## Widget Configuration

### WidgetConfig Interface

```typescript
interface WidgetConfig {
  // Agent Info
  agentId: string;
  agentName: string;
  systemPrompt: string;
  model: string;
  
  // Appearance
  primaryColor: string;           // Primary brand color (hex)
  gradientStartColor: string;     // Primary brand color for gradients
  gradientEndColor: string;       // Secondary brand color for gradients
  showBranding: boolean;          // Show "Powered by ChatPad"
  
  // Hero Section
  heroTitle: string;              // Main greeting
  heroSubtitle: string;           // Subtitle text
  teamAvatarUrls: string[];       // Team member avatars
  
  // Navigation
  tabs: WidgetTab[];              // Enabled tabs
  bottomNavEnabled: boolean;      // Show bottom navigation
  
  // Contact Form
  enableContactForm: boolean;     // Require contact form
  contactFormTitle: string;       // Form header
  contactFormSubtitle: string;    // Form subtext
  contactFormFields: CustomField[];
  
  // Help Center
  helpCategories: HelpCategory[];
  helpArticles: HelpArticle[];
  
  // Announcements
  announcements: Announcement[];
  
  // Features
  enableVoiceMessages: boolean;
  enableFileAttachments: boolean;
  enableMessageReactions: boolean;
  showReadReceipts: boolean;      // Show read/delivered indicators
}
```

### Configuration Loading

Configuration is fetched from the `get-widget-config` edge function:

```typescript
// get-widget-config edge function
const config = await supabase
  .from('agents')
  .select(`
    id, name, system_prompt, model, deployment_config,
    announcements (*),
    help_categories (*),
    help_articles (*)
  `)
  .eq('id', agentId)
  .single();

return {
  agentId: config.id,
  agentName: config.name,
  ...config.deployment_config,
  announcements: config.announcements,
  helpCategories: config.help_categories,
  helpArticles: config.help_articles
};
```

---

## Real-time Features

### Message Subscriptions

Widget subscribes to new messages for real-time updates during human takeover:

```typescript
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      const linkPreviews = payload.new.metadata?.link_previews;
      setMessages(prev => [...prev, { ...payload.new, linkPreviews }]);
    }
  )
  .subscribe();
```

### Typing Indicators (Bidirectional)

Uses Supabase Realtime Presence for ephemeral typing states:

```typescript
// Send typing indicator (user → agent)
const channel = supabase.channel(`typing:${conversationId}`);
channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { visitorId, isTyping: true }
});

// Receive typing indicator (agent → user)
channel.on('broadcast', { event: 'typing' }, (payload) => {
  if (payload.payload.senderType === 'agent') {
    setIsHumanTyping(true);
  }
});
```

### Message Reactions (Bidirectional)

Emoji reactions sync in real-time between widget and admin.

---

## Server-Side Link Preview Caching

Link previews are fetched once on the server when messages are created.

### Architecture

```
1. User/AI sends message with URL
   └── widget-chat edge function

2. Server extracts URLs (max 3)
   └── URL_REGEX pattern matching

3. Server fetches preview metadata
   └── Calls fetch-link-preview edge function

4. Previews stored in message metadata
   └── message.metadata.link_previews = [...]

5. Frontend renders cached previews instantly
   └── No client-side fetching needed
```

---

## Visitor Analytics

### Visitor Identification

Each widget visitor gets a unique, persistent identifier stored in localStorage.

### Page Visit Tracking

Parent window sends page info via postMessage to track visitor navigation patterns, referrer journey, and UTM parameters.

---

## Performance Optimizations

| Optimization | Impact |
|--------------|--------|
| Separate build entry | Widget bundle ~50KB (vs ~800KB main app) |
| Lazy-loaded components | Deferred loading for VoiceInput, FileDropZone, AudioPlayer |
| CSS animations | No Framer Motion in critical path |
| Preconnect hints | Warm DNS/TCP on hover |
| Ready handshake | No flicker on open |
| Server-side link previews | No client-side fetch delay |

---

## Security

- **XSS Protection**: DOMPurify sanitization for all rendered HTML
- **Spam Protection**: Honeypot fields + timing-based detection
- **Rate Limiting**: Server-side limits on form submissions
- **RLS Policies**: Public access restricted to widget-channel conversations only

---

## Related Documentation

- [Application Overview](./APPLICATION_OVERVIEW.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Edge Functions](./EDGE_FUNCTIONS.md)
- [Security](./SECURITY.md)
