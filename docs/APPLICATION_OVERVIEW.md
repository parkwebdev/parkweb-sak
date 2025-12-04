# ChatPad Application Overview

Comprehensive overview of the ChatPad AI agent platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Core Features](#core-features)
4. [Architecture](#architecture)
5. [Directory Structure](#directory-structure)
6. [Key Components](#key-components)
7. [Development Guide](#development-guide)

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
| **UntitledUI Icons** | Icon set |
| **Sonner** | Toast notifications |
| **Tiptap** | Rich text editor |
| **Recharts** | Charts and graphs |

### Development Tools

| Tool | Purpose |
|------|---------|
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **date-fns** | Date utilities |
| **libphonenumber-js** | Phone validation |
| **DOMPurify** | HTML sanitization |

---

## Core Features

### 1. Dashboard

**Location:** `src/pages/Dashboard.tsx`

Overview of key metrics:
- Total conversations
- Active agents
- New leads
- Usage metrics

### 2. AI Agents

**Location:** `src/pages/Agents.tsx`, `src/pages/AgentConfig.tsx`

Agent management:
- Create and configure agents
- Set AI model and parameters
- Configure system prompts
- Manage knowledge sources
- Design help center content
- Configure webhook integrations
- Customize embed settings

### 3. Conversations

**Location:** `src/pages/Conversations.tsx`

Conversation management:
- View all conversations
- Search and filter
- Human takeover
- Real-time messaging
- View visitor metadata

### 4. Leads

**Location:** `src/pages/Leads.tsx`

Lead management:
- View captured leads
- Update lead status
- View linked conversations
- Export lead data

### 5. Analytics

**Location:** `src/pages/Analytics.tsx`

Performance tracking:
- Conversation metrics
- Lead conversion rates
- Agent performance
- Scheduled reports

### 6. Settings

**Location:** `src/pages/Settings.tsx`

Configuration:
- Profile settings
- Team management
- API keys
- Notification preferences
- Subscription management
- Custom domains

### 7. Widget

**Location:** `src/pages/WidgetPage.tsx`, `src/widget/ChatWidget.tsx`

Embeddable chat interface:
- AI conversations
- Help center
- Contact forms
- Announcements

---

## Architecture

### Access Control Model

ChatPad uses a **user-based ownership** model with team sharing:

```
┌─────────────────────────────────────────────────┐
│                    Owner                         │
│                  (user_id)                       │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Agents  │  │  Leads  │  │Webhooks │  ...    │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                  │
├─────────────────────────────────────────────────┤
│              Team Members                        │
│         (via team_members table)                 │
│                                                  │
│  Member 1    Member 2    Member 3               │
│  (read/write access to owner's resources)       │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Widget  │────▶│ Edge Function │────▶│ Database │
└──────────┘     └──────────────┘     └──────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   AI Model   │
                 │  (via RAG)   │
                 └──────────────┘
```

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

## Directory Structure

```
chatpad/
├── docs/                          # Documentation
│   ├── APPLICATION_OVERVIEW.md    # This file
│   ├── CHATPAD_ARCHITECTURE.md    # System architecture
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
│   │   │   ├── tabs/              # Agent config tab content
│   │   │   ├── embed/             # Widget embed settings
│   │   │   └── webhooks/          # Webhook configuration
│   │   │
│   │   ├── analytics/             # Analytics components
│   │   ├── chat/                  # Chat UI components
│   │   ├── conversations/         # Conversation management
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
│   │   ├── useAgents.ts           # Agent data management
│   │   ├── useAuth.ts             # Authentication hook
│   │   ├── useConversations.ts    # Conversation data
│   │   ├── useLeads.ts            # Lead data management
│   │   ├── useTeam.ts             # Team management
│   │   └── ...
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client
│   │       └── types.ts           # Generated types (read-only)
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── utils.ts               # General utilities
│   │   ├── formatting.ts          # Date/number formatting
│   │   ├── color-utils.ts         # Color manipulation
│   │   └── ...
│   │
│   ├── pages/                     # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Agents.tsx
│   │   ├── AgentConfig.tsx
│   │   ├── Conversations.tsx
│   │   ├── Leads.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   ├── Auth.tsx
│   │   └── WidgetPage.tsx         # Widget entry page
│   │
│   ├── types/                     # TypeScript types
│   │   └── team.ts
│   │
│   ├── utils/                     # Utility functions
│   │   ├── logger.ts              # Logging utility
│   │   └── validation.ts          # Input validation
│   │
│   ├── widget/                    # Widget components
│   │   ├── ChatWidget.tsx         # Main widget component
│   │   ├── api.ts                 # Widget API functions
│   │   ├── CSSBubbleBackground.tsx
│   │   ├── CSSAnimatedList.tsx
│   │   └── ...
│   │
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Main app entry
│   ├── widget-entry.tsx           # Widget entry (separate build)
│   ├── index.css                  # Main stylesheet
│   └── widget.css                 # Widget stylesheet (minimal)
│
├── supabase/
│   ├── config.toml                # Supabase configuration
│   ├── functions/                 # Edge functions
│   │   ├── widget-chat/
│   │   ├── get-widget-config/
│   │   ├── create-widget-lead/
│   │   └── ...
│   └── migrations/                # Database migrations (read-only)
│
├── tailwind.config.ts             # Tailwind configuration
├── vite.config.ts                 # Vite configuration
└── package.json                   # Dependencies
```

---

## Key Components

### Layout Components

**`AppLayout`** (`src/components/layout/AppLayout.tsx`)
- Main application shell
- Sidebar navigation
- Header with search and notifications

**`AgentConfigLayout`** (`src/components/agents/AgentConfigLayout.tsx`)
- Agent configuration page layout
- Sticky tab navigation
- Consistent header styling

### Agent Components

**`AgentCard`** (`src/components/agents/AgentCard.tsx`)
- Agent list item display
- Status badge
- Quick actions

**`AgentSettingsLayout`** (`src/components/agents/AgentSettingsLayout.tsx`)
- Side menu navigation for settings tabs
- Dynamic descriptions
- Reusable across Knowledge, Tools, Configure

### Conversation Components

**`ConversationsTable`** (`src/components/conversations/ConversationsTable.tsx`)
- Conversation list with search/filter
- Status indicators
- Takeover actions

**`ConversationDetailsSheet`** (`src/components/conversations/ConversationDetailsSheet.tsx`)
- Conversation detail sidebar
- Message history
- Takeover controls
- Metadata display

### Widget Components

**`ChatWidget`** (`src/widget/ChatWidget.tsx`)
- Main widget interface
- Multi-view navigation (home, chat, help)
- Real-time message handling

**`CSSBubbleBackground`** (`src/widget/CSSBubbleBackground.tsx`)
- Animated gradient background
- Pure CSS animations (no JS)
- Lava lamp effect

---

## Development Guide

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Code Conventions

**Components:**
- PascalCase for component names
- One component per file
- Props interface defined inline or exported

**Hooks:**
- camelCase with `use` prefix
- Located in `src/hooks/`
- Return object with named values

**Utilities:**
- camelCase function names
- Located in `src/lib/` or `src/utils/`
- Pure functions where possible

### State Management

| Type | Tool | Use Case |
|------|------|----------|
| **Server State** | TanStack Query | API data |
| **Global State** | React Context | Auth, theme |
| **Local State** | useState/useReducer | Component state |
| **URL State** | React Router | Navigation |

### Styling Guidelines

Use Tailwind with design system tokens:

```tsx
// ✅ Correct - use semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Wrong - direct colors
<div className="bg-white text-black border-gray-200">
```

### Testing the Widget

1. Open `public/widget-test.html` in browser
2. Or use the preview in Agent Config → Embed tab

### Edge Function Development

```bash
# Deploy all functions
supabase functions deploy

# View logs
supabase functions logs function-name
```

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Complete database reference
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget technical details
- [Edge Functions](./EDGE_FUNCTIONS.md) - API documentation
- [Architecture](./CHATPAD_ARCHITECTURE.md) - System architecture
- [Security](./SECURITY.md) - Security implementation
