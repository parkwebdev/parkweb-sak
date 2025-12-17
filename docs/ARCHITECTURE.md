# ChatPad Architecture

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [AI Architecture](./AI_ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Security](./SECURITY.md)

Comprehensive system architecture for the ChatPad AI agent platform.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [System Overview](#system-overview)
4. [Access Control Model](#access-control-model)
5. [Core Features](#core-features)
6. [AI Integration](#ai-integration)
7. [Deployment Methods](#deployment-methods)
8. [Data Flow](#data-flow)
9. [Directory Structure](#directory-structure)
10. [Key Components](#key-components)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Integration Points](#integration-points)
13. [Scaling Considerations](#scaling-considerations)
14. [Development Guide](#development-guide)

---

## Introduction

ChatPad is a multi-tenant AI agent platform for building, deploying, and managing conversational AI agents. It enables businesses to:

- **Deploy AI Agents**: Embeddable chat widgets for websites
- **Knowledge Management**: RAG-powered responses using custom knowledge bases
- **Conversation Handling**: Monitor, search, and intervene in conversations
- **Lead Capture**: Collect visitor information through configurable forms
- **Analytics**: Track performance metrics and generate reports
- **Team Collaboration**: Share access with team members

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router DOM** | Client-side routing |
| **TanStack Query** | Data fetching and caching |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| PostgreSQL | Database |
| Row Level Security | Access control |
| Realtime | WebSocket subscriptions |
| Storage | File uploads |
| Edge Functions | Serverless API (Deno) |
| Auth | Authentication |

### UI Components

| Library | Purpose |
|---------|---------|
| **Radix UI** | Accessible primitives |
| **shadcn/ui** | Component library |
| **UntitledUI Icons** | Icon set (never Lucide) |
| **Sonner** | Toast notifications |
| **Tiptap** | Rich text editor |
| **Recharts** | Charts and graphs |
| **Framer Motion** | Animations |

### Design

| Element | Choice |
|---------|--------|
| **Font** | Geist (primary), Geist Mono (code) |
| **Icons** | UntitledUI Icons |
| **Colors** | HSL-based semantic tokens |

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Admin App     │   Widget        │   External API              │
│   (React SPA)   │   (Embedded)    │   (REST)                    │
└────────┬────────┴────────┬────────┴──────────┬──────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Auth          │   Edge Functions │   Realtime                 │
│   (JWT)         │   (Deno)         │   (WebSocket)              │
└────────┬────────┴────────┬────────┴──────────┬──────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │   Row Level     │   Storage                   │
│   (Tables)      │   Security      │   (Buckets)                 │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Core Entities

| Entity | Description |
|--------|-------------|
| **User** | Account owner with subscription |
| **Team Member** | User with access to another user's resources |
| **Agent** | AI chatbot configuration (single agent "Ari" per user) |
| **Conversation** | Chat session with a widget visitor |
| **Lead** | Contact information captured from widget |
| **Knowledge Source** | RAG data for agent responses |

---

## Access Control Model

### Ownership Pattern

Resources are owned by users via `user_id` column:

```sql
CREATE TABLE agents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,  -- Owner
  name text NOT NULL,
  -- ...
);
```

### Team Sharing

Team members gain access through `team_members` table:

```sql
CREATE TABLE team_members (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,   -- Resource owner
  member_id uuid NOT NULL,  -- Team member
  role text DEFAULT 'member'
);
```

### Access Function

The `has_account_access()` function checks ownership OR team membership:

```sql
CREATE FUNCTION has_account_access(account_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = account_owner_id 
     OR EXISTS (
       SELECT 1 FROM team_members 
       WHERE owner_id = account_owner_id 
         AND member_id = auth.uid()
     )
$$;
```

### RLS Implementation

```sql
-- Typical policy pattern
CREATE POLICY "Users can view accessible agents"
ON agents FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can create their own agents"
ON agents FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Role Hierarchy

```
super_admin
    │
    ▼
  admin ─────────┐
    │            │
    ▼            ▼
 manager      (all permissions)
    │
    ▼
 member
    │
    ▼
 client
```

**Role Capabilities:**

| Role | Capabilities |
|------|-------------|
| `super_admin` | Full platform access, manage plans |
| `admin` | Manage team, all resource access |
| `manager` | Manage agents, conversations, leads |
| `member` | View and respond to conversations |
| `client` | Limited view access |

### Real-time Architecture

```
┌──────────┐                    ┌──────────┐
│  Widget  │◀───────────────────│  Admin   │
│ (iframe) │    Supabase        │   App    │
└──────────┘    Realtime        └──────────┘
      │              │                │
      │         ┌────┴────┐          │
      └────────▶│ Channel │◀─────────┘
                └─────────┘
                     │
              ┌──────┴──────┐
              │  Messages   │
              │  Status     │
              │  Typing     │
              └─────────────┘
```

---

## Core Features

### 1. Dashboard
**Location:** `src/pages/Dashboard.tsx`

Overview of key metrics: conversations, agents, leads, usage with sparkline trends.

### 2. Ari (AI Agent)
**Location:** `src/pages/AriConfigurator.tsx`

Single-agent architecture with comprehensive configuration:
- System prompts and model selection
- Behavior parameters (temperature, top P, etc.)
- Knowledge sources (PDFs, URLs, sitemaps)
- Help center content and news
- Custom tools and webhooks
- Widget embed settings
- Locations and integrations

### 3. Inbox (Conversations)
**Location:** `src/pages/Conversations.tsx`

View, search, and filter conversations with:
- Real-time messaging
- Human takeover capability
- Typing indicators
- Message reactions
- Lead context

### 4. Leads
**Location:** `src/pages/Leads.tsx`

Manage captured leads with status tracking and conversation linking.

### 5. Analytics
**Location:** `src/pages/Analytics.tsx`

Track performance with:
- Metrics and KPIs
- Charts and trends
- Data tables
- Scheduled reports

### 6. Planner (Calendar)
**Location:** `src/pages/Planner.tsx`

Calendar with:
- Month/Week/Day views
- Drag-and-drop scheduling
- Recurring events
- Conflict detection

### 7. Settings
**Location:** `src/pages/Settings.tsx`

Configure:
- Profile and preferences
- Team members and roles
- Notification settings
- Subscription and usage
- API keys

### 8. Widget
**Location:** `src/pages/WidgetPage.tsx`, `src/widget/`

Embeddable chat interface with:
- AI conversations
- Help center
- Contact forms
- Voice messages
- File attachments

---

## AI Integration

### RAG Pipeline

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Query   │────▶│   Embed      │────▶│   Vector     │
│          │     │   Query      │     │   Search     │
└──────────┘     └──────────────┘     └──────────────┘
                                            │
                                            ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Response │◀────│   Generate   │◀────│   Augment    │
│          │     │   Response   │     │   Prompt     │
└──────────┘     └──────────────┘     └──────────────┘
```

### Knowledge Processing

1. **Upload**: User uploads PDF, URL, CSV, etc.
2. **Extract**: Content extracted from source
3. **Chunk**: Content split into chunks
4. **Embed**: Qwen3 generates vector embeddings (via OpenRouter)
5. **Store**: Vectors stored in `knowledge_chunks`

### Vector Search

```sql
CREATE FUNCTION search_knowledge_chunks(
  p_agent_id uuid,
  p_query_embedding vector(1024),
  p_match_threshold float DEFAULT 0.4,
  p_match_count int DEFAULT 5
)
RETURNS TABLE(...)
```

### Model Selection

Available models via OpenRouter:

| Model | Use Case | Cost |
|-------|----------|------|
| `google/gemini-2.5-flash` | Fast, economical (default) | $ |
| `google/gemini-2.5-flash-lite` | Simple queries | $ |
| `google/gemini-2.5-pro` | Complex reasoning | $$ |
| `openai/gpt-4o` | High quality | $$$ |
| `anthropic/claude-sonnet-4` | Nuanced responses | $$$ |

See [AI Architecture](./AI_ARCHITECTURE.md) for complete details.

---

## Deployment Methods

### 1. Embeddable Widget

Primary deployment method - JavaScript snippet for websites:

```html
<script 
  src="https://project.supabase.co/functions/v1/serve-widget"
  data-agent-id="uuid"
  async
></script>
```

**Features:**
- Floating chat button
- Customizable appearance
- Help center integration
- Contact form capture
- Voice messages
- File attachments

### 2. Hosted Chat Page

Direct link to full-page chat interface:

```
https://app.chatpad.com/widget/[agent-id]
```

**Use Cases:**
- QR codes
- Email signatures
- Social media links

### 3. API Access

REST API for custom integrations:

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    agentId: 'uuid',
    conversationId: 'uuid',
    message: 'Hello!'
  })
});
```

---

## Data Flow

### Widget Conversation Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Visitor │────▶│  Widget  │────▶│ get-widget- │
│         │     │  Opens   │     │   config    │
└─────────┘     └──────────┘     └─────────────┘
                                       │
                                       ▼
┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Message │────▶│  Widget  │────▶│ widget-chat │
│  Sent   │     │          │     │ (with RAG)  │
└─────────┘     └──────────┘     └─────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
              ┌─────────────┐                    ┌─────────────┐
              │   Message   │                    │  AI Model   │
              │   Stored    │                    │  Response   │
              └─────────────┘                    └─────────────┘
```

### Human Takeover Flow

```
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│   Admin   │────▶│   Takeover   │────▶│  Status:      │
│  Clicks   │     │   Button     │     │  human_       │
│ "Takeover"│     │              │     │  takeover     │
└───────────┘     └──────────────┘     └───────────────┘
                                              │
                                              ▼
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│  Widget   │◀────│   Realtime   │◀────│   Takeover    │
│  Updates  │     │ Subscription │     │   Record      │
└───────────┘     └──────────────┘     └───────────────┘
                                              │
                                              ▼
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│  Human    │────▶│ send-human-  │────▶│   Message     │
│ Response  │     │   message    │     │  (realtime)   │
└───────────┘     └──────────────┘     └───────────────┘
```

### Lead Capture Flow

```
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│  Visitor  │────▶│   Contact    │────▶│ create-widget │
│  Fills    │     │    Form      │     │     -lead     │
│   Form    │     │              │     │               │
└───────────┘     └──────────────┘     └───────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                        ▼
                  ┌─────────────┐                         ┌─────────────┐
                  │    Lead     │                         │ Conversation│
                  │   Created   │◀────────────────────────│   Created   │
                  └─────────────┘      (linked)           └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   Webhook   │
                  │  Triggered  │
                  └─────────────┘
```

---

## Directory Structure

```
chatpad/
├── docs/                          # Documentation
│   ├── README.md                  # Documentation index
│   ├── ARCHITECTURE.md            # This file
│   ├── DESIGN_SYSTEM.md           # Design tokens & standards
│   ├── COMPONENT_PATTERNS.md      # Component & table patterns
│   ├── HOOKS_REFERENCE.md         # Custom hooks reference
│   ├── AI_ARCHITECTURE.md         # AI/RAG documentation
│   ├── DATABASE_SCHEMA.md         # Database reference
│   ├── EDGE_FUNCTIONS.md          # API documentation
│   ├── WIDGET_ARCHITECTURE.md     # Widget details
│   └── SECURITY.md                # Security documentation
│
├── public/                        # Static assets
│   ├── chatpad-widget.js          # Widget loader script
│   └── widget-test.html           # Widget testing page
│
├── src/
│   ├── assets/                    # Images and static files
│   │
│   ├── components/
│   │   ├── agents/                # Agent management components
│   │   │   ├── sections/          # Ari configurator sections
│   │   │   ├── embed/             # Widget embed settings
│   │   │   └── webhooks/          # Webhook configuration
│   │   ├── analytics/             # Analytics components
│   │   ├── calendar/              # Calendar components
│   │   ├── chat/                  # Chat UI components
│   │   ├── conversations/         # Conversation management
│   │   ├── data-table/            # Table components
│   │   ├── layout/                # App layout components
│   │   ├── leads/                 # Lead management
│   │   ├── notifications/         # Notification components
│   │   ├── settings/              # Settings components
│   │   ├── team/                  # Team management
│   │   └── ui/                    # Base UI components (shadcn)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   │
│   ├── hooks/                     # Custom React hooks
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client
│   │       └── types.ts           # Generated types (read-only)
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── utils.ts               # General utilities
│   │   ├── formatting.ts          # Date formatting
│   │   ├── time-formatting.ts     # Time/name formatting
│   │   └── color-utils.ts         # Color manipulation
│   │
│   ├── pages/                     # Route pages
│   │
│   ├── types/                     # TypeScript types
│   │
│   ├── utils/                     # Utility functions
│   │
│   ├── widget/                    # Widget (modular architecture)
│   │   ├── ChatWidget.tsx         # Orchestrator component
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── constants.ts           # CSS vars, lazy imports
│   │   ├── api.ts                 # Widget API functions
│   │   ├── hooks/                 # Widget-specific hooks
│   │   ├── ui/                    # Lightweight widget UI components
│   │   ├── components/            # Widget UI components
│   │   ├── views/                 # Widget view components
│   │   └── utils/                 # Widget utilities
│   │
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Main app entry
│   ├── widget-entry.tsx           # Widget entry (separate build)
│   ├── index.css                  # Design tokens & styles
│   └── widget.css                 # Widget stylesheet
│
├── supabase/
│   ├── config.toml                # Supabase configuration
│   ├── functions/                 # Edge functions
│   └── migrations/                # Database migrations (read-only)
│
├── tailwind.config.ts             # Tailwind configuration
└── vite.config.ts                 # Vite configuration
```

---

## Key Components

### Layout Components

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Main application shell with sidebar and header |
| `AppHeader` | Top navigation bar |
| `Sidebar` | Collapsible hover-expand navigation sidebar |

### Ari Configurator Components

| Component | Purpose |
|-----------|---------|
| `AriConfigurator` | Main 3-column configurator layout |
| `AriSectionMenu` | Left sidebar section navigation |
| `AriPreviewColumn` | Right widget preview column |
| `AriSystemPromptSection` | System prompt configuration |
| `AriModelBehaviorSection` | Model and behavior settings |
| `AriKnowledgeSection` | Knowledge source management |
| `AriCustomToolsSection` | Custom tool configuration |
| `AriAppearanceSection` | Widget appearance settings |
| `AriInstallationSection` | Embed code and installation |
| `AriLocationsSection` | Location management |
| `AriHelpArticlesSection` | Help center content |
| `AriNewsSection` | News/announcements content |
| `AriAnnouncementsSection` | Widget announcement banners |
| `AriWelcomeMessagesSection` | Greeting and quick replies |
| `AriLeadCaptureSection` | Contact form configuration |
| `AriWebhooksSection` | Webhook configuration |
| `AriApiAccessSection` | API key management |
| `AriIntegrationsSection` | Calendar and social integrations |

### Widget Components

| Component | Purpose |
|-----------|---------|
| `ChatWidget` | Orchestrator component |
| `HomeView` | Widget home with announcements |
| `ChatView` | Chat interface |
| `HelpView` | Help center |
| `MessagesView` | Conversation history |
| `MessageBubble` | Individual message |
| `MessageInput` | Text input with attachments |
| `ContactForm` | Lead capture form |

---

## Monitoring & Analytics

### Platform Metrics

Tracked in `usage_metrics` table:

- Conversations count
- Messages count
- API calls count
- Tokens used

### Agent Analytics

Available in Analytics dashboard:

- **Conversations**: Volume, duration, resolution
- **Messages**: Total, per conversation average
- **Leads**: Capture rate, conversion rate
- **Response Time**: AI response latency
- **User Satisfaction**: Star ratings from conversations

### Scheduled Reports

Automated reports via `scheduled_reports`:

- Daily/weekly/monthly summaries
- Custom metrics selection
- Email delivery to multiple recipients
- PDF export capability

### Security Monitoring

Logged to `security_logs`:

- Authentication events
- API key usage
- Team member changes
- Resource modifications

---

## Integration Points

### Webhooks

Subscribe to events:

| Event | Payload |
|-------|---------|
| `conversation.created` | Conversation data |
| `conversation.closed` | Conversation + summary |
| `message.received` | Message data |
| `lead.created` | Lead data |
| `takeover.started` | Takeover data |
| `takeover.ended` | Takeover data |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/widget-chat` | POST | Send/receive messages |
| `/get-widget-config` | POST | Fetch agent config |
| `/create-widget-lead` | POST | Create lead |
| `/send-human-message` | POST | Send human response |
| `/mark-messages-read` | POST | Mark messages as read |

### External Services

| Service | Purpose |
|---------|---------|
| **OpenRouter** | AI model access (unified API) |
| **Resend** | Email delivery |
| **Stripe** | Billing and subscriptions (planned) |

---

## Scaling Considerations

### Database

- Connection pooling via Supabase
- Vector indexes for knowledge search
- Partitioning for large tables (planned)

### Edge Functions

- Cold start optimization
- Response caching where appropriate
- Parallel database queries

### Widget

- Separate build (~50KB gzipped)
- Lazy-loaded components
- CSS-only animations where possible
- Preload on hover

### Real-time

- Channel-based subscriptions
- Presence for typing indicators
- Automatic reconnection

---

## Development Guide

### Running Locally

```bash
npm install
npm run dev
```

### Code Conventions

- **Components**: PascalCase, one per file
- **Hooks**: `use` prefix, in `src/hooks/`
- **Utilities**: camelCase, in `src/lib/` or `src/utils/`
- **Icons**: UntitledUI only, never Lucide

### Styling Guidelines

Use Tailwind with design system tokens:

```tsx
// ✅ Correct - use semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Wrong - direct colors
<div className="bg-white text-black border-gray-200">
```

See [Design System](./DESIGN_SYSTEM.md) for complete styling reference.

### Adding New Features

1. Check existing patterns in similar features
2. Create focused components (avoid monolithic files)
3. Use custom hooks for data and state
4. Add JSDoc comments
5. Follow design system tokens
6. Update documentation

---

## Related Documentation

- [Design System](./DESIGN_SYSTEM.md) - Colors, typography, spacing
- [Component Patterns](./COMPONENT_PATTERNS.md) - Component and table patterns
- [Hooks Reference](./HOOKS_REFERENCE.md) - Custom hooks
- [Database Schema](./DATABASE_SCHEMA.md) - Database reference
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget details
- [AI Architecture](./AI_ARCHITECTURE.md) - RAG and model details
- [Edge Functions](./EDGE_FUNCTIONS.md) - API documentation
- [Security](./SECURITY.md) - Security practices
