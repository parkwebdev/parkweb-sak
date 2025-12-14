# ChatPad Application Overview

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [Design System](./DESIGN_SYSTEM.md), [ChatPad Architecture](./CHATPAD_ARCHITECTURE.md)

Comprehensive overview of the ChatPad AI agent platform.

---

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
| **Framer Motion** | Animations |

### Design

| Element | Choice |
|---------|--------|
| **Font** | Geist (primary), Geist Mono (code) |
| **Icons** | UntitledUI Icons (never Lucide) |
| **Colors** | HSL-based semantic tokens |

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
│   ├── README.md                  # Documentation index
│   ├── DESIGN_SYSTEM.md           # Design tokens & standards
│   ├── HOOKS_REFERENCE.md         # Custom hooks reference
│   ├── APPLICATION_OVERVIEW.md    # This file
│   ├── CHATPAD_ARCHITECTURE.md    # System architecture
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
│   │   │   ├── tabs/              # Agent config tab content
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
- [Hooks Reference](./HOOKS_REFERENCE.md) - Custom hooks
- [ChatPad Architecture](./CHATPAD_ARCHITECTURE.md) - System architecture
- [Database Schema](./DATABASE_SCHEMA.md) - Database reference
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget details
