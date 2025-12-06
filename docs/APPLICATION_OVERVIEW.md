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

---

## Core Features

### 1. Dashboard
**Location:** `src/pages/Dashboard.tsx`

Overview of key metrics: conversations, agents, leads, usage.

### 2. AI Agents
**Location:** `src/pages/Agents.tsx`, `src/pages/AgentConfig.tsx`

Create and configure agents with system prompts, knowledge sources, help center content, webhooks, and embed settings.

### 3. Conversations
**Location:** `src/pages/Conversations.tsx`

View, search, filter conversations with human takeover capability and real-time messaging.

### 4. Leads
**Location:** `src/pages/Leads.tsx`

Manage captured leads with status updates and conversation linking.

### 5. Analytics
**Location:** `src/pages/Analytics.tsx`

Track performance with metrics, charts, and scheduled reports.

### 6. Settings
**Location:** `src/pages/Settings.tsx`

Configure profile, team, notifications, API keys, subscriptions, and domains.

### 7. Widget
**Location:** `src/pages/WidgetPage.tsx`, `src/widget/`

Embeddable chat interface with AI conversations, help center, and contact forms.

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
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client
│   │       └── types.ts           # Generated types (read-only)
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── utils.ts               # General utilities
│   │   ├── formatting.ts          # Date formatting
│   │   ├── time-formatting.ts     # Time/name formatting (shared)
│   │   └── color-utils.ts         # Color manipulation
│   │
│   ├── pages/                     # Route pages
│   │
│   ├── widget/                    # Widget (modular architecture)
│   │   ├── ChatWidget.tsx         # Orchestrator (~530 lines)
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── constants.ts           # CSS vars, lazy imports
│   │   ├── api.ts                 # Widget API functions
│   │   ├── hooks/                 # 9 custom hooks
│   │   ├── components/            # 8 UI components
│   │   ├── views/                 # 4 view components
│   │   └── utils/                 # 5 utility modules
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
│   └── migrations/                # Database migrations (read-only)
│
├── tailwind.config.ts             # Tailwind configuration
└── vite.config.ts                 # Vite configuration
```

---

## Key Components

### Layout Components

**`AppLayout`** - Main application shell with sidebar and header.

**`AgentConfigLayout`** - Agent configuration page with sticky tab navigation.

### Agent Components

**`AgentCard`** - Agent list item with status and quick actions.

**`AgentSettingsLayout`** - Side menu navigation for settings tabs.

### Widget Components (Modular)

**`ChatWidget`** - Orchestrator component (~530 lines).

**`HomeView`**, **`ChatView`**, **`HelpView`**, **`MessagesView`** - View components.

**`MessageBubble`**, **`MessageInput`**, **`ContactForm`** - UI components.

---

## Development Guide

### Running Locally

```bash
npm install
npm run dev
```

### Code Conventions

- **Components**: PascalCase, one per file
- **Hooks**: camelCase with `use` prefix, in `src/hooks/`
- **Utilities**: camelCase, in `src/lib/` or `src/utils/`

### Styling Guidelines

Use Tailwind with design system tokens:

```tsx
// ✅ Correct - use semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Wrong - direct colors
<div className="bg-white text-black border-gray-200">
```

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md)
- [Widget Architecture](./WIDGET_ARCHITECTURE.md)
- [Edge Functions](./EDGE_FUNCTIONS.md)
- [Security](./SECURITY.md)
