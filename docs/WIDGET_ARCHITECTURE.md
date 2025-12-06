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

### Entry Points

```
src/
├── main.tsx              # Main app entry (full application)
├── widget-entry.tsx      # Widget entry (minimal, no providers)
└── widget/
    ├── ChatWidget.tsx    # Main widget component (~2,600 lines)
    ├── api.ts            # Widget API functions and types
    ├── NavIcons.tsx      # Navigation icons with fill animation
    ├── CSSAnimatedItem.tsx  # CSS-only animated list item
    ├── CSSAnimatedList.tsx  # CSS-only animated list container
    └── category-icons.tsx   # Help category icon mapping
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

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];  // For select type
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
      // Add new message to state
      // Extract cached link previews from metadata
      const linkPreviews = payload.new.metadata?.link_previews;
      setMessages(prev => [...prev, { ...payload.new, linkPreviews }]);
    }
  )
  .subscribe();
```

### Conversation Status Subscriptions

Widget subscribes to conversation status changes:

```typescript
const channel = supabase
  .channel(`conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'conversations',
      filter: `id=eq.${conversationId}`
    },
    (payload) => {
      if (payload.new.status === 'human_takeover') {
        setIsHumanTakeover(true);
      }
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
    setTypingAgentName(payload.payload.name);
  }
});
```

### Message Reactions (Bidirectional)

Emoji reactions sync in real-time between widget and admin:

```typescript
// Update reaction via edge function
await updateMessageReaction(messageId, emoji, visitorId);

// Listen for reaction updates
channel.on(
  'postgres_changes',
  { event: 'UPDATE', table: 'messages' },
  (payload) => {
    const reactions = payload.new.metadata?.reactions;
    updateMessageReactions(payload.new.id, reactions);
  }
);
```

---

## Server-Side Link Preview Caching

Link previews are fetched once on the server when messages are created, eliminating client-side fetching delays.

### Architecture

```
1. User/AI sends message with URL
   └── widget-chat edge function

2. Server extracts URLs (max 3)
   └── URL_REGEX pattern matching

3. Server fetches preview metadata
   └── Calls fetch-link-preview edge function internally

4. Previews stored in message metadata
   └── message.metadata.link_previews = [...]

5. Frontend renders cached previews instantly
   └── No client-side fetching needed
```

### Implementation

```typescript
// widget-chat edge function
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;

async function fetchLinkPreviews(content: string): Promise<LinkPreviewData[]> {
  const urls = content.match(URL_REGEX);
  if (!urls) return [];
  
  const uniqueUrls = [...new Set(urls)].slice(0, 3);
  const previews = await Promise.all(
    uniqueUrls.map(async (url) => {
      const response = await supabase.functions.invoke('fetch-link-preview', {
        body: { url }
      });
      return response.data;
    })
  );
  
  return previews.filter(p => p && p.title);
}

// Store in message metadata
const messageMetadata = {
  ...existingMetadata,
  link_previews: await fetchLinkPreviews(assistantMessage)
};
```

### Frontend Usage

```typescript
// LinkPreviews component
interface LinkPreviewsProps {
  content: string;
  compact?: boolean;
  cachedPreviews?: LinkPreviewData[];  // From message metadata
}

// If cachedPreviews provided, render instantly (no loading)
// Fallback to client-side fetching for older messages without cache
```

### Benefits

- **Instant rendering**: No loading flash on page refresh
- **Reduced API calls**: Preview fetched once per URL, not per viewer
- **Consistent experience**: All users see the same preview
- **Offline support**: Cached data available without network

---

## Visitor Analytics

### Visitor Identification

Each widget visitor gets a unique, persistent identifier:

```typescript
const [visitorId] = useState(() => {
  const stored = localStorage.getItem(`chatpad_visitor_id_${agentId}`);
  if (stored) return stored;
  const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(`chatpad_visitor_id_${agentId}`, newId);
  return newId;
});
```

### Page Visit Tracking

Parent window sends page info via postMessage:

```typescript
// Parent window (chatpad-widget.js)
function sendPageInfo() {
  iframe.contentWindow.postMessage({
    type: 'chatpad-parent-page-info',
    url: window.location.href,
    referrer: document.referrer,
    utmParams: parseUtmParams(window.location.href)
  }, '*');
}

// Widget receives and tracks
window.addEventListener('message', (event) => {
  if (event.data.type === 'chatpad-parent-page-info') {
    trackPageVisit(event.data.url);
    captureReferrerJourney(event.data);
  }
});
```

### Referrer Journey Capture

```typescript
interface ReferrerJourney {
  referrer_url: string | null;
  landing_page: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  entry_type: 'direct' | 'organic' | 'paid' | 'social' | 'referral' | 'email';
}

