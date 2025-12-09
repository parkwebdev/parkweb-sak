# ChatPad Documentation

Welcome to the ChatPad documentation. This index provides quick access to all technical guides and architecture documentation.

---

## 📋 Project Documentation

| Document | Description |
|----------|-------------|
| [Application Overview](./APPLICATION_OVERVIEW.md) | High-level overview of ChatPad features and functionality |
| [ChatPad Architecture](./CHATPAD_ARCHITECTURE.md) | System architecture, components, and data flow |
| [AI Architecture](./AI_ARCHITECTURE.md) | AI integration, RAG, model routing, and cost optimization |
| [Database Schema](./DATABASE_SCHEMA.md) | Database tables, relationships, and RLS policies |
| [Edge Functions](./EDGE_FUNCTIONS.md) | Supabase Edge Functions reference and usage |
| [Widget Architecture](./WIDGET_ARCHITECTURE.md) | Embedded chat widget technical documentation |
| [Security](./SECURITY.md) | Security practices, RLS policies, and data protection |
| [Multi-Account Integrations](./MULTI_ACCOUNT_INTEGRATIONS.md) | Multi-location integration architecture |

---

## 🛠️ Development Guides

### Full-Stack Development
| Guide | Description |
|-------|-------------|
| [Supabase Integration Guide](./SUPABASE_INTEGRATION_GUIDE.md) | Full-stack patterns with Supabase, React Query, and shadcn/ui |
| [Stripe Payment Guide](./STRIPE_PAYMENT_GUIDE.md) | Payment integration, subscriptions, and webhooks |

### UI/UX Development
| Guide | Description |
|-------|-------------|
| [shadcn Component Guide](./SHADCN_COMPONENT_GUIDE.md) | Building and extending shadcn/ui components (includes motion/animation) |
| [Data Table & Dashboard Guide](./DATA_TABLE_DASHBOARD_GUIDE.md) | TanStack Table, Recharts, and data visualization |

### Feature Planning
| Guide | Description |
|-------|-------------|
| [Widget Enhancements](./WIDGET_ENHANCEMENTS.md) | Planned and implemented widget feature improvements |

---

## 🚀 Quick Links

- **Tech Stack**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase
- **Icons**: UntitledUI Icons (not Lucide)
- **State Management**: React Query (TanStack Query)
- **Database**: Supabase PostgreSQL with Row Level Security
- **AI Provider**: OpenRouter (consolidated billing)

---

## 📁 File Structure

```
docs/
├── README.md                      # This index file
├── APPLICATION_OVERVIEW.md        # Feature overview
├── CHATPAD_ARCHITECTURE.md        # System architecture
├── AI_ARCHITECTURE.md             # AI integration and cost optimization
├── DATABASE_SCHEMA.md             # Database documentation
├── EDGE_FUNCTIONS.md              # Edge functions reference
├── WIDGET_ARCHITECTURE.md         # Widget documentation
├── WIDGET_ENHANCEMENTS.md         # Widget feature roadmap
├── SECURITY.md                    # Security documentation
├── MULTI_ACCOUNT_INTEGRATIONS.md  # Multi-account architecture
├── SUPABASE_INTEGRATION_GUIDE.md  # Full-stack development guide
├── STRIPE_PAYMENT_GUIDE.md        # Payment integration guide
├── SHADCN_COMPONENT_GUIDE.md      # Component building guide (includes animation)
└── DATA_TABLE_DASHBOARD_GUIDE.md  # Data visualization guide
```
