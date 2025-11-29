# ChatPad - AI Agent Platform

A comprehensive multi-tenant AI agent platform that enables organizations to build, deploy, and manage conversational AI agents with RAG (Retrieval Augmented Generation) capabilities.

## Project Info

**URL**: https://lovable.dev/projects/28cc9f18-cb6b-496b-b8a6-8c8f349e3c54

## Features

- 🤖 **AI Agents** - Create and configure AI agents with custom system prompts
- 💬 **Conversations** - Manage agent conversations with human takeover
- 📚 **Knowledge Base** - RAG-powered knowledge management
- 👥 **Leads** - Capture and track leads from conversations
- 📊 **Analytics** - Monitor agent performance and usage
- 🏢 **Multi-Tenancy** - Organization-based multi-tenant architecture
- 🎨 **White Label** - Custom branding and domain support
- 🔌 **Integrations** - Webhooks and API access
- 🚀 **Deployment** - Widget, hosted page, and API deployment options

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Radix UI** & **shadcn/ui** - Accessible components
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL with Row Level Security
  - Real-time subscriptions
  - Edge Functions (Deno)
  - File storage
  - Built-in authentication

### AI Integration
- **Google Gemini** - Default AI model
- **OpenAI GPT-4** - Alternative model
- **Anthropic Claude** - Alternative model
- **Vector Embeddings** - RAG knowledge search

## Getting Started

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── agents/       # Agent management
│   ├── analytics/    # Analytics & charts
│   ├── chat/         # Chat interfaces
│   ├── conversations/# Conversation management
│   ├── leads/        # Lead management
│   ├── settings/     # Settings & configuration
│   ├── team/         # Team management
│   └── ui/           # Base UI components
├── hooks/            # Custom React hooks
├── pages/            # Route components
├── contexts/         # React contexts
├── lib/              # Utility functions
└── integrations/     # External integrations

supabase/
├── functions/        # Edge functions
└── migrations/       # Database migrations
```

## Core Concepts

### Organizations
Multi-tenant workspace system where each organization has:
- Team members with roles (owner, admin, member)
- Custom branding
- Subscription plans
- Usage limits

### Agents
AI agents with:
- Configurable system prompts
- Model selection
- Knowledge bases
- Tool integrations
- Multiple deployment methods

### Knowledge Base
RAG (Retrieval Augmented Generation) system:
- Upload documents (PDF, URLs, etc.)
- Vector embeddings for semantic search
- Context injection into agent responses

### Conversations
Agent chat sessions with:
- Real-time messaging
- Human takeover capability
- Lead capture
- Conversation history

## Deployment

### Using Lovable
1. Open your [Lovable Project](https://lovable.dev/projects/28cc9f18-cb6b-496b-b8a6-8c8f349e3c54)
2. Click **Share** → **Publish**
3. Your app will be deployed automatically

### Custom Domain
1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration instructions

Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain)

## Development

### Code Editing Options

**Via Lovable**
Visit the [Lovable Project](https://lovable.dev/projects/28cc9f18-cb6b-496b-b8a6-8c8f349e3c54) and start prompting. Changes are committed automatically.

**Local IDE**
Clone the repo and push changes. They'll sync with Lovable automatically.

**GitHub Codespaces**
Click **Code** → **Codespaces** → **New codespace** to launch a cloud development environment.

### Environment Variables

Required secrets (managed in Supabase):
- `OPENAI_API_KEY` - OpenAI API access
- `RESEND_API_KEY` - Email delivery
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin Supabase key

## Documentation

- [Lovable Docs](https://docs.lovable.dev/)
- [ChatPad Architecture](docs/CHATPAD_ARCHITECTURE.md)
- [Application Overview](docs/APPLICATION_OVERVIEW.md)

## Support

- [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Lovable Documentation](https://docs.lovable.dev/)

## License

This project is built with Lovable.