// Entry type detection
function detectEntryType(referrer: string | null): EntryType {
  if (!referrer) return 'direct';
  if (/google\.|bing\.|yahoo\./.test(referrer)) return 'organic';
  if (/facebook\.|instagram\.|twitter\./.test(referrer)) return 'social';
  if (/mail\.|gmail\.|outlook\./.test(referrer)) return 'email';
  return 'referral';
}
```

### Real-Time Page Updates

Page visits are sent to the server in real-time:

```typescript
// update-page-visits edge function
await updatePageVisit(conversationId, {
  url: currentUrl,
  entered_at: timestamp,
  duration_ms: previousPageDuration
}, referrerJourney, visitorId);
```

### Internal URL Filtering

Widget.html and internal URLs are excluded from analytics:

```typescript
function isInternalWidgetUrl(url: string): boolean {
  return url.includes('widget.html') || url.includes('widget-entry');
}
```

---

## Performance Optimizations

### Bundle Size

| Optimization | Savings |
|--------------|---------|
| Separate entry point | ~600KB |
| Minimal CSS | ~35KB |
| CSS animations (vs Framer Motion) | ~40-50KB |
| Lazy-loaded components | ~30KB initial |
| **Total Bundle** | **~50KB gzipped** |

### Lazy-Loaded Components

Heavy components load on demand:

```typescript
// ChatWidget.tsx
const VoiceInput = lazy(() => import('./VoiceInput'));
const FileDropZone = lazy(() => import('./FileDropZone'));
const MessageReactions = lazy(() => import('./MessageReactions'));
const AudioPlayer = lazy(() => import('./AudioPlayer'));
const PhoneInputField = lazy(() => import('./PhoneInputField'));
```

### CSS-Only Animations

Framer Motion replaced with pure CSS for most animations:

```css
/* List item stagger animation */
@keyframes widget-item-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.widget-animated-item {
  animation: widget-item-enter 0.3s ease-out forwards;
  animation-delay: calc(var(--stagger-index) * 50ms);
}
```

### Bubble Background (CSS-Only)

The animated gradient background uses CSS keyframes instead of JS:

```css
@keyframes moveVertical {
  0%, 100% { transform: translateY(-50%); }
  50% { transform: translateY(50%); }
}

@keyframes moveInCircle {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.bubble {
  animation: moveVertical 30s ease-in-out infinite;
}
```

### Resource Hints

Preconnect hints warm DNS/TCP on button hover:

```javascript
function addPreconnectHints() {
  var link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = appUrl;
  document.head.appendChild(link);
}
```

---

## Security

### XSS Protection

All user-generated HTML is sanitized with DOMPurify:

```typescript
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'span', 'div', 'img'
];

const sanitizedHtml = DOMPurify.sanitize(content, {
  ALLOWED_TAGS,
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt']
});
```

### Spam Protection

Contact form includes multiple spam prevention layers:

1. **Honeypot Field**: Hidden field that bots fill out
2. **Timing Check**: Reject submissions < 2 seconds
3. **Rate Limiting**: One submission per email per minute

```typescript
// create-widget-lead edge function
if (honeypot) {
  return { error: 'Spam detected' };
}

if (Date.now() - formLoadTime < 2000) {
  return { error: 'Too fast' };
}

const recentSubmission = await supabase
  .from('leads')
  .select('created_at')
  .eq('email', email)
  .gte('created_at', oneMinuteAgo)
  .single();

if (recentSubmission.data) {
  return { error: 'Rate limited' };
}
```

### Input Validation

Phone numbers validated and formatted with libphonenumber-js:

```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const phone = parsePhoneNumber(value);
if (!isValidPhoneNumber(value)) {
  setError('Invalid phone number');
}
```

### Edge Function Authorization

Server-side validation for all sensitive operations:

```typescript
// send-human-message - Uses JWT token, not request body
const { data: { user } } = await supabase.auth.getUser();
const senderId = user?.id; // From JWT, not trusted parameter

// update-page-visits - Validates visitorId ownership
if (conversation.metadata?.visitor_id !== visitorId) {
  return new Response('Forbidden', { status: 403 });
}
```

---

## Embedding the Widget

### Basic Installation

```html
<script 
  src="https://your-project.supabase.co/functions/v1/serve-widget"
  data-agent-id="your-agent-id"
  data-position="bottom-right"
  async
></script>
```

### Configuration Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-agent-id` | Agent UUID (required) | - |
| `data-position` | `bottom-right` \| `bottom-left` | `bottom-right` |
| `data-primary-color` | Override primary color (hex) | Agent config |

### Custom Domain

For white-label deployments with custom domains:

```html
<script 
  src="https://chat.yourdomain.com/widget.js"
  data-agent-id="your-agent-id"
  async
></script>
```

---

## Mobile Behavior

### Full-Screen Mode

On mobile (≤480px), widget displays full-screen without rounded corners:

```javascript
// chatpad-widget.js
if (window.innerWidth <= 480) {
  iframe.style.borderRadius = '0';
  container.style.width = '100%';
  container.style.height = '100%';
}
```

### Touch Optimizations

- Touch events trigger preloading
- Larger touch targets for buttons
- Native scroll momentum

---

## Conversation Persistence

### Local Storage

Session and conversation data stored locally:

```typescript
// Keys (all scoped by agentId)
`chatpad_user_${agentId}`              // Contact form data + leadId
`chatpad_conversations_${agentId}`     // Conversation history
`chatpad_visitor_id_${agentId}`        // Unique visitor identifier
`chatpad_referrer_journey_${agentId}`  // Referrer/UTM data on first visit
`chatpad_sound_enabled_${agentId}`     // Sound preference (true/false)
`chatpad_last_read_${agentId}_${conversationId}`     // Last read timestamp
`chatpad_takeover_noticed_${agentId}_${conversationId}` // Takeover notice shown flag
```

### Database Linkage

When contact form is submitted:
1. Lead created in `leads` table
2. Conversation created in `conversations` table
3. `lead_id` stored in conversation metadata
4. Future messages linked to conversation

```typescript
// Metadata structure
conversation.metadata = {
  lead_id: 'uuid',
  session_id: 'string',
  visitor_id: 'string',
  ip_address: '1.2.3.4',
  country: 'US',
  device_type: 'mobile',
  browser: 'Safari',
  referrer: 'https://...',
  page_visits: [...],
  referrer_journey: {...}
};
```

---

## Related Documentation

- [Widget Refactoring Plan](./WIDGET_REFACTORING_PLAN.md) - Detailed refactoring strategy
- [Animation & Motion Guide](./ANIMATION_MOTION_GUIDE.md) - CSS animation patterns
- [Database Schema](./DATABASE_SCHEMA.md) - Conversations and messages tables
