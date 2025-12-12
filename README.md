# ChatPad - AI Agent Platform

A comprehensive multi-tenant AI agent platform for building, deploying, and managing conversational AI agents with RAG (Retrieval Augmented Generation) capabilities.

---

## Features

- **AI Agents** - Create and configure agents with custom system prompts and model selection
- **Knowledge Base** - RAG-powered responses using PDFs, URLs, sitemaps, and more
- **Conversations** - Real-time messaging with human takeover capability
- **Leads** - Capture and manage leads from widget conversations
- **Analytics** - Track performance metrics with scheduled reports
- **Team Collaboration** - Invite team members with role-based access
- **Embeddable Widget** - Deploy chat widget on any website
- **Webhooks** - Integrate with external systems via event webhooks
- **Custom Tools** - Extend agent capabilities with API integrations

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| TanStack Query | Data fetching |
| React Router | Routing |

### Backend

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL | Database with RLS |
| Edge Functions | Serverless API (Deno) |
| Realtime | WebSocket subscriptions |
| Storage | File uploads |

### Design

| Element | Choice |
|---------|--------|
| Font | Geist, Geist Mono |
| Icons | UntitledUI Icons |
| Animations | Framer Motion, CSS |

---

## Getting Started

### Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The following secrets are managed in Supabase:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API access |
| `RESEND_API_KEY` | Email delivery (Resend) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Supabase key |

---

## Project Structure

```
├── docs/                    # Documentation
│   ├── README.md            # Documentation index
│   ├── DESIGN_SYSTEM.md     # Design tokens & standards
│   ├── HOOKS_REFERENCE.md   # Custom hooks reference
│   ├── APPLICATION_OVERVIEW.md
│   ├── CHATPAD_ARCHITECTURE.md
│   ├── AI_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── EDGE_FUNCTIONS.md
│   ├── WIDGET_ARCHITECTURE.md
│   └── ...
│
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Base UI (shadcn)
│   │   ├── agents/          # Agent management
│   │   ├── conversations/   # Conversation UI
│   │   ├── analytics/       # Charts & metrics
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Route pages
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utilities
│   ├── widget/              # Embedded widget
│   ├── index.css            # Design tokens
│   └── App.tsx              # Main app
│
├── supabase/
│   ├── functions/           # Edge functions
│   └── migrations/          # Database migrations
│
├── tailwind.config.ts       # Tailwind configuration
└── vite.config.ts           # Vite configuration
```

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

### Quick Start
- [Application Overview](docs/APPLICATION_OVERVIEW.md) - Features and architecture
- [Design System](docs/DESIGN_SYSTEM.md) - Typography, colors, spacing
- [Hooks Reference](docs/HOOKS_REFERENCE.md) - Custom hooks documentation

### Architecture
- [System Architecture](docs/CHATPAD_ARCHITECTURE.md) - Architecture and data flow
- [AI Architecture](docs/AI_ARCHITECTURE.md) - RAG and model routing
- [Database Schema](docs/DATABASE_SCHEMA.md) - Tables and RLS policies
- [Edge Functions](docs/EDGE_FUNCTIONS.md) - API reference

### Development
- [Supabase Integration](docs/SUPABASE_INTEGRATION_GUIDE.md) - Full-stack patterns
- [shadcn Components](docs/SHADCN_COMPONENT_GUIDE.md) - Component guide
- [Widget Architecture](docs/WIDGET_ARCHITECTURE.md) - Widget development

---

## Development

### Code Style

- **Components**: PascalCase, one per file
- **Hooks**: `use` prefix, in `src/hooks/`
- **Icons**: UntitledUI only (never Lucide)
- **Colors**: Always use semantic tokens from design system

```tsx
// ✅ Correct
<div className="bg-background text-foreground border-border">
  <Button className="bg-primary text-primary-foreground">Action</Button>
</div>

// ❌ Wrong
<div className="bg-white text-black border-gray-200">
  <Button className="bg-black text-white">Action</Button>
</div>
```

### Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run build:widget # Build widget bundle
```

---

## Deployment

### Lovable

1. Open your [Lovable Project](https://lovable.dev/projects/28cc9f18-cb6b-496b-b8a6-8c8f349e3c54)
2. Click **Share** → **Publish**
3. App deploys automatically

### Custom Domain

1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow DNS configuration instructions

---

## Contributing

1. Read the [Design System](docs/DESIGN_SYSTEM.md) before making UI changes
2. Follow existing patterns in [Hooks Reference](docs/HOOKS_REFERENCE.md)
3. Add JSDoc comments to all new components and functions
4. Use semantic color tokens, never direct colors
5. Test both light and dark modes

---

## License

This project is built with [Lovable](https://lovable.dev).
