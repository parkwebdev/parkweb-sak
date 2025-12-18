# ChatPad Widget Architecture

> **Last Updated**: December 2025  
> **Status**: Active  
> **Related**: [Security](./SECURITY.md), [Edge Functions](./EDGE_FUNCTIONS.md), [AI Architecture](./AI_ARCHITECTURE.md)

Technical documentation for the ChatPad embeddable chat widget.

---

## Table of Contents

1. [Overview](#overview)
2. [Build Architecture](#build-architecture)
3. [Loading Strategy](#loading-strategy)
4. [Widget Configuration](#widget-configuration)
5. [Real-time Features](#real-time-features)
6. [Server-Side Link Preview Caching](#server-side-link-preview-caching)
7. [Visitor Analytics](#visitor-analytics)
8. [Performance Optimizations](#performance-optimizations)
9. [Widget UI Layer](#widget-ui-layer)
10. [Native Feature Components](#native-feature-components)
11. [Icon Tree-Shaking](#icon-tree-shaking)
12. [Security](#security)

---

## Overview

The ChatPad widget is a high-performance, embeddable chat interface that can be added to any website. It provides AI-powered conversations with optional human takeover, a help center, and lead capture functionality.

### Key Features

- **AI Chat**: Conversational AI powered by RAG (Retrieval Augmented Generation)
- **Human Takeover**: Team members can take over conversations in real-time
- **Help Center**: Searchable help articles with categories and icons
- **Lead Capture**: Configurable contact forms with custom fields
- **Announcements**: Promotional banners and news items
- **Voice Messages**: Audio recording and playback
- **File Attachments**: Image and document uploads
- **Message Reactions**: Emoji reactions with real-time sync
- **Read Receipts**: Visual confirmation of message delivery and reading
- **Link Previews**: Server-side cached previews for instant rendering
- **Sound Settings**: User-controllable notification sounds
- **Property Search**: AI-powered real estate property lookup
- **Appointment Booking**: Calendar integration with day/time selection

---

## Build Architecture

The widget has a **separate build entry point** from the main application to minimize bundle size.

### Directory Structure

```
src/widget/
├── ChatWidget.tsx              # Orchestrator component
├── types.ts                    # TypeScript interfaces and types
├── constants.ts                # CSS vars, position classes, lazy imports
├── api.ts                      # Widget API functions (Supabase, edge calls)
├── icons.tsx                   # Tree-shaken icon exports (individual imports)
├── NavIcons.tsx                # Navigation icons with fill animation
├── CSSAnimatedItem.tsx         # CSS-only animated list item
├── CSSAnimatedList.tsx         # CSS-only animated list container
├── category-icons.tsx          # Help category icon mapping
├── ui/                         # Lightweight UI components (no heavy deps)
│   ├── index.ts                # Barrel exports
│   ├── WidgetButton.tsx        # Button (CSS active:scale, no motion/react)
│   ├── WidgetInput.tsx         # Input (native, no motion/react)
│   ├── WidgetSelect.tsx        # Select (React Context, no @radix-ui)
│   ├── WidgetAvatar.tsx        # Avatar (pure React, no @radix-ui)
│   ├── WidgetCard.tsx          # Card (native div, no motion/react)
│   └── WidgetSpinner.tsx       # Spinner (SVG + CSS animation)
├── hooks/
│   ├── index.ts                # Barrel exports with JSDoc
│   ├── useWidgetConfig.ts      # Config fetching and state
│   ├── useConversations.ts     # Conversation CRUD operations
│   ├── useRealtimeMessages.ts  # Real-time message subscriptions
│   ├── useRealtimeConfig.ts    # Real-time config change subscriptions
│   ├── useTypingIndicator.ts   # Supabase presence for typing
│   ├── useConversationStatus.ts # Status change subscriptions
│   ├── useParentMessages.ts    # postMessage communication
│   ├── useSoundSettings.ts     # Sound preference persistence
│   ├── useVisitorPresence.ts   # Visitor presence tracking
│   ├── useVisitorAnalytics.ts  # Page visit analytics
│   ├── useKeyboardHeight.ts    # Mobile keyboard detection (Visual Viewport API)
│   ├── useLocationDetection.ts # Auto-detect location from URL patterns
│   └── useSystemTheme.ts       # System theme detection for widget
├── components/
│   ├── index.ts                # Barrel exports with JSDoc
│   ├── ContactForm.tsx         # User info collection form
│   ├── MessageBubble.tsx       # Single message display
│   ├── MessageInput.tsx        # Text input with actions
│   ├── WidgetHeader.tsx        # Header with nav
│   ├── WidgetNav.tsx           # Bottom navigation
│   ├── TakeoverBanner.tsx      # Human takeover notice
│   ├── TypingIndicator.tsx     # Agent typing dots
│   ├── FloatingButton.tsx      # Chat open/close button
│   ├── CallButton.tsx          # Click-to-call phone button
│   ├── QuickReplies.tsx        # AI-suggested quick reply buttons
│   ├── SatisfactionRating.tsx  # Post-conversation rating UI
│   ├── LocationPicker.tsx      # Location selection for multi-location agents
│   ├── LinkPreviewsWidget.tsx  # Rich link preview cards
│   ├── WidgetVoiceInput.tsx    # Voice recording (CSS animations)
│   ├── WidgetFileDropZone.tsx  # File drag-and-drop area
│   ├── WidgetFileAttachment.tsx # File preview/upload display
│   ├── WidgetAudioPlayer.tsx   # Audio playback with waveform
│   ├── WidgetMessageReactions.tsx # Emoji reaction picker
│   ├── WidgetEmojiPicker.tsx   # Full emoji picker
│   ├── WidgetPhoneInput.tsx    # Phone input with US/CA formatting
│   └── booking/
│       ├── index.ts            # Barrel exports
│       ├── DayPicker.tsx       # Date selection grid
│       ├── TimePicker.tsx      # Time slot selection
│       └── BookingConfirmed.tsx # Confirmation with calendar add
├── views/
│   ├── index.ts                # Barrel exports with JSDoc
│   ├── HomeView.tsx            # Home screen with announcements
│   ├── MessagesView.tsx        # Conversation list
│   ├── ChatView.tsx            # Active conversation
│   ├── HelpView.tsx            # Help center with search
│   └── NewsView.tsx            # News/announcements feed
└── utils/
    ├── index.ts                # Barrel exports with JSDoc
    ├── formatting.ts           # Time and text formatting
    ├── validation.ts           # Form validation utilities
    ├── session.ts              # Session/storage utilities
    ├── referrer.ts             # Referrer journey utilities
    └── url-stripper.ts         # URL extraction from message text
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

---

## Loading Strategy

The widget uses an **async loading** approach for optimal perceived performance.

### Loading Sequence

```
1. Page Load
   └── serve-widget edge function returns loader script (~1KB)

2. Loader Script Executes
   ├── Reads config from script attributes
   └── Loads chatpad-widget.js with async attribute (non-blocking)

3. chatpad-widget.js Initializes
   ├── Creates floating button immediately
   ├── Fetches widget config in background
   └── Creates hidden iframe

4. Button Click
   └── Widget container visibility toggled (instant)

5. Widget Ready
   └── Full interactivity available
```

### Loader Script Flow

The loader is served by the `serve-widget` edge function:

```javascript
(function() {
  'use strict';
  
  var script = document.currentScript;
  var config = {
    agentId: script.getAttribute('data-agent-id'),
    position: script.getAttribute('data-position') || 'bottom-right',
    primaryColor: script.getAttribute('data-primary-color') || '#3b82f6',
    appUrl: script.getAttribute('data-app-url'),
  };
  
  // Load the widget bundle directly (async, non-blocking)
  var widgetScript = document.createElement('script');
  widgetScript.src = config.appUrl + '/chatpad-widget.js';
  widgetScript.async = true;
  widgetScript.setAttribute('data-agent-id', config.agentId);
  widgetScript.setAttribute('data-position', config.position);
  widgetScript.setAttribute('data-primary-color', config.primaryColor);
  widgetScript.setAttribute('data-app-url', config.appUrl);
  document.head.appendChild(widgetScript);
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
  enableQuickReplies: boolean;
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

### Current Bundle Status

| Metric | Status |
|--------|--------|
| **Total Bundle (gzipped)** | ~275KB (Lighthouse reported) |
| motion/react | Removed from widget components ✓ |
| @radix-ui packages | Removed from widget components ✓ |
| @untitledui/icons | Tree-shaken (individual imports) |
| libphonenumber-js | Replaced with regex US/CA formatting ✓ |

> **Note**: Native widget components are implemented. Remaining bundle size is from React core (~40KB), Supabase client (~50KB), and shared dependencies. Further reduction requires code-splitting or lazy-loading additional features.

### Optimization Techniques Implemented

| Optimization | Description |
|--------------|-------------|
| Separate build entry | Widget bundle isolated from main app |
| Widget UI layer | Lightweight components without motion/react or @radix-ui |
| Native feature components | Voice, file, audio, reactions use CSS animations |
| Tree-shaken icons | Individual imports (~0.5KB per icon) |
| CSS animations | CSS `active:scale` and keyframes instead of Framer Motion |
| Async script loading | Non-blocking script load with `async` attribute |
| Ready handshake | No flicker on open via postMessage signal |
| Server-side link previews | No client-side fetch delay |

---

## Widget UI Layer

The widget uses its own lightweight UI components in `src/widget/ui/` instead of the main app's `src/components/ui/` components.

### Why Separate UI Components?

The main app UI components have dependencies that significantly increase bundle size:

| Main App Component | Heavy Dependencies |
|--------------------|-------------------|
| `Button` | `motion/react`, `@radix-ui/react-slot` |
| `Input` | `motion/react` (shake animation) |
| `Select` | `@radix-ui/react-select` (~15KB) |
| `Avatar` | `@radix-ui/react-avatar` |
| `Card` | `motion/react` (MotionCard variant) |
| `Tooltip` | `@radix-ui/react-tooltip` |

Widget UI components provide **exact visual and functional parity** without these dependencies:

| Widget Component | Implementation |
|------------------|----------------|
| `WidgetButton` | CSS `active:scale-[0.98]` transition |
| `WidgetInput` | Native `<input>` element |
| `WidgetSelect` | React Context + Portal (full keyboard nav) |
| `WidgetAvatar` | Pure React state for fallback handling |
| `WidgetCard` | Native `<div>` with Tailwind classes |
| `WidgetSpinner` | SVG + CSS animation |

### Widget UI Design Principles

1. **Exact CSS Class Match**: All Tailwind classes copied verbatim from main app
2. **Same API Surface**: Props and usage identical to main components
3. **WCAG 2.2 Compliant**: Focus rings, ARIA attributes, keyboard navigation
4. **44px Touch Targets**: Minimum touch target size for mobile

---

## Native Feature Components

All feature-rich components have been reimplemented without heavy dependencies:

| Component | Replaces | Implementation |
|-----------|----------|----------------|
| `WidgetVoiceInput` | motion/react animations | CSS pulse keyframes |
| `WidgetFileDropZone` | motion/react + sonner | Inline error display |
| `WidgetFileAttachment` | motion/react | Pure React state |
| `WidgetAudioPlayer` | motion/react | Canvas waveform + CSS |
| `WidgetMessageReactions` | @radix-ui/react-popover | React Context popover |
| `WidgetEmojiPicker` | @radix-ui/react-tabs | React state tabs |
| `WidgetPhoneInput` | N/A | libphonenumber-js/min for international formatting with country detection |

### Allowed Main App Imports

These main app components are lightweight and can be used in the widget:

- `Textarea` - Native element, CVA only
- `Badge` - Native div, CVA only
- `CSSBubbleBackground` - CSS-only animations

---

## Icon Tree-Shaking

### Requirements

Icons **MUST** use individual imports for proper tree-shaking:

```typescript
// ✅ CORRECT - Individual imports (~0.5KB per icon)
import { Send01 } from '@untitledui/icons/react/icons/Send01';
import { Check } from '@untitledui/icons/react/icons/Check';

// ❌ WRONG - Barrel import (loads entire ~80KB library)
import { Send01, Check } from '@untitledui/icons';
```

### Widget Icon Architecture

All widget icons are centralized in `src/widget/icons.tsx`:

```typescript
// src/widget/icons.tsx - Re-exports with individual imports
export { Send01 } from '@untitledui/icons/react/icons/Send01';
export { Microphone01 } from '@untitledui/icons/react/icons/Microphone01';
export { Check } from '@untitledui/icons/react/icons/Check';
// ... ~25 icons total
```

Widget files import from the local icons file:

```typescript
// ✅ CORRECT - Import from widget icons
import { Send01, Check } from '../icons';

// ❌ WRONG - Direct import from @untitledui/icons
import { Send01 } from '@untitledui/icons';
```

### Dynamic Category Icons

Help category icons use dynamic imports with individual paths:

```typescript
// src/widget/category-icons.tsx
const iconModules: Record<string, () => Promise<{ default: ComponentType }>> = {
  'BookOpen01': () => import('@untitledui/icons/react/icons/BookOpen01'),
  'HelpCircle': () => import('@untitledui/icons/react/icons/HelpCircle'),
  // Only icons actually used are loaded
};
```

---

## Security

- **XSS Protection**: DOMPurify sanitization for all rendered HTML (allowlisted tags)
- **Spam Protection**: Honeypot fields + timing-based detection
- **Rate Limiting**: Server-side limits on form submissions
- **RLS Policies**: Public access restricted to widget-channel conversations only
- **CSP Headers**: Content Security Policy allowing iframe embedding

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md)
- [Edge Functions](./EDGE_FUNCTIONS.md)
- [Security](./SECURITY.md)
- [AI Architecture](./AI_ARCHITECTURE.md)
