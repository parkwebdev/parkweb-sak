# ChatPad Documentation

> **Last Updated**: December 2025

Welcome to the ChatPad documentation. This index provides quick access to all technical guides and architecture documentation.

---

## Quick Start

| Resource | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | System overview, features, and architecture |
| [Design System](./DESIGN_SYSTEM.md) | Typography, colors, spacing, and component standards |
| [Hooks Reference](./HOOKS_REFERENCE.md) | Complete custom hooks documentation |

---

## Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | System architecture, access control, features, and data flow |
| [AI Architecture](./AI_ARCHITECTURE.md) | RAG pipeline, model routing, and cost optimization |
| [Database Schema](./DATABASE_SCHEMA.md) | Tables, relationships, RLS policies, and Supabase patterns |
| [Edge Functions](./EDGE_FUNCTIONS.md) | Supabase Edge Functions reference |
| [Security](./SECURITY.md) | Security practices and data protection |

---

## Developer Guides

### UI/UX Development

| Guide | Description |
|-------|-------------|
| [Design System](./DESIGN_SYSTEM.md) | Colors, typography, spacing, icons |
| [Component Patterns](./COMPONENT_PATTERNS.md) | shadcn components, data tables, forms, motion |

### Feature Development

| Guide | Description |
|-------|-------------|
| [Widget Architecture](./WIDGET_ARCHITECTURE.md) | Embedded chat widget technical docs |
| [Native Booking System](./NATIVE_BOOKING_SYSTEM.md) | Calendar and booking system architecture |
| [Social Channel Integrations](./SOCIAL_CHANNEL_INTEGRATIONS.md) | Facebook, Instagram, X integrations |
| [Stripe Payment Guide](./STRIPE_PAYMENT_GUIDE.md) | Payment integration and subscriptions |

### Maintenance

| Document | Description |
|----------|-------------|
| [Production Optimization Plan](./PRODUCTION_OPTIMIZATION_PLAN.md) | Remaining optimization tasks |

---

## Quick Reference

### Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Components** | shadcn/ui, Radix UI |
| **Icons** | UntitledUI Icons (never Lucide) |
| **State** | TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL, Edge Functions, Auth, Realtime) |
| **AI** | OpenRouter (Google Gemini default) |
| **Fonts** | Geist, Geist Mono |

### Key File Locations

| Purpose | Location |
|---------|----------|
| Design tokens | `src/index.css` |
| Tailwind config | `tailwind.config.ts` |
| UI components | `src/components/ui/` |
| Custom hooks | `src/hooks/` |
| Edge functions | `supabase/functions/` |
| Widget source | `src/widget/` |
| Database types | `src/integrations/supabase/types.ts` (read-only) |

### Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build

# Widget
npm run build:widget # Build widget bundle

# Supabase
supabase functions serve   # Local edge functions
supabase db diff           # Generate migration
```

---

## File Structure

```
docs/
├── README.md                      # This index file
│
├── # Core
├── ARCHITECTURE.md                # System architecture and features
├── DATABASE_SCHEMA.md             # Database reference + Supabase patterns
├── EDGE_FUNCTIONS.md              # Edge functions reference
├── AI_ARCHITECTURE.md             # AI/RAG documentation
├── SECURITY.md                    # Security documentation
│
├── # UI/UX
├── DESIGN_SYSTEM.md               # Design tokens and standards
├── COMPONENT_PATTERNS.md          # Component and table patterns
├── HOOKS_REFERENCE.md             # Custom hooks documentation
│
├── # Features
├── WIDGET_ARCHITECTURE.md         # Widget technical docs
├── NATIVE_BOOKING_SYSTEM.md       # Calendar and booking
├── SOCIAL_CHANNEL_INTEGRATIONS.md # Social integrations
├── STRIPE_PAYMENT_GUIDE.md        # Payment integration
└── ONBOARDING_GET_STARTED.md      # Onboarding flow
```

---

## Contributing to Documentation

When adding or updating documentation:

1. **Use consistent structure**: Include metadata header, table of contents, and related docs footer
2. **Keep examples current**: Ensure code examples match actual implementation
3. **Cross-reference**: Link to related documentation
4. **Update this index**: Add new documents to the appropriate section

### Document Template

```markdown
# Document Title

> **Last Updated**: Month Year  
> **Status**: Active | Draft | Deprecated  
> **Related**: [Link1](./LINK1.md), [Link2](./LINK2.md)

Brief description of what this document covers.

---

## Table of Contents

1. [Section 1](#section-1)
2. [Section 2](#section-2)

---

## Section 1

Content...

---

## Related Documentation

- [Related Doc 1](./RELATED1.md)
- [Related Doc 2](./RELATED2.md)
```
