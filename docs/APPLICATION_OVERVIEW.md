# ChatPad - Application Overview

## Table of Contents
- [Application Overview](#application-overview)
- [Technology Stack](#technology-stack)
- [Core Features & Modules](#core-features--modules)
- [Database Architecture](#database-architecture)
- [Security & Authentication](#security--authentication)
- [UI/UX Guidelines](#uiux-guidelines)
- [Development Standards](#development-standards)
- [API & Integration Points](#api--integration-points)
- [Performance & Monitoring](#performance--monitoring)
- [Future Enhancement Areas](#future-enhancement-areas)

## Application Overview

ChatPad is a comprehensive multi-tenant AI agent platform that enables organizations to build, deploy, and manage conversational AI agents. It provides tools for knowledge management, conversation handling, lead capture, and analytics.

### Core Purpose
- Deploy AI agents via multiple channels (widget, hosted page, API)
- Manage agent knowledge bases with RAG (Retrieval Augmented Generation)
- Handle conversations with human takeover capabilities
- Capture and manage leads from agent interactions
- Provide analytics and monitoring for agent performance
- Support multi-tenant organizations with team management

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens
- **React Router DOM** - Client-side routing
- **TanStack Query** - Server state management and caching

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - File storage with bucket policies
  - Edge functions for serverless logic
  - Built-in authentication

### UI Components
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Customizable component library
- **UntitledUI Icons** - Consistent icon system
- **Sonner** - Toast notifications

### Development Tools
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **date-fns** - Date manipulation utilities

## Core Features & Modules

### 1. Authentication & User Management
**Location**: `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`

- Supabase authentication integration
- Organization-based multi-tenancy
- Role-based access control (Owner, Admin, Member)
- Protected routes with `ProtectedRoute` component
- User profiles with avatar support
- Team invitation system

**Key Files**:
- `src/hooks/useAuth.ts` - Authentication state management
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/contexts/OrganizationContext.tsx` - Organization management

### 2. Dashboard & Analytics
**Location**: `src/pages/Dashboard.tsx`, `src/pages/DashboardWrapper.tsx`

- Main application entry point
- Real-time metrics and KPIs
- Quick navigation to key features
- Organization switcher
- Activity feed

**Key Components**:
- `src/components/MetricCard.tsx` - Dashboard metrics display
- `src/components/notifications/NotificationCenter.tsx` - Real-time notifications
- `src/components/OrganizationSwitcher.tsx` - Multi-org navigation

### 3. AI Agents Management
**Location**: `src/pages/Agents.tsx`, `src/components/agents/`

- Create and configure AI agents
- Model selection (Google Gemini, GPT-4, Claude, etc.)
- System prompt customization
- Temperature and token controls
- Deployment configuration (widget, hosted page, API)
- Agent status management (draft, active, paused)

**Key Components**:
- `src/components/agents/AgentCard.tsx` - Agent overview card
- `src/components/agents/CreateAgentDialog.tsx` - Agent creation
- `src/components/agents/EditAgentDialog.tsx` - Agent editing
- `src/components/agents/AgentSettingsTab.tsx` - Configuration
- `src/components/agents/AgentKnowledgeTab.tsx` - Knowledge management
- `src/components/agents/AgentToolsTab.tsx` - Tool configuration
- `src/components/agents/AgentDeploymentTab.tsx` - Deployment options

### 4. Knowledge Base & RAG
**Location**: `src/components/agents/`, `src/hooks/useKnowledgeSources.ts`

- Upload and manage knowledge sources
- Support for multiple formats (PDF, URL, JSON, XML, CSV)
- Vector embeddings for semantic search
- RAG (Retrieval Augmented Generation) integration
- Knowledge source status tracking

**Key Components**:
- `src/components/agents/AddKnowledgeDialog.tsx` - Add knowledge sources
- `src/components/agents/KnowledgeSourceCard.tsx` - Source display

**Edge Functions**:
- `process-knowledge-source` - Process and embed knowledge
- `search-knowledge` - Semantic search across knowledge base

### 5. Conversations Management
**Location**: `src/pages/Conversations.tsx`, `src/hooks/useConversations.ts`

- View all agent conversations
- Real-time conversation updates
- Human takeover capability
- Conversation status management (active, human_takeover, closed)
- Message history viewing
- Return to AI functionality

**Key Components**:
- `src/components/conversations/ConversationCard.tsx` - Conversation display
- `src/components/conversations/ConversationsTable.tsx` - List view
- `src/components/conversations/ConversationDetailsSheet.tsx` - Details
- `src/components/conversations/TakeoverDialog.tsx` - Takeover interface

### 6. Lead Management
**Location**: `src/pages/Leads.tsx`, `src/hooks/useLeads.ts`

- Capture leads from conversations
- Lead status tracking (new, contacted, qualified, converted)
- Lead enrichment data
- Export capabilities
- Lead assignment

**Key Components**:
- `src/components/leads/LeadCard.tsx` - Lead overview
- `src/components/leads/LeadsTable.tsx` - List view
- `src/components/leads/LeadDetailsSheet.tsx` - Lead details
- `src/components/leads/CreateLeadDialog.tsx` - Manual lead creation

### 7. Analytics & Monitoring
**Location**: `src/pages/Analytics.tsx`, `src/components/analytics/`

- Agent performance metrics
- Conversation analytics
- Lead conversion tracking
- Usage metrics
- Time-series data visualization

**Key Components**:
- `src/components/analytics/AnalyticsKPIs.tsx` - Key metrics
- `src/components/analytics/AgentPerformanceChart.tsx` - Performance tracking
- `src/components/analytics/ConversationChart.tsx` - Conversation analytics
- `src/components/analytics/LeadConversionChart.tsx` - Lead funnel
- `src/components/analytics/UsageMetricsChart.tsx` - Usage tracking

### 8. Hosted Chat Interface
**Location**: `src/pages/HostedChat.tsx`, `src/components/chat/HostedChatInterface.tsx`

- Public-facing chat interface
- Organization and agent slug-based routing
- Branding customization
- Widget embedding
- Conversation persistence

### 9. Settings & Configuration
**Location**: `src/pages/Settings.tsx`, `src/components/settings/`

Comprehensive settings system:
- **General Settings** - Application preferences
- **Profile Settings** - User profile management
- **Team Settings** - Team member management
- **Organization Settings** - Multi-org configuration
- **Branding Settings** - White-label customization
- **Subscription Settings** - Plan and billing
- **API Keys** - API authentication
- **Webhooks** - Event notifications
- **Custom Domains** - Domain management
- **Notification Settings** - Notification preferences

**Key Components**:
- `src/components/settings/GeneralSettings.tsx`
- `src/components/settings/ProfileSettings.tsx`
- `src/components/settings/TeamSettings.tsx`
- `src/components/settings/OrganizationSettings.tsx`
- `src/components/settings/BrandingSettings.tsx`
- `src/components/settings/SubscriptionSettings.tsx`
- `src/components/settings/ApiKeySettings.tsx`
- `src/components/settings/WebhookSettings.tsx`
- `src/components/settings/CustomDomainManager.tsx`

### 10. Team Management
**Location**: `src/components/team/`, `src/hooks/useTeam.ts`

- Team member profiles and roles
- Organization-level permissions
- Avatar upload and management
- Member invitation system
- Role assignment (owner, admin, member)

**Key Components**:
- `src/components/team/TeamMemberCard.tsx` - Member profile display
- `src/components/team/InviteMemberDialog.tsx` - Team invitations
- `src/components/team/ProfileEditDialog.tsx` - Profile management
- `src/components/team/TeamMembersTable.tsx` - Team overview

## Database Architecture

### Core Tables

#### Multi-Tenancy & Organizations
- **organizations** - Organization/workspace management
- **org_members** - Organization membership and roles
- **org_branding** - White-label branding configuration
- **subscriptions** - Plan and billing information
- **plans** - Available subscription plans

#### User Management
- **profiles** - Extended user information
- **user_roles** - Platform-level role assignments
- **user_preferences** - User-specific settings

#### AI Agent System
- **agents** - AI agent configurations
- **agent_tools** - Tools available to agents
- **knowledge_sources** - RAG knowledge base
- **conversations** - Agent conversations
- **messages** - Conversation messages
- **conversation_takeovers** - Human takeover tracking
- **leads** - Captured leads from conversations

#### Integration & Monitoring
- **api_keys** - API authentication keys
- **webhooks** - Webhook configurations
- **webhook_logs** - Webhook delivery logs
- **custom_domains** - Custom domain management
- **usage_metrics** - Usage tracking and analytics
- **notifications** - In-app notifications
- **notification_preferences** - User notification settings

### Custom Types (Enums)
- **agent_status** - Agent states (draft, active, paused)
- **conversation_status** - Conversation states (active, human_takeover, closed)
- **knowledge_type** - Knowledge source types (pdf, url, api, json, xml, csv)
- **lead_status** - Lead lifecycle (new, contacted, qualified, converted)
- **org_role** - Organization roles (owner, admin, member)
- **app_role** - Platform roles (admin, manager, member, super_admin, client)
- **app_permission** - Granular permissions

### Database Functions
- `is_org_admin()` - Check organization admin status
- `is_org_member()` - Check organization membership
- `get_user_org_role()` - Get user's org role
- `is_super_admin()` - Check super admin status
- `search_knowledge_sources()` - Vector search for RAG
- `log_security_event()` - Security event logging
- `generate_unique_slug()` - Generate unique org slugs

## Security & Authentication

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:

**User-Scoped Data**:
- Users can only access their own records
- Admins have broader access where appropriate
- Anonymous access limited to specific token-validated operations

**Admin-Only Data**:
- Email templates
- Security logs
- System-wide settings
- User role management

### Authentication Flow
1. Supabase Auth handles user authentication
2. User profile created automatically on signup
3. Default role assignment (member)
4. Role-based route protection
5. Real-time permission validation

### Security Features
- Token-based anonymous submissions with expiration
- Comprehensive security logging
- IP address and user agent tracking
- Failed authentication monitoring
- Resource access auditing

## UI/UX Guidelines

### Design System
**Location**: `src/index.css`, `tailwind.config.ts`

- HSL-based color tokens for consistent theming
- Dark/light mode support with `next-themes`
- Semantic color naming (primary, secondary, accent, etc.)
- Responsive design with mobile-first approach

### Component Architecture
- **Compound Components** - Complex UI built from smaller, focused components
- **Variant-Based Styling** - Uses `class-variance-authority` for component variants
- **Accessible by Default** - Radix UI primitives ensure accessibility compliance
- **Consistent Icons** - UntitledUI icon system throughout application

### Theme Configuration
```css
/* Semantic color tokens */
--primary: [hsl values];
--secondary: [hsl values];
--accent: [hsl values];
--gradient-primary: linear-gradient(...);
```

### Component Guidelines
- Use semantic tokens, not direct colors
- Implement proper loading states
- Include error boundaries for reliability
- Responsive design for all components
- Consistent spacing using Tailwind scale

## Development Standards

### Code Organization
```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (shadcn)
│   ├── requests/     # Request-specific components
│   ├── onboarding/   # Onboarding-specific components
│   ├── team/         # Team management components
│   └── settings/     # Settings components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Route components
├── types/            # TypeScript definitions
├── utils/            # Helper utilities
└── contexts/         # React contexts
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`REQUEST_STATUSES`)
- **Types/Interfaces**: PascalCase (`UserRole`, `TeamMember`)

### Best Practices
- **TypeScript First** - All new code must be fully typed
- **Hook-Based Logic** - Business logic in custom hooks
- **Error Boundaries** - Wrap complex components
- **Performance Monitoring** - Integrated performance tracking
- **Security Logging** - Log all security-relevant events

### State Management Patterns
- **React Query** for server state
- **React Context** for global client state
- **useState/useReducer** for component-level state
- **Custom hooks** for shared logic

## API & Integration Points

### Supabase Integration
**Client Configuration**: `src/integrations/supabase/client.ts`

- Real-time subscriptions for live data
- File storage with bucket policies
- Row Level Security for data protection
- Edge functions for server-side logic

### Edge Functions
**Location**: `supabase/functions/`

- `widget-chat` - Embedded widget chat handler
- `search-knowledge` - RAG semantic search
- `process-knowledge-source` - Process and embed knowledge
- `validate-api-key` - API authentication
- `trigger-webhook` - Webhook event dispatcher
- `dispatch-webhook-event` - Webhook delivery
- `handle-signup` - User registration processing
- `send-notification-email` - Email notifications
- `send-team-invitation` - Team member invitations
- `verify-custom-domain` - Domain verification
- `cleanup-expired-conversations` - Automated data retention

### External APIs
- **Resend** - Email delivery service
- **OpenAI** - AI model provider for embeddings and chat
- **Google Gemini** - Default AI model for agents
- **Anthropic Claude** - Alternative AI model option

## Performance & Monitoring

### Performance Monitoring
**Location**: `src/utils/performance-monitor.ts`

- Page load time tracking
- Component render performance
- API response time monitoring
- User interaction metrics
- Error rate tracking

### Optimization Strategies
- **React Query** caching for reduced API calls
- **Code splitting** with React.lazy()
- **Image optimization** with proper sizing
- **Debounced search** to reduce server load
- **Lazy loading** for non-critical components

### Error Handling
- **Error Boundaries** catch and display React errors gracefully
- **Centralized Logging** with structured error reporting
- **User-Friendly Messages** for all error states
- **Fallback UI** for failed component renders

## Future Enhancement Areas

### Analytics & Reporting
- **Dashboard Analytics** - Enhanced metrics and reporting
- **Client Insights** - Project progress and timeline tracking
- **Team Performance** - Productivity and efficiency metrics
- **Revenue Tracking** - Project profitability analysis

### Advanced Features
- **AI Integration** - Enhanced content generation and suggestions
- **Workflow Automation** - Automated task assignments and notifications
- **Advanced Permissions** - Granular project-level permissions
- **API Integrations** - CRM, accounting, and project management tools

### User Experience
- **Mobile App** - Native mobile application
- **Advanced Search** - Full-text search with filters
- **Bulk Operations** - Enhanced bulk editing capabilities
- **Customizable Dashboards** - User-configurable dashboard layouts

### Technical Improvements
- **Offline Support** - Progressive Web App capabilities
- **Advanced Caching** - Redis caching layer
- **Database Optimization** - Query performance improvements
- **Microservices** - Service-oriented architecture migration

---

## Maintenance Guidelines

### Regular Tasks
1. **Security Reviews** - Monthly security audit and updates
2. **Performance Monitoring** - Weekly performance metric reviews
3. **Dependency Updates** - Regular package updates and security patches
4. **Database Maintenance** - Query optimization and cleanup
5. **User Feedback** - Continuous UX improvement based on feedback

### Development Workflow
1. **Feature Planning** - Document requirements and architecture
2. **Component Design** - Design system compliance review
3. **Implementation** - Follow established patterns and conventions
4. **Testing** - Comprehensive testing including edge cases
5. **Documentation** - Update relevant documentation
6. **Deployment** - Staged rollout with monitoring

This document serves as the authoritative guide for understanding and maintaining the ChatPad application. All development should align with these established patterns and conventions to ensure consistency and maintainability.