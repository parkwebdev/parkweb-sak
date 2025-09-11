# Agency Dashboard - Application Overview

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

The Agency Dashboard is a comprehensive client management and project onboarding platform designed for digital agencies. It provides a centralized hub for managing client onboarding, scope of works, team collaboration, and project requests.

### Core Purpose
- Streamline client onboarding processes
- Generate and manage Scope of Work (SOW) documents
- Track and manage client change requests
- Facilitate team collaboration and project management
- Provide secure, role-based access to agency resources

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
- Role-based access control (Super Admin, Admin, Manager, Member, Client)
- Protected routes with `ProtectedRoute` component
- User profiles with avatar support
- Team invitation system

**Key Files**:
- `src/hooks/useAuth.ts` - Authentication state management
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/types/team.ts` - User role definitions

### 2. Dashboard & Analytics
**Location**: `src/pages/Dashboard.tsx`, `src/pages/DashboardWrapper.tsx`

- Main application entry point
- Performance monitoring integration
- Real-time notifications
- Quick navigation and global search
- Metric cards and data visualization

**Key Components**:
- `src/components/MetricCard.tsx` - Dashboard metrics display
- `src/components/notifications/NotificationCenter.tsx` - Real-time notifications

### 3. Client Onboarding System
**Location**: `src/pages/ClientOnboarding.tsx`, `src/components/onboarding/`

Multi-step onboarding process with:
- Company information capture
- Contact details collection
- Project goals and requirements
- Target audience definition
- File uploads (branding, content)
- Form validation and auto-save

**Key Components**:
- `src/components/onboarding/OnboardingTypes.tsx` - Type definitions
- `src/components/onboarding/OnboardingValidation.tsx` - Form validation logic
- `src/components/onboarding/OnboardingStorage.tsx` - Data persistence
- `src/components/onboarding/ScopeOfWorkGenerator.tsx` - SOW generation

**Features**:
- Token-based anonymous submissions
- Progress tracking
- Auto-save functionality
- File upload with cloud storage
- Industry-specific templates

### 4. Scope of Work (SOW) Management
**Location**: `src/pages/ScopeOfWorks.tsx`, `src/lib/document-generator.ts`

- Generate professional SOW documents
- PDF and DOC format support
- Template customization
- Client approval workflow
- Version tracking

**Document Generation**:
- Uses jsPDF for PDF generation
- HTML-to-DOC conversion for Word documents
- Branded templates with company information
- Automated content population from onboarding data

### 5. Request Management System
**Location**: `src/pages/Requests.tsx`, `src/components/requests/`

Dual-view system for managing client change requests:

**Table View** (`RequestsTable.tsx`):
- Sortable columns (title, status, priority, client, due date)
- Bulk actions (status updates, assignments)
- Search and filtering
- Inline status and priority updates

**Kanban View** (`RequestKanbanView.tsx`):
- Drag-and-drop functionality using @dnd-kit
- Status-based columns (To Do, In Progress, On Hold, Completed)
- Visual priority indicators
- Quick status updates

**Request Link System**:
- Generate shareable links for clients to submit requests
- Anonymous request submission capability
- Form validation and security measures

**Key Files**:
- `src/hooks/useRequests.ts` - Request data management
- `src/components/requests/RequestDetailsSheet.tsx` - Request details modal
- `src/components/requests/CreateRequestLinkDialog.tsx` - Link generation

### 6. Team Management
**Location**: `src/components/team/`, `src/hooks/useTeam.ts`

- Team member profiles and roles
- Permission-based access control
- Avatar upload and management
- Member invitation system
- Role assignment and management

**Key Components**:
- `src/components/team/TeamMemberCard.tsx` - Member profile display
- `src/components/team/InviteMemberDialog.tsx` - Team invitations
- `src/components/team/ProfileEditDialog.tsx` - Profile management

### 7. Settings & Configuration
**Location**: `src/pages/Settings.tsx`, `src/components/settings/`

Modular settings system with:
- General application settings
- Profile management
- Team settings and permissions
- Notification preferences
- Role management (admin-only)

**Settings Modules**:
- `GeneralSettings.tsx` - App-wide configuration
- `ProfileSettings.tsx` - User profile management
- `TeamSettings.tsx` - Team-wide settings
- `NotificationSettings.tsx` - Notification preferences
- `RoleManagementDialog.tsx` - User role administration

### 8. File Management
**Location**: `src/lib/file-upload.ts`, `src/components/FileUploadArea.tsx`

- Secure file upload to Supabase storage
- Multiple file format support
- Progress tracking
- Error handling and validation
- Organized storage buckets (avatars, client-uploads, email-assets, logos)

### 9. Global Search
**Location**: `src/hooks/useGlobalSearch.ts`, `src/hooks/useSearchData.ts`

- Unified search across all application data
- Real-time search results
- Category-based filtering
- Quick navigation actions

## Database Architecture

### Core Tables

#### User Management
- **profiles** - Extended user information beyond Supabase auth
- **user_roles** - Role assignments and permissions
- **user_preferences** - User-specific settings
- **pending_invitations** - Team invitation tracking

#### Client Management
- **client_onboarding_links** - Client onboarding session tracking
- **onboarding_submissions** - Completed onboarding forms
- **onboarding_tokens** - Secure token-based access
- **onboarding_templates** - Industry-specific form templates

#### Project Management
- **scope_of_works** - Generated SOW documents
- **scope_work_approvals** - Client approval tracking
- **requests** - Client change requests
- **request_links** - Shareable request submission links

#### System Management
- **notifications** - In-app notification system
- **notification_preferences** - User notification settings
- **security_logs** - Security event tracking
- **email_templates** - Email template management
- **draft_submissions** - Auto-saved form drafts

### Custom Types
- **app_role** - Enum for user roles (super_admin, admin, manager, member, client)
- **app_permission** - Enum for granular permissions
- **request_status** - Enum for request statuses (to_do, in_progress, on_hold, completed)
- **request_priority** - Enum for request priorities (low, medium, high, urgent)

### Database Functions
- `validate_onboarding_token()` - Token validation
- `mark_token_used()` - Token usage tracking
- `log_security_event()` - Security logging
- `get_user_role()` - Role retrieval
- `has_permission()` - Permission checking
- `is_admin()` - Admin status verification

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

- `generate-scope-of-work` - SOW document generation
- `handle-signup` - User registration processing
- `send-notification-email` - Email notifications
- `send-team-invitation` - Team member invitations
- `send-stage-email` - Onboarding stage notifications

### External APIs
- **Resend** - Email delivery service
- **OpenAI** - AI-powered content generation (SOW)
- **Google Maps** - Address autocomplete functionality

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

This document serves as the authoritative guide for understanding and maintaining the Agency Dashboard application. All development should align with these established patterns and conventions to ensure consistency and maintainability.