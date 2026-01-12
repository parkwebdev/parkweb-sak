# Super Admin Dashboard - Comprehensive Implementation Document

## Executive Summary

This document provides a complete, step-by-step implementation plan for the Pilot Super Admin Dashboard - an internal administrative interface for managing the SaaS platform. The dashboard will be accessible only to users with the `super_admin` role and will utilize the existing design system, component library, and architectural patterns.

**Key Features:**
- Account Management with impersonation capability
- Baseline Prompt Modifier/Editor
- Stripe/Plan Management with revenue analytics
- Pilot Team Management
- Knowledge Base (Help Articles) Editor
- Email Template Previews & Feature Announcement Builder
- Comprehensive Audit Logging

---

## Table of Contents

1. [Database Schema Changes](#1-database-schema-changes)
2. [Route & Navigation Configuration](#2-route--navigation-configuration)
3. [File Structure](#3-file-structure)
4. [Component Specifications](#4-component-specifications)
5. [Edge Function Updates](#5-edge-function-updates)
6. [Hooks Implementation](#6-hooks-implementation)
7. [Security Implementation](#7-security-implementation)
8. [Implementation Phases](#8-implementation-phases)
9. [Design System Compliance](#9-design-system-compliance)
10. [Testing Checklist](#10-testing-checklist)
11. [Documentation Updates](#11-documentation-updates)

---

## 1. Database Schema Changes ✅ VERIFIED COMPLETE (January 2026)

### 1.1 New Table: `platform_config`

Stores platform-wide configuration including baseline prompt modifiers, security settings, and feature flags.

```sql
-- Migration: create_platform_config_table.sql
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for fast key lookups
CREATE INDEX idx_platform_config_key ON platform_config(key);

-- Enable RLS
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read
CREATE POLICY "Super admins can view platform config"
ON platform_config FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only super_admins can modify
CREATE POLICY "Super admins can manage platform config"
ON platform_config FOR ALL
USING (is_super_admin(auth.uid()));

-- Seed initial data
INSERT INTO platform_config (key, value, description) VALUES 
  ('baseline_prompt', "\"You are Ari, a helpful AI assistant built on the Pilot platform.\"", 'Global prompt prepended to all agent system prompts'),
  ('security_guardrails', '{"enabled": true, "block_pii": true, "block_prompt_injection": true}', 'Security guardrail configuration'),
  ('feature_flags', '{"beta_features": false, "new_onboarding": false}', 'Platform-wide feature flags');
```

### 1.2 New Table: `admin_audit_log`

Tracks all administrative actions for compliance and debugging.

```sql
-- Migration: create_admin_audit_log_table.sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT, -- 'account', 'plan', 'config', 'team', 'article', 'email'
  target_id UUID,
  target_email TEXT, -- For account actions
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action);
CREATE INDEX idx_audit_target ON admin_audit_log(target_type, target_id);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read
CREATE POLICY "Super admins can view audit logs"
ON admin_audit_log FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only super_admins can insert
CREATE POLICY "Super admins can create audit logs"
ON admin_audit_log FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));
```

### 1.3 New Table: `email_delivery_logs`

Tracks email delivery status via Resend webhooks.

```sql
-- Migration: create_email_delivery_logs_table.sql
CREATE TABLE email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT UNIQUE NOT NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT,
  template_type TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'complained', 'failed'
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounce_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_logs_status ON email_delivery_logs(status);
CREATE INDEX idx_email_logs_created ON email_delivery_logs(created_at DESC);
CREATE INDEX idx_email_logs_to ON email_delivery_logs(to_email);
CREATE INDEX idx_email_logs_resend_id ON email_delivery_logs(resend_email_id);

-- Enable RLS
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view
CREATE POLICY "Super admins can view email logs"
ON email_delivery_logs FOR SELECT
USING (is_super_admin(auth.uid()));
```

### 1.4 New Table: `impersonation_sessions`

Tracks secure impersonation sessions for support debugging.

```sql
-- Migration: create_impersonation_sessions_table.sql
CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Index for active sessions
CREATE INDEX idx_impersonation_active ON impersonation_sessions(admin_user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage
CREATE POLICY "Super admins can manage impersonation sessions"
ON impersonation_sessions FOR ALL
USING (is_super_admin(auth.uid()));
```

### 1.5 Database Function: `is_super_admin`

Helper function used by RLS policies:

```sql
-- Migration: create_is_super_admin_function.sql
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. Route & Navigation Configuration ✅ VERIFIED COMPLETE (January 2026)

### 2.1 Update `src/config/routes.ts`

Add Super Admin route configuration:

```typescript
// Add to RouteConfig interface
export interface RouteConfig {
  // ... existing fields
  /** If true, only super_admins can access */
  superAdminOnly?: boolean;
}

// Add admin routes
export const ADMIN_ROUTES: readonly RouteConfig[] = [
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin',
    superAdminOnly: true,
    iconName: 'Shield01',
    description: 'Platform administration',
    showInNav: false,
  },
] as const;

// Admin section configuration
export interface AdminSectionConfig {
  id: string;
  label: string;
  iconName: string;
  path: string;
  description: string;
}

export const ADMIN_SECTIONS: readonly AdminSectionConfig[] = [
  { id: 'overview', label: 'Overview', iconName: 'LayoutAlt01', path: '/admin', description: 'Dashboard overview' },
  { id: 'accounts', label: 'Accounts', iconName: 'Users01', path: '/admin/accounts', description: 'Manage user accounts' },
  { id: 'prompts', label: 'Baseline Prompt', iconName: 'FileCode01', path: '/admin/prompts', description: 'Configure AI baseline' },
  { id: 'plans', label: 'Plans & Billing', iconName: 'CreditCard01', path: '/admin/plans', description: 'Manage subscription plans' },
  { id: 'team', label: 'Pilot Team', iconName: 'UserGroup', path: '/admin/team', description: 'Manage internal team' },
  { id: 'knowledge', label: 'Help Articles', iconName: 'BookOpen01', path: '/admin/knowledge', description: 'Edit user documentation' },
  { id: 'emails', label: 'Emails', iconName: 'Mail01', path: '/admin/emails', description: 'Templates & announcements' },
  { id: 'analytics', label: 'Revenue', iconName: 'TrendUp01', path: '/admin/analytics', description: 'Revenue & metrics' },
  { id: 'audit', label: 'Audit Log', iconName: 'ClipboardCheck', path: '/admin/audit', description: 'View admin actions' },
] as const;
```

### 2.2 Update `src/App.tsx`

Add admin routes with super_admin guard:

```typescript
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminAccounts } from '@/pages/admin/AdminAccounts';
import { AdminAccountDetail } from '@/pages/admin/AdminAccountDetail';
import { AdminPrompts } from '@/pages/admin/AdminPrompts';
import { AdminPlans } from '@/pages/admin/AdminPlans';
import { AdminTeam } from '@/pages/admin/AdminTeam';
import { AdminKnowledge } from '@/pages/admin/AdminKnowledge';
import { AdminEmails } from '@/pages/admin/AdminEmails';
import { AdminRevenue } from '@/pages/admin/AdminRevenue';
import { AdminAuditLog } from '@/pages/admin/AdminAuditLog';

// In Routes:
{/* Admin Routes - Super Admin Only */}
<Route 
  path="/admin/*" 
  element={
    <PermissionGuard superAdminOnly redirectTo="/dashboard">
      <AdminLayout />
    </PermissionGuard>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="accounts" element={<AdminAccounts />} />
  <Route path="accounts/:userId" element={<AdminAccountDetail />} />
  <Route path="prompts" element={<AdminPrompts />} />
  <Route path="plans" element={<AdminPlans />} />
  <Route path="team" element={<AdminTeam />} />
  <Route path="knowledge" element={<AdminKnowledge />} />
  <Route path="emails" element={<AdminEmails />} />
  <Route path="analytics" element={<AdminRevenue />} />
  <Route path="audit" element={<AdminAuditLog />} />
</Route>
```

### 2.3 Update `src/components/PermissionGuard.tsx`

Add `superAdminOnly` prop handling:

```typescript
interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionKey;
  superAdminOnly?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  superAdminOnly,
  redirectTo,
  fallback 
}: PermissionGuardProps) {
  const { isSuperAdmin, loading } = useRoleAuthorization();
  const canAccess = useCanManage(permission || 'view_billing');
  
  if (loading) {
    return <LoadingState text="Checking permissions..." />;
  }
  
  // Super admin check takes precedence
  if (superAdminOnly && !isSuperAdmin) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return fallback || <AccessDenied />;
  }
  
  // Regular permission check
  if (permission && !canAccess) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

---

## 3. File Structure

```
src/
├── pages/
│   └── admin/
│       ├── index.ts                     # Barrel export
│       ├── AdminLayout.tsx              # Admin-specific layout with sidebar
│       ├── AdminDashboard.tsx           # Overview stats and quick actions
│       ├── AdminAccounts.tsx            # Account list with search/filter
│       ├── AdminAccountDetail.tsx       # Individual account view
│       ├── AdminPrompts.tsx             # Baseline prompt editor
│       ├── AdminPlans.tsx               # Plans & Stripe management
│       ├── AdminTeam.tsx                # Pilot team management
│       ├── AdminKnowledge.tsx           # Help articles editor
│       ├── AdminEmails.tsx              # Email templates & announcements
│       ├── AdminRevenue.tsx             # Revenue analytics dashboard
│       └── AdminAuditLog.tsx            # Audit log viewer
│
├── components/
│   └── admin/
│       ├── index.ts                     # Barrel export
│       ├── AdminSidebar.tsx             # Admin navigation sidebar
│       ├── AdminHeader.tsx              # Page header with breadcrumbs
│       ├── AdminPageContainer.tsx       # Consistent page wrapper
│       ├── ImpersonationBanner.tsx      # Visual indicator when impersonating
│       │
│       ├── accounts/
│       │   ├── index.ts
│       │   ├── AccountsTable.tsx        # DataTable with accounts
│       │   ├── AccountFilters.tsx       # Search/filter controls
│       │   ├── AccountDetailSheet.tsx   # Account detail slide-over
│       │   ├── AccountStatusBadge.tsx   # Subscription status badge
│       │   ├── AccountUsageCard.tsx     # Usage metrics card
│       │   ├── ImpersonateButton.tsx    # Impersonation action with confirmation
│       │   ├── ImpersonateDialog.tsx    # Reason input dialog
│       │   └── AccountActions.tsx       # Suspend/activate/delete actions
│       │
│       ├── prompts/
│       │   ├── index.ts
│       │   ├── BaselinePromptEditor.tsx # Rich text prompt editor
│       │   ├── PromptPreview.tsx        # Combined prompt preview
│       │   ├── PromptVersionHistory.tsx # Version history list
│       │   ├── SecurityGuardrailsCard.tsx # Guardrails toggle
│       │   └── PromptTestChat.tsx       # Test conversation simulation
│       │
│       ├── plans/
│       │   ├── index.ts
│       │   ├── PlansTable.tsx           # Plans list with edit
│       │   ├── PlanEditorSheet.tsx      # Plan create/edit form
│       │   ├── PlanLimitsEditor.tsx     # Limits configuration
│       │   ├── PlanFeaturesEditor.tsx   # Features configuration
│       │   ├── SubscriptionsTable.tsx   # All subscriptions list
│       │   ├── StripeSync.tsx           # Stripe sync controls
│       │   └── RevenueMetricsCards.tsx  # MRR, churn, etc. cards
│       │
│       ├── team/
│       │   ├── index.ts
│       │   ├── PilotTeamTable.tsx       # Internal team list
│       │   ├── InviteTeamMemberDialog.tsx # Invite form
│       │   ├── TeamMemberActions.tsx    # Role/permission management
│       │   └── TeamMemberCard.tsx       # Team member display card
│       │
│       ├── knowledge/
│       │   ├── index.ts
│       │   ├── ArticlesTable.tsx        # Help articles list
│       │   ├── ArticleEditor.tsx        # WYSIWYG article editor
│       │   ├── CategoryManager.tsx      # Category CRUD
│       │   ├── CategoryEditorDialog.tsx # Category edit dialog
│       │   └── ArticlePreview.tsx       # Preview rendering
│       │
│       ├── emails/
│       │   ├── index.ts
│       │   ├── EmailTemplateEditor.tsx  # Template editor
│       │   ├── EmailTemplateList.tsx    # Template selection list
│       │   ├── AnnouncementBuilder.tsx  # Feature announcement builder
│       │   ├── AnnouncementPreview.tsx  # Announcement preview
│       │   ├── EmailDeliveryLogs.tsx    # Delivery status table
│       │   ├── EmailDeliveryStats.tsx   # Delivery statistics cards
│       │   └── SendTestEmailDialog.tsx  # Test email sender dialog
│       │
│       ├── revenue/
│       │   ├── index.ts
│       │   ├── RevenueOverview.tsx      # KPI cards grid
│       │   ├── MRRChart.tsx             # Monthly recurring revenue chart
│       │   ├── ChurnChart.tsx           # Churn rate over time chart
│       │   ├── SubscriptionFunnel.tsx   # Trial → Paid funnel visualization
│       │   ├── RevenueByPlan.tsx        # Revenue breakdown by plan
│       │   └── TopAccountsTable.tsx     # Highest revenue accounts
│       │
│       └── audit/
│           ├── index.ts
│           ├── AuditLogTable.tsx        # Paginated audit log
│           ├── AuditLogFilters.tsx      # Action/user/date filters
│           ├── AuditLogDetail.tsx       # Detail view for log entry
│           └── AuditLogExport.tsx       # Export functionality
│
├── hooks/
│   └── admin/
│       ├── index.ts                     # Barrel export
│       ├── useAdminAccounts.ts          # Fetch all accounts with pagination
│       ├── useAccountDetail.ts          # Single account with related data
│       ├── usePlatformConfig.ts         # Platform config CRUD
│       ├── useAdminPlans.ts             # Plans management
│       ├── useAdminSubscriptions.ts     # All subscriptions
│       ├── useAdminTeam.ts              # Pilot team management
│       ├── useAdminArticles.ts          # Help articles CRUD
│       ├── useAdminCategories.ts        # Help categories CRUD
│       ├── useEmailDeliveryLogs.ts      # Email delivery tracking
│       ├── useRevenueAnalytics.ts       # Stripe revenue metrics
│       ├── useAdminAuditLog.ts          # Audit log queries
│       ├── useImpersonation.ts          # Impersonation session management
│       └── useAuditAction.ts            # Log admin actions
│
├── lib/
│   └── admin/
│       ├── index.ts                     # Barrel export
│       ├── audit-actions.ts             # Audit action type constants
│       ├── admin-query-keys.ts          # React Query keys for admin
│       └── admin-utils.ts               # Utility functions
│
└── types/
    └── admin.ts                         # Admin-specific TypeScript types
```

---

## 4. Component Specifications

### 4.1 AdminLayout.tsx

Uses existing design system patterns with a dedicated sidebar:

```typescript
/**
 * AdminLayout Component
 * 
 * Main layout wrapper for all admin pages.
 * Includes sidebar navigation and impersonation banner.
 * 
 * @module pages/admin/AdminLayout
 */

import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { useImpersonation } from '@/hooks/admin/useImpersonation';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/ui/loading-state';

export function AdminLayout() {
  const { isSuperAdmin, loading } = useRoleAuthorization();
  const { isImpersonating } = useImpersonation();
  
  if (loading) {
    return <LoadingState text="Loading admin panel..." />;
  }
  
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {isImpersonating && <ImpersonationBanner />}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 4.2 AdminSidebar.tsx

Follows existing Sidebar patterns:

```typescript
/**
 * AdminSidebar Component
 * 
 * Navigation sidebar for admin pages.
 * Follows same patterns as main app Sidebar.
 * 
 * @module components/admin/AdminSidebar
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ADMIN_SECTIONS } from '@/config/routes';
import { 
  LayoutAlt01, Users01, FileCode01, CreditCard01, 
  UserGroup, BookOpen01, Mail01, TrendUp01, ClipboardCheck,
  ArrowLeft
} from '@untitledui/icons/react/icons';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutAlt01, Users01, FileCode01, CreditCard01,
  UserGroup, BookOpen01, Mail01, TrendUp01, ClipboardCheck,
};

export function AdminSidebar() {
  const location = useLocation();
  
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <h1 className="text-lg font-semibold mt-3">Admin Panel</h1>
        <p className="text-xs text-muted-foreground">Platform Management</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = iconMap[section.iconName];
          const isActive = location.pathname === section.path || 
            (section.path !== '/admin' && location.pathname.startsWith(section.path));
          
          return (
            <Link
              key={section.id}
              to={section.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive 
                  ? 'bg-accent text-accent-foreground font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {Icon && <Icon size={18} aria-hidden="true" />}
              {section.label}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        Super Admin Access
      </div>
    </aside>
  );
}
```

### 4.3 AdminDashboard.tsx

Overview page with key metrics:

```typescript
/**
 * AdminDashboard Component
 * 
 * Overview page showing platform-wide metrics and quick actions.
 * 
 * @module pages/admin/AdminDashboard
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAccounts } from '@/hooks/admin/useAdminAccounts';
import { useAdminSubscriptions } from '@/hooks/admin/useAdminSubscriptions';
import { useRevenueAnalytics } from '@/hooks/admin/useRevenueAnalytics';
import { Users01, CreditCard01, TrendUp01, MessageSquare01 } from '@untitledui/icons/react/icons';
import { formatCurrency } from '@/lib/utils';

export function AdminDashboard() {
  const { totalAccounts } = useAdminAccounts({ pageSize: 1 });
  const { activeSubscriptions } = useAdminSubscriptions({ status: 'active' });
  const { mrr, churnRate } = useRevenueAnalytics();
  
  const stats = [
    { label: 'Total Accounts', value: totalAccounts, icon: Users01 },
    { label: 'Active Subscriptions', value: activeSubscriptions, icon: CreditCard01 },
    { label: 'Monthly Revenue', value: formatCurrency(mrr), icon: TrendUp01 },
    { label: 'Churn Rate', value: `${churnRate}%`, icon: MessageSquare01 },
  ];
  
  return (
    <AdminPageContainer
      title="Dashboard"
      description="Platform overview and quick actions"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon size={18} className="text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions and Recent Activity sections */}
      {/* ... */}
    </AdminPageContainer>
  );
}
```

### 4.4 AdminAccounts.tsx

Comprehensive account management:

```typescript
/**
 * AdminAccounts Component
 * 
 * Account list with search, filter, and management actions.
 * 
 * @module pages/admin/AdminAccounts
 */

import { useState } from 'react';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { AccountsTable } from '@/components/admin/accounts/AccountsTable';
import { AccountFilters } from '@/components/admin/accounts/AccountFilters';
import { AccountDetailSheet } from '@/components/admin/accounts/AccountDetailSheet';
import { useAdminAccounts } from '@/hooks/admin/useAdminAccounts';

export function AdminAccounts() {
  const [filters, setFilters] = useState({
    search: '',
    planId: undefined,
    status: 'all' as const,
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
  });
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  const { accounts, totalCount, loading } = useAdminAccounts({
    ...filters,
    page,
    pageSize: 25,
  });
  
  return (
    <AdminPageContainer
      title="Accounts"
      description="Manage all user accounts on the platform"
    >
      <AccountFilters filters={filters} onFiltersChange={setFilters} />
      
      <AccountsTable
        accounts={accounts}
        loading={loading}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        onSelectAccount={setSelectedAccountId}
      />
      
      <AccountDetailSheet
        accountId={selectedAccountId}
        open={!!selectedAccountId}
        onOpenChange={(open) => !open && setSelectedAccountId(null)}
      />
    </AdminPageContainer>
  );
}
```

**Features:**
- Search by email, name, company
- Filter by plan, status (active/suspended/all), date range
- Sort by created_at, last_active, MRR
- Bulk actions (suspend, export)
- Click to view detail sheet

**Data fetched per account:**
- `profiles` - User profile data
- `subscriptions` - Subscription status and plan
- `plans` - Plan details
- `agents` - Agent count per account
- `conversations` - Conversation count (last 30 days)
- `leads` - Lead count
- `knowledge_sources` - Knowledge source count
- `user_roles` - Role information

### 4.5 AdminAccountDetail.tsx

Full account view page:

```typescript
/**
 * AdminAccountDetail Component
 * 
 * Detailed view of a single account with all related data.
 * 
 * @module pages/admin/AdminAccountDetail
 */

import { useParams, Navigate } from 'react-router-dom';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { useAccountDetail } from '@/hooks/admin/useAccountDetail';
import { AccountUsageCard } from '@/components/admin/accounts/AccountUsageCard';
import { AccountActions } from '@/components/admin/accounts/AccountActions';
import { ImpersonateButton } from '@/components/admin/accounts/ImpersonateButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminAccountDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { account, subscription, usage, loading, error } = useAccountDetail(userId);
  
  if (error) {
    return <Navigate to="/admin/accounts" replace />;
  }
  
  if (loading) {
    return <AccountDetailSkeleton />;
  }
  
  return (
    <AdminPageContainer
      title={account.display_name || account.email}
      description={account.company_name || 'Individual account'}
      breadcrumbs={[
        { label: 'Accounts', href: '/admin/accounts' },
        { label: account.display_name || account.email },
      ]}
      actions={
        <div className="flex gap-2">
          <ImpersonateButton userId={userId} userName={account.display_name} />
          <AccountActions accountId={userId} status={account.status} />
        </div>
      }
    >
      {/* Profile Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={account.avatar_url} />
              <AvatarFallback>{getInitials(account.display_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{account.display_name || 'No name'}</h2>
              <p className="text-muted-foreground">{account.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                  {account.status}
                </Badge>
                <Badge variant="outline">{account.role}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Subscription Card */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{subscription.plan_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="font-medium">{formatCurrency(subscription.mrr)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renews</p>
                <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Usage Card */}
      <AccountUsageCard usage={usage} />
      
      {/* Activity Section - Recent conversations, login history */}
      {/* ... */}
    </AdminPageContainer>
  );
}
```

### 4.6 AdminPrompts.tsx (Baseline Prompt Editor)

```typescript
/**
 * AdminPrompts Component
 * 
 * Baseline prompt editor with preview and version history.
 * 
 * @module pages/admin/AdminPrompts
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { BaselinePromptEditor } from '@/components/admin/prompts/BaselinePromptEditor';
import { PromptPreview } from '@/components/admin/prompts/PromptPreview';
import { PromptVersionHistory } from '@/components/admin/prompts/PromptVersionHistory';
import { SecurityGuardrailsCard } from '@/components/admin/prompts/SecurityGuardrailsCard';
import { usePlatformConfig } from '@/hooks/admin/usePlatformConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminPrompts() {
  const { 
    config: baselineConfig, 
    updateConfig, 
    loading 
  } = usePlatformConfig('baseline_prompt');
  
  const {
    config: guardrailsConfig,
    updateConfig: updateGuardrails,
  } = usePlatformConfig('security_guardrails');
  
  return (
    <AdminPageContainer
      title="Baseline Prompt"
      description="Configure the global prompt prepended to all agent system prompts"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <BaselinePromptEditor
            value={baselineConfig?.value || ''}
            onChange={(value) => updateConfig({ value })}
            loading={loading}
          />
          
          <SecurityGuardrailsCard
            config={guardrailsConfig?.value}
            onChange={updateGuardrails}
          />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Tabs defaultValue="preview">
            <TabsList className="w-full">
              <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              <PromptPreview baselinePrompt={baselineConfig?.value || ''} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <PromptVersionHistory configKey="baseline_prompt" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminPageContainer>
  );
}
```

**Features:**
- Rich text editor using existing Tiptap setup
- Live preview showing combined prompt (baseline + example agent prompt)
- Version history with rollback capability
- Security guardrails toggles:
  - `enabled` - Master toggle
  - `block_pii` - Block PII in responses
  - `block_prompt_injection` - Detect/block prompt injection attempts

### 4.7 AdminPlans.tsx

```typescript
/**
 * AdminPlans Component
 * 
 * Plans and Stripe management page.
 * 
 * @module pages/admin/AdminPlans
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { PlansTable } from '@/components/admin/plans/PlansTable';
import { PlanEditorSheet } from '@/components/admin/plans/PlanEditorSheet';
import { SubscriptionsTable } from '@/components/admin/plans/SubscriptionsTable';
import { StripeSync } from '@/components/admin/plans/StripeSync';
import { RevenueMetricsCards } from '@/components/admin/plans/RevenueMetricsCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from '@untitledui/icons/react/icons';
import { useState } from 'react';

export function AdminPlans() {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  return (
    <AdminPageContainer
      title="Plans & Billing"
      description="Manage subscription plans and view billing data"
      actions={
        <div className="flex gap-2">
          <StripeSync />
          <Button onClick={() => setIsCreating(true)}>
            <Plus size={16} className="mr-2" aria-hidden="true" />
            New Plan
          </Button>
        </div>
      }
    >
      <RevenueMetricsCards className="mb-6" />
      
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-4">
          <PlansTable onEdit={setEditingPlan} />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsTable />
        </TabsContent>
      </Tabs>
      
      <PlanEditorSheet
        plan={editingPlan}
        open={!!editingPlan || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlan(null);
            setIsCreating(false);
          }
        }}
      />
    </AdminPageContainer>
  );
}
```

**Features:**
- View/edit all plans (name, pricing, limits, features)
- Create new plans with Stripe product/price sync
- View all subscriptions across accounts
- Stripe sync controls for bidirectional updates
- Revenue metrics:
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - Active subscriptions count
  - Trial conversion rate

### 4.8 AdminTeam.tsx

```typescript
/**
 * AdminTeam Component
 * 
 * Pilot internal team management.
 * 
 * @module pages/admin/AdminTeam
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { PilotTeamTable } from '@/components/admin/team/PilotTeamTable';
import { InviteTeamMemberDialog } from '@/components/admin/team/InviteTeamMemberDialog';
import { useAdminTeam } from '@/hooks/admin/useAdminTeam';
import { Button } from '@/components/ui/button';
import { UserPlus01 } from '@untitledui/icons/react/icons';
import { useState } from 'react';

export function AdminTeam() {
  const [showInvite, setShowInvite] = useState(false);
  const { team, loading, inviteMember, removeMember } = useAdminTeam();
  
  return (
    <AdminPageContainer
      title="Pilot Team"
      description="Manage internal team members with super admin access"
      actions={
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus01 size={16} className="mr-2" aria-hidden="true" />
          Invite Team Member
        </Button>
      }
    >
      <PilotTeamTable
        team={team}
        loading={loading}
        onRemove={removeMember}
      />
      
      <InviteTeamMemberDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        onInvite={inviteMember}
      />
    </AdminPageContainer>
  );
}
```

**Features:**
- List all users with `super_admin` role
- Invite new Pilot team members (sends email)
- Remove team members (revokes super_admin role)
- View audit log entries per team member

### 4.9 AdminKnowledge.tsx

```typescript
/**
 * AdminKnowledge Component
 * 
 * Help articles editor for user-facing documentation.
 * 
 * @module pages/admin/AdminKnowledge
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { ArticlesTable } from '@/components/admin/knowledge/ArticlesTable';
import { ArticleEditor } from '@/components/admin/knowledge/ArticleEditor';
import { CategoryManager } from '@/components/admin/knowledge/CategoryManager';
import { useAdminArticles } from '@/hooks/admin/useAdminArticles';
import { useAdminCategories } from '@/hooks/admin/useAdminCategories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from '@untitledui/icons/react/icons';
import { useState } from 'react';

export function AdminKnowledge() {
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { articles, loading } = useAdminArticles();
  const { categories } = useAdminCategories();
  
  return (
    <AdminPageContainer
      title="Help Articles"
      description="Edit user-facing help documentation"
      actions={
        <Button onClick={() => setIsCreating(true)}>
          <Plus size={16} className="mr-2" aria-hidden="true" />
          New Article
        </Button>
      }
    >
      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="articles" className="mt-4">
          <ArticlesTable
            articles={articles}
            loading={loading}
            onEdit={setEditingArticle}
          />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <CategoryManager categories={categories} />
        </TabsContent>
      </Tabs>
      
      {(editingArticle || isCreating) && (
        <ArticleEditor
          article={editingArticle}
          categories={categories}
          onClose={() => {
            setEditingArticle(null);
            setIsCreating(false);
          }}
        />
      )}
    </AdminPageContainer>
  );
}
```

**Features:**
- List all help articles with search/filter
- WYSIWYG editor (Tiptap - already installed)
- Category management (CRUD)
- Publish/draft status toggle
- Preview as user would see it in widget

### 4.10 AdminEmails.tsx

```typescript
/**
 * AdminEmails Component
 * 
 * Email templates and feature announcement builder.
 * 
 * @module pages/admin/AdminEmails
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { EmailTemplateList } from '@/components/admin/emails/EmailTemplateList';
import { EmailTemplateEditor } from '@/components/admin/emails/EmailTemplateEditor';
import { AnnouncementBuilder } from '@/components/admin/emails/AnnouncementBuilder';
import { EmailDeliveryLogs } from '@/components/admin/emails/EmailDeliveryLogs';
import { EmailDeliveryStats } from '@/components/admin/emails/EmailDeliveryStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export function AdminEmails() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  return (
    <AdminPageContainer
      title="Emails"
      description="Email templates, announcements, and delivery logs"
    >
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <EmailTemplateList
              selectedId={selectedTemplate}
              onSelect={setSelectedTemplate}
            />
            <div className="lg:col-span-2">
              <EmailTemplateEditor templateId={selectedTemplate} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="announcements" className="mt-4">
          <AnnouncementBuilder />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <EmailDeliveryStats className="mb-6" />
          <EmailDeliveryLogs />
        </TabsContent>
      </Tabs>
    </AdminPageContainer>
  );
}
```

**Features:**
1. **Templates Tab**: 
   - Migrate existing `/email-templates-test` functionality
   - Preview all system email templates
   - Edit template content (stored in `email_templates` table)
   - Send test emails to any address

2. **Announcements Tab**:
   - Feature announcement email builder
   - WYSIWYG content editor
   - Recipient targeting (all users, plan-based, custom list)
   - Schedule send or send immediately
   - Preview before sending

3. **Delivery Logs Tab**:
   - Resend webhook delivery status tracking
   - Statistics cards (sent, delivered, bounced, opened, clicked)
   - Searchable/filterable log table
   - Detailed view for each email

### 4.11 AdminRevenue.tsx

```typescript
/**
 * AdminRevenue Component
 * 
 * Revenue analytics dashboard with Stripe integration.
 * 
 * @module pages/admin/AdminRevenue
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { RevenueOverview } from '@/components/admin/revenue/RevenueOverview';
import { MRRChart } from '@/components/admin/revenue/MRRChart';
import { ChurnChart } from '@/components/admin/revenue/ChurnChart';
import { SubscriptionFunnel } from '@/components/admin/revenue/SubscriptionFunnel';
import { RevenueByPlan } from '@/components/admin/revenue/RevenueByPlan';
import { TopAccountsTable } from '@/components/admin/revenue/TopAccountsTable';
import { useRevenueAnalytics } from '@/hooks/admin/useRevenueAnalytics';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useState } from 'react';
import { subMonths } from 'date-fns';

export function AdminRevenue() {
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 12),
    to: new Date(),
  });
  
  const { data, loading } = useRevenueAnalytics(dateRange);
  
  return (
    <AdminPageContainer
      title="Revenue Analytics"
      description="Financial metrics and subscription analytics"
      actions={
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      }
    >
      {/* KPI Cards */}
      <RevenueOverview data={data} loading={loading} className="mb-6" />
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MRRChart data={data?.mrrHistory} loading={loading} />
        <ChurnChart data={data?.churnHistory} loading={loading} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SubscriptionFunnel data={data?.funnel} loading={loading} />
        <RevenueByPlan data={data?.byPlan} loading={loading} />
      </div>
      
      {/* Top Accounts */}
      <TopAccountsTable accounts={data?.topAccounts} loading={loading} />
    </AdminPageContainer>
  );
}
```

**Metrics displayed:**
| Metric | Description | Source |
|--------|-------------|--------|
| MRR | Monthly Recurring Revenue | Calculated from active subscriptions |
| ARR | Annual Recurring Revenue | MRR × 12 |
| Churn Rate | % of subscriptions canceled | Monthly calculation |
| ARPU | Average Revenue Per User | MRR / active subscriptions |
| LTV | Lifetime Value | ARPU / churn rate |
| Trial Conversion | % trials converting to paid | subscription status changes |
| Net Revenue Retention | Revenue retained + expansions | Month-over-month comparison |

**Charts:**
- MRR over time (line chart)
- Churn rate over time (line chart)
- Subscription funnel (Trial → Active → Churned)
- Revenue by plan (pie/bar chart)

### 4.12 AdminAuditLog.tsx

```typescript
/**
 * AdminAuditLog Component
 * 
 * Audit log viewer with filtering and export.
 * 
 * @module pages/admin/AdminAuditLog
 */

import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';
import { AuditLogFilters } from '@/components/admin/audit/AuditLogFilters';
import { AuditLogDetail } from '@/components/admin/audit/AuditLogDetail';
import { AuditLogExport } from '@/components/admin/audit/AuditLogExport';
import { useAdminAuditLog } from '@/hooks/admin/useAdminAuditLog';
import { useState } from 'react';
import { subDays } from 'date-fns';

export function AdminAuditLog() {
  const [filters, setFilters] = useState({
    action: undefined,
    adminUserId: undefined,
    targetType: undefined,
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    search: '',
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [page, setPage] = useState(1);
  
  const { entries, totalCount, loading } = useAdminAuditLog({
    ...filters,
    page,
    pageSize: 50,
  });
  
  return (
    <AdminPageContainer
      title="Audit Log"
      description="View all administrative actions"
      actions={<AuditLogExport filters={filters} />}
    >
      <AuditLogFilters filters={filters} onFiltersChange={setFilters} />
      
      <AuditLogTable
        entries={entries}
        loading={loading}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        onSelectEntry={setSelectedEntry}
      />
      
      <AuditLogDetail
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      />
    </AdminPageContainer>
  );
}
```

**Features:**
- Paginated log of all admin actions
- Filter by:
  - Action type
  - Admin user
  - Target type (account, config, plan, etc.)
  - Date range
- Search by target email/ID
- Detail view showing full context
- CSV export functionality

---

## 5. Edge Function Updates

### 5.1 Update `supabase/functions/_shared/handlers/context.ts`

Integrate baseline prompt from `platform_config`:

```typescript
// At the beginning of buildContext():

// Fetch platform baseline prompt
const { data: baselineConfig } = await supabaseAdmin
  .from('platform_config')
  .select('value')
  .eq('key', 'baseline_prompt')
  .maybeSingle();

const baselinePrompt = baselineConfig?.value 
  ? (typeof baselineConfig.value === 'string' 
      ? baselineConfig.value 
      : JSON.parse(JSON.stringify(baselineConfig.value)))
  : '';

// Fetch security guardrails config
const { data: guardrailsConfig } = await supabaseAdmin
  .from('platform_config')
  .select('value')
  .eq('key', 'security_guardrails')
  .maybeSingle();

const guardrails = guardrailsConfig?.value 
  ? (typeof guardrailsConfig.value === 'object' 
      ? guardrailsConfig.value 
      : JSON.parse(guardrailsConfig.value))
  : { enabled: true, block_pii: true, block_prompt_injection: true };

// Combine baseline with agent prompt
const fullSystemPrompt = baselinePrompt 
  ? `${baselinePrompt}\n\n${agent.system_prompt}`
  : agent.system_prompt;

// Apply guardrails conditionally
let finalSystemPrompt = fullSystemPrompt;
if (guardrails.enabled) {
  // Add guardrail instructions
  const guardrailInstructions = buildGuardrailInstructions(guardrails);
  finalSystemPrompt = `${finalSystemPrompt}\n\n${guardrailInstructions}`;
}

// Use finalSystemPrompt in the context building
```

### 5.2 New Edge Function: `admin-impersonate`

```typescript
// supabase/functions/admin-impersonate/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid token');

    // Check super_admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData?.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    const { action, targetUserId, reason } = await req.json();

    if (action === 'start') {
      // Check rate limit (max 5 impersonations per hour)
      const { count } = await supabase
        .from('impersonation_sessions')
        .select('id', { count: 'exact' })
        .eq('admin_user_id', user.id)
        .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (count && count >= 5) {
        throw new Error('Rate limit exceeded: Maximum 5 impersonations per hour');
      }

      // Cannot impersonate another super_admin
      const { data: targetRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();
      
      if (targetRole?.role === 'super_admin') {
        throw new Error('Cannot impersonate another super admin');
      }

      // Create impersonation session
      const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .insert({
          admin_user_id: user.id,
          target_user_id: targetUserId,
          reason,
          is_active: true,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation.start',
        target_type: 'account',
        target_id: targetUserId,
        details: { reason, session_id: session.id },
      });

      // Generate impersonation token (30 min expiry)
      // Note: This creates a session for the target user
      // In a real implementation, you'd use Supabase's admin API or a custom token

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: session.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end') {
      const { sessionId } = await req.json();

      // End the session
      const { error: updateError } = await supabase
        .from('impersonation_sessions')
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString() 
        })
        .eq('id', sessionId)
        .eq('admin_user_id', user.id);

      if (updateError) throw updateError;

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation.end',
        target_type: 'session',
        target_id: sessionId,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 5.3 New Edge Function: `admin-stripe-sync`

```typescript
// supabase/functions/admin-stripe-sync/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify super_admin (similar to admin-impersonate)
    // ...

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action } = await req.json();

    if (action === 'sync_products') {
      // Fetch products from Stripe
      const products = await stripe.products.list({ active: true, limit: 100 });
      const prices = await stripe.prices.list({ active: true, limit: 100 });

      // Sync to local plans table
      for (const product of products.data) {
        const productPrices = prices.data.filter(p => p.product === product.id);
        const monthlyPrice = productPrices.find(p => p.recurring?.interval === 'month');
        const yearlyPrice = productPrices.find(p => p.recurring?.interval === 'year');

        await supabase
          .from('plans')
          .upsert({
            id: product.id,
            name: product.name,
            price_monthly: monthlyPrice?.unit_amount || 0,
            price_yearly: yearlyPrice?.unit_amount || 0,
            features: product.metadata.features ? JSON.parse(product.metadata.features) : {},
            limits: product.metadata.limits ? JSON.parse(product.metadata.limits) : {},
            active: product.active,
          });
      }

      return new Response(
        JSON.stringify({ success: true, synced: products.data.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_revenue_metrics') {
      const { startDate, endDate } = await req.json();

      // Fetch subscription data from Stripe
      const subscriptions = await stripe.subscriptions.list({
        status: 'all',
        created: { gte: Math.floor(new Date(startDate).getTime() / 1000) },
        limit: 100,
      });

      // Calculate MRR
      const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active');
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        const item = sub.items.data[0];
        if (item.price.recurring?.interval === 'month') {
          return sum + (item.price.unit_amount || 0);
        } else if (item.price.recurring?.interval === 'year') {
          return sum + ((item.price.unit_amount || 0) / 12);
        }
        return sum;
      }, 0) / 100; // Convert from cents

      // Calculate churn
      const canceledThisMonth = subscriptions.data.filter(s => 
        s.status === 'canceled' && 
        s.canceled_at && 
        s.canceled_at > Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
      ).length;
      const totalAtStart = activeSubscriptions.length + canceledThisMonth;
      const churnRate = totalAtStart > 0 ? (canceledThisMonth / totalAtStart) * 100 : 0;

      return new Response(
        JSON.stringify({
          mrr,
          arr: mrr * 12,
          activeCount: activeSubscriptions.length,
          churnRate: Math.round(churnRate * 100) / 100,
          trialCount: subscriptions.data.filter(s => s.status === 'trialing').length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 5.4 New Edge Function: `resend-webhook`

```typescript
// supabase/functions/resend-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (Resend uses SVix)
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error('Missing Svix headers');
    }

    // TODO: Verify signature with RESEND_WEBHOOK_SECRET
    // const wh = new Webhook(Deno.env.get('RESEND_WEBHOOK_SECRET')!);
    // wh.verify(await req.text(), { 'svix-id': svixId, ... });

    const payload = await req.json();
    const { type, data } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Map Resend event types to our status
    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.opened': 'delivered', // Keep delivered status, just update opened_at
      'email.clicked': 'delivered', // Keep delivered status, just update clicked_at
    };

    const status = statusMap[type];
    if (!status) {
      return new Response(
        JSON.stringify({ message: 'Unhandled event type' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert email log
    const updateData: Record<string, unknown> = {
      resend_email_id: data.email_id,
      status,
      updated_at: new Date().toISOString(),
    };

    if (type === 'email.sent') {
      updateData.to_email = data.to?.[0];
      updateData.from_email = data.from;
      updateData.subject = data.subject;
    }

    if (type === 'email.bounced') {
      updateData.bounce_reason = data.bounce?.message;
    }

    if (type === 'email.opened') {
      updateData.opened_at = new Date().toISOString();
    }

    if (type === 'email.clicked') {
      updateData.clicked_at = new Date().toISOString();
    }

    await supabase
      .from('email_delivery_logs')
      .upsert(updateData, { onConflict: 'resend_email_id' });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 5.5 Update `supabase/config.toml`

```toml
# Add new function configurations

[functions.admin-impersonate]
verify_jwt = true

[functions.admin-stripe-sync]
verify_jwt = true

[functions.resend-webhook]
verify_jwt = false  # Resend webhooks don't have JWT
```

---

## 6. Hooks Implementation

### 6.1 useAdminAccounts.ts

```typescript
/**
 * useAdminAccounts Hook
 * 
 * Fetches all accounts with pagination and filtering.
 * 
 * @module hooks/admin/useAdminAccounts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';

interface UseAdminAccountsOptions {
  search?: string;
  planId?: string;
  status?: 'active' | 'suspended' | 'all';
  sortBy?: 'created_at' | 'last_active' | 'mrr';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface AdminAccount {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  company_name: string | null;
  created_at: string;
  subscription: {
    plan_name: string;
    status: string;
    current_period_end: string;
    mrr: number;
  } | null;
  usage: {
    agents: number;
    conversations: number;
    leads: number;
    knowledge_sources: number;
  };
  role: string;
}

export function useAdminAccounts(options: UseAdminAccountsOptions = {}) {
  const {
    search = '',
    planId,
    status = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    pageSize = 25,
  } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminQueryKeys.accounts({ search, planId, status, sortBy, sortOrder, page, pageSize }),
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('profiles')
        .select(`
          *,
          subscriptions!left (
            id,
            status,
            current_period_end,
            plans!inner (
              id,
              name,
              price_monthly
            )
          ),
          user_roles!left (
            role
          )
        `, { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      // Apply plan filter
      if (planId) {
        query = query.eq('subscriptions.plans.id', planId);
      }

      // Apply status filter (based on subscription status)
      if (status !== 'all') {
        query = query.eq('subscriptions.status', status);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: profiles, error, count } = await query;

      if (error) throw error;

      // Fetch usage counts for each account
      const accountsWithUsage = await Promise.all(
        profiles.map(async (profile) => {
          const [agents, conversations, leads, knowledgeSources] = await Promise.all([
            supabase.from('agents').select('id', { count: 'exact' }).eq('user_id', profile.user_id),
            supabase.from('conversations').select('id', { count: 'exact' }).eq('user_id', profile.user_id),
            supabase.from('leads').select('id', { count: 'exact' }).eq('user_id', profile.user_id),
            supabase.from('knowledge_sources').select('id', { count: 'exact' }).eq('user_id', profile.user_id),
          ]);

          return {
            ...profile,
            subscription: profile.subscriptions?.[0] ? {
              plan_name: profile.subscriptions[0].plans?.name,
              status: profile.subscriptions[0].status,
              current_period_end: profile.subscriptions[0].current_period_end,
              mrr: profile.subscriptions[0].plans?.price_monthly / 100,
            } : null,
            usage: {
              agents: agents.count || 0,
              conversations: conversations.count || 0,
              leads: leads.count || 0,
              knowledge_sources: knowledgeSources.count || 0,
            },
            role: profile.user_roles?.[0]?.role || 'user',
          };
        })
      );

      return {
        accounts: accountsWithUsage as AdminAccount[],
        totalCount: count || 0,
      };
    },
  });

  return {
    accounts: data?.accounts || [],
    totalCount: data?.totalCount || 0,
    totalAccounts: data?.totalCount || 0,
    loading: isLoading,
    error,
    refetch,
  };
}
```

### 6.2 usePlatformConfig.ts

```typescript
/**
 * usePlatformConfig Hook
 * 
 * Manages platform configuration values.
 * 
 * @module hooks/admin/usePlatformConfig
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { useAuditAction } from './useAuditAction';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

interface PlatformConfigEntry {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

export function usePlatformConfig(key?: string) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  // Fetch config
  const { data: config, isLoading, error } = useQuery({
    queryKey: key ? adminQueryKeys.config(key) : adminQueryKeys.allConfigs(),
    queryFn: async () => {
      if (key) {
        const { data, error } = await supabase
          .from('platform_config')
          .select('*')
          .eq('key', key)
          .single();

        if (error) throw error;
        return data as PlatformConfigEntry;
      } else {
        const { data, error } = await supabase
          .from('platform_config')
          .select('*')
          .order('key');

        if (error) throw error;
        return data as PlatformConfigEntry[];
      }
    },
  });

  // Update config
  const updateMutation = useMutation({
    mutationFn: async (updates: { value: unknown }) => {
      if (!key) throw new Error('Key is required for update');

      const { data, error } = await supabase
        .from('platform_config')
        .update({
          value: updates.value,
          version: (config as PlatformConfigEntry).version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await logAction('config.update', 'config', undefined, undefined, {
        key,
        previous_value: (config as PlatformConfigEntry).value,
        new_value: updates.value,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.config(key!) });
      toast.success('Configuration updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update configuration', {
        description: getErrorMessage(error),
      });
    },
  });

  return {
    config,
    loading: isLoading,
    error,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
```

### 6.3 useAuditAction.ts

```typescript
/**
 * useAuditAction Hook
 * 
 * Logs admin actions to the audit log.
 * 
 * @module hooks/admin/useAuditAction
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useAuditAction() {
  const { user } = useAuth();

  const logAction = useCallback(async (
    action: string,
    targetType: string,
    targetId?: string,
    targetEmail?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        target_email: targetEmail,
        details: details || {},
        // IP address and user agent captured server-side if needed
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw - audit logging should not break the main action
    }
  }, [user]);

  return { logAction };
}
```

### 6.4 useImpersonation.ts

```typescript
/**
 * useImpersonation Hook
 * 
 * Manages impersonation sessions for support debugging.
 * 
 * @module hooks/admin/useImpersonation
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

const IMPERSONATION_STORAGE_KEY = 'pilot_impersonation_session';

interface ImpersonationSession {
  sessionId: string;
  targetUserId: string;
  targetUserName: string;
  expiresAt: string;
  adminUserId: string;
}

export function useImpersonation() {
  const { user, signOut } = useAuth();
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load session from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ImpersonationSession;
      // Check if expired
      if (new Date(parsed.expiresAt) > new Date()) {
        setSession(parsed);
      } else {
        localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      }
    }
  }, []);

  const startImpersonation = useCallback(async (
    targetUserId: string,
    targetUserName: string,
    reason: string
  ) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { action: 'start', targetUserId, reason },
      });

      if (error) throw error;

      const newSession: ImpersonationSession = {
        sessionId: data.sessionId,
        targetUserId,
        targetUserName,
        expiresAt: data.expiresAt,
        adminUserId: user.id,
      };

      setSession(newSession);
      localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(newSession));

      toast.success(`Now viewing as ${targetUserName}`, {
        description: 'Session expires in 30 minutes',
      });

      // In a real implementation, you would:
      // 1. Store the admin's current session
      // 2. Create a new session as the target user
      // 3. Redirect to dashboard
      // window.location.href = '/dashboard';

    } catch (error) {
      toast.error('Failed to start impersonation', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const endImpersonation = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      await supabase.functions.invoke('admin-impersonate', {
        body: { action: 'end', sessionId: session.sessionId },
      });

      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      setSession(null);

      toast.success('Returned to admin account');

      // In a real implementation:
      // 1. Restore the admin's original session
      // 2. Redirect to admin panel
      // window.location.href = '/admin/accounts';

    } catch (error) {
      toast.error('Failed to end impersonation', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  return {
    isImpersonating: !!session,
    session,
    isLoading,
    startImpersonation,
    endImpersonation,
  };
}
```

### 6.5 useRevenueAnalytics.ts

```typescript
/**
 * useRevenueAnalytics Hook
 * 
 * Fetches revenue metrics from Stripe.
 * 
 * @module hooks/admin/useRevenueAnalytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';

interface RevenueData {
  mrr: number;
  arr: number;
  activeCount: number;
  churnRate: number;
  trialCount: number;
  mrrHistory: { date: string; value: number }[];
  churnHistory: { date: string; value: number }[];
  byPlan: { plan: string; revenue: number; count: number }[];
  funnel: {
    trials: number;
    active: number;
    churned: number;
  };
  topAccounts: {
    id: string;
    name: string;
    email: string;
    mrr: number;
    plan: string;
  }[];
}

export function useRevenueAnalytics(dateRange?: { from: Date; to: Date }) {
  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.revenue(dateRange),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
        body: {
          action: 'get_revenue_metrics',
          startDate: dateRange?.from.toISOString(),
          endDate: dateRange?.to.toISOString(),
        },
      });

      if (error) throw error;

      // Also fetch local data for additional metrics
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*),
          profiles (*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Calculate by-plan breakdown
      const byPlan = (subscriptions || []).reduce((acc, sub) => {
        const planName = sub.plans?.name || 'Unknown';
        if (!acc[planName]) {
          acc[planName] = { plan: planName, revenue: 0, count: 0 };
        }
        acc[planName].revenue += (sub.plans?.price_monthly || 0) / 100;
        acc[planName].count += 1;
        return acc;
      }, {} as Record<string, { plan: string; revenue: number; count: number }>);

      // Top accounts by MRR
      const topAccounts = (subscriptions || [])
        .map((sub) => ({
          id: sub.user_id,
          name: sub.profiles?.display_name || 'Unknown',
          email: sub.profiles?.email || '',
          mrr: (sub.plans?.price_monthly || 0) / 100,
          plan: sub.plans?.name || 'Unknown',
        }))
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 10);

      return {
        ...data,
        byPlan: Object.values(byPlan),
        topAccounts,
      } as RevenueData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data,
    mrr: data?.mrr || 0,
    churnRate: data?.churnRate || 0,
    loading: isLoading,
    error,
  };
}
```

---

## 7. Security Implementation ✅ VERIFIED COMPLETE (January 2026)

### 7.1 Multi-Layer Protection ✅ ALL LAYERS IMPLEMENTED

| Layer | Implementation | Description | Status |
|-------|----------------|-------------|--------|
| **Router** | `superAdminOnly` prop on PermissionGuard | Prevents route access | ✅ |
| **Layout** | AdminLayout checks `isSuperAdmin` via `useRoleAuthorization` | Double-check before rendering | ✅ |
| **Component** | Individual components verify role | Defense in depth | ✅ |
| **API/RLS** | `is_super_admin(auth.uid())` in policies | Server-side enforcement | ✅ |

### 7.2 Impersonation Security

| Control | Description |
|---------|-------------|
| **Session Expiry** | 30 minutes maximum |
| **Reason Required** | Must provide reason for each session |
| **Full Logging** | All actions logged with impersonation context |
| **Visual Indicator** | Clear banner when impersonating |
| **One-Click Exit** | Easy way to end impersonation |
| **Admin Protection** | Cannot impersonate other super_admins |
| **Rate Limiting** | Maximum 5 impersonations per hour per admin |

### 7.3 Audit Logging

**Actions logged:**

| Category | Actions |
|----------|---------|
| **Account** | `account.view`, `account.suspend`, `account.activate`, `account.delete` |
| **Config** | `config.update` (with before/after values) |
| **Plan** | `plan.create`, `plan.update`, `plan.delete` |
| **Team** | `team.invite`, `team.remove`, `team.role_change` |
| **Article** | `article.create`, `article.update`, `article.publish`, `article.delete` |
| **Email** | `email.send`, `email.announcement` |
| **Impersonation** | `impersonation.start`, `impersonation.end` |

**Audit log entry structure:**

```typescript
interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
```

### 7.4 Data Protection

| Control | Description |
|---------|-------------|
| **Sensitive Data Masking** | Tokens, passwords masked in logs |
| **Rate Limiting** | Impersonation capped at 5/hour |
| **Re-authentication** | Required for destructive actions (future) |
| **IP Logging** | All admin actions include IP address |

---

## 8. Implementation Phases ✅ ALL PHASES VERIFIED COMPLETE (January 2026)

### Phase 1: Foundation (Week 1) ✅ COMPLETE

**Deliverables:**
- [x] Database migrations
  - [x] `platform_config` table
  - [x] `admin_audit_log` table
  - [x] `email_delivery_logs` table
  - [x] `impersonation_sessions` table
  - [x] `is_super_admin()` function
- [x] Route configuration updates (`routes.ts` - ADMIN_ROUTES, ADMIN_SECTIONS)
- [x] App.tsx admin routes (`/admin/*` with PermissionGuard superAdminOnly)
- [x] PermissionGuard `superAdminOnly` support
- [x] AdminLayout with AdminSidebar (includes isSuperAdmin check)
- [x] AdminPageContainer shared component
- [x] AdminDashboard with overview stats
- [x] Basic navigation between admin sections

**Dependencies:** None

### Phase 2: Account Management (Week 2) ✅ COMPLETE

**Deliverables:**
- [x] `useAdminAccounts` hook with pagination
- [x] `useAccountDetail` hook
- [x] AccountsTable with DataTable
- [x] AccountFilters component
- [x] AccountDetailSheet
- [x] AccountStatusBadge
- [x] AccountUsageCard
- [x] Account actions (suspend/activate via AccountActions)
- [x] `useAuditAction` hook
- [x] Audit logging for account actions

**Dependencies:** Phase 1

### Phase 3: Baseline Prompt & Config (Week 2-3) ✅ COMPLETE

**Deliverables:**
- [x] `usePlatformConfig` hook
- [x] BaselinePromptEditor with Textarea
- [x] PromptPreview component
- [x] PromptVersionHistory
- [x] SecurityGuardrailsCard
- [x] PromptTestChat for testing prompts
- [x] Security guardrails toggle functionality

**Dependencies:** Phase 1

### Phase 4: Plans & Stripe (Week 3) ✅ COMPLETE

**Deliverables:**
- [x] `useAdminPlans` hook with CRUD operations
- [x] `useAdminSubscriptions` hook
- [x] PlansTable with edit capability
- [x] PlanEditorSheet
- [x] PlanLimitsEditor
- [x] PlanFeaturesEditor
- [x] SubscriptionsTable
- [x] `admin-stripe-sync` edge function (with runtime action validation)
- [x] StripeSync component
- [x] RevenueMetricsCards

**Dependencies:** Phase 1, existing Stripe integration

### Phase 5: Team & Impersonation (Week 3-4) ✅ COMPLETE

**Deliverables:**
- [x] `useAdminTeam` hook
- [x] `useImpersonation` hook (30min expiry, auto-end, remaining time display)
- [x] PilotTeamTable
- [x] TeamMemberCard
- [x] InviteTeamMemberDialog
- [x] TeamMemberActions
- [x] `admin-impersonate` edge function (rate limiting: 5/hour, audit logging)
- [x] ImpersonateButton with confirmation
- [x] ImpersonateDialog for reason input
- [x] ImpersonationBanner (visual indicator with remaining time)

**Dependencies:** Phase 1, Phase 2

### Phase 6: Knowledge Base Editor (Week 4) ✅ COMPLETE

**Deliverables:**
- [x] `useAdminArticles` hook with CRUD
- [x] `useAdminCategories` hook with CRUD
- [x] ArticlesTable
- [x] ArticleEditor with Tiptap
- [x] CategoryManager
- [x] CategoryEditorDialog
- [x] Publish/draft workflow
- [x] ArticlePreview

**Dependencies:** Phase 1, existing `help_articles` structure

### Phase 7: Email Templates & Announcements (Week 4-5) ✅ COMPLETE

**Deliverables:**
- [x] EmailTemplateList
- [x] EmailTemplateEditor
- [x] AnnouncementBuilder component
- [x] AnnouncementPreview
- [x] `resend-webhook` edge function (delivery event handling)
- [x] `useEmailDeliveryLogs` hook
- [x] EmailDeliveryLogs table
- [x] EmailDeliveryStats cards
- [x] SendTestEmailDialog

**Dependencies:** Phase 1, existing email templates

### Phase 8: Revenue Analytics (Week 5) ✅ COMPLETE

**Deliverables:**
- [x] `useRevenueAnalytics` hook
- [x] RevenueOverview KPI cards
- [x] MRRChart (Recharts)
- [x] ChurnChart (Recharts)
- [x] SubscriptionFunnel
- [x] RevenueByPlan chart
- [x] TopAccountsTable

**Dependencies:** Phase 4 (Stripe integration)

### Phase 9: Audit Log & Polish (Week 5-6) ✅ COMPLETE

**Deliverables:**
- [x] `useAdminAuditLog` hook with pagination
- [x] AuditLogTable with pagination
- [x] AuditLogFilters
- [x] AuditLogDetail sheet
- [x] AuditLogExport (CSV)
- [x] Final audit logging review
- [x] Performance optimization (staleTime on queries)
- [x] Responsive design adjustments
- [x] Testing and bug fixes
- [x] Documentation updates

**Dependencies:** All previous phases

---

## 9. Design System Compliance

All admin components follow existing patterns from `docs/DESIGN_SYSTEM.md`:

### Typography

| Element | Class |
|---------|-------|
| Page title | `text-base font-semibold text-foreground` |
| Section header | `text-sm font-semibold text-foreground` |
| Body text | `text-sm text-muted-foreground` |
| Caption | `text-xs text-muted-foreground` |
| Label | `text-sm font-medium text-foreground` |

### Colors

| Purpose | Token |
|---------|-------|
| Background | `bg-background` |
| Card | `bg-card` |
| Muted | `bg-muted` |
| Accent | `bg-accent` |
| Primary text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Active status | `bg-status-active/10 text-status-active-foreground` |
| Suspended status | `bg-destructive/10 text-destructive` |
| Border | `border-border` |

### Components

| Component | Source |
|-----------|--------|
| DataTable | `@tanstack/react-table` |
| Sheet | `@/components/ui/sheet` |
| Dialog | `@/components/ui/dialog` |
| Card | `@/components/ui/card` |
| Button | `@/components/ui/button` |
| Skeleton | `@/components/ui/skeleton` |
| Toast | `@/lib/toast` (Sonner) |
| Charts | `recharts` |

### Icons

| Guideline | Details |
|-----------|---------|
| Library | UntitledUI icons **only** (never Lucide) |
| Import | `import { IconName } from '@untitledui/icons/react/icons'` |
| Size - inline | `size={16}` |
| Size - button | `size={20}` |
| Size - featured | `size={24}` |
| Decorative | `aria-hidden="true"` |

### Spacing

| Element | Spacing |
|---------|---------|
| Card padding | `p-4` or `p-6` |
| Section gaps | `gap-4` or `gap-6` |
| Button groups | `gap-2` |
| Page sections | `space-y-6` |
| Form fields | `space-y-2` (label to input) |

---

## 10. Testing Checklist

### Functional Tests

| Category | Test |
|----------|------|
| **Access Control** | |
| | Super admin can access /admin routes |
| | Non-super-admin users redirected to /dashboard |
| | All admin API calls verify super_admin role |
| **Account Management** | |
| | Account list loads with pagination |
| | Account search/filter works correctly |
| | Account detail sheet shows all data |
| | Suspend/activate accounts works |
| | Account usage counts are accurate |
| **Impersonation** | |
| | Impersonation creates session and works |
| | Impersonation ends and restores admin session |
| | Cannot impersonate other super_admins |
| | Rate limiting prevents abuse |
| | Visual indicator shows when impersonating |
| **Baseline Prompt** | |
| | Baseline prompt saves and loads correctly |
| | Version history tracks changes |
| | Baseline prompt appears in widget-chat responses |
| | Security guardrails can be toggled |
| **Plans & Billing** | |
| | Plans CRUD operations work |
| | Stripe sync updates local data |
| | Subscriptions table shows all accounts |
| | Revenue metrics calculate correctly |
| **Team Management** | |
| | Team invite sends email |
| | Team member can be removed |
| | Role changes take effect immediately |
| **Knowledge Base** | |
| | Help articles CRUD works |
| | Categories can be managed |
| | Publish/draft toggle works |
| | Preview shows accurate rendering |
| **Emails** | |
| | Email templates preview correctly |
| | Test emails can be sent |
| | Announcements can be created and sent |
| | Delivery logs populate from webhooks |
| **Revenue** | |
| | MRR calculation is accurate |
| | Charts render with correct data |
| | Date range filtering works |
| | Top accounts list is correct |
| **Audit Log** | |
| | All admin actions are logged |
| | Filters work correctly |
| | Detail view shows full context |
| | Export generates valid CSV |

### Security Tests

| Test | Description |
|------|-------------|
| RLS policies prevent non-admin access | Direct database queries fail for non-admins |
| Impersonation tokens expire correctly | Sessions end after 30 minutes |
| Rate limiting on impersonation works | Blocked after 5 attempts per hour |
| Audit log captures all sensitive actions | No actions happen without logging |
| Sensitive data masked in logs | Tokens, passwords not visible |
| Edge functions verify admin role | API calls rejected for non-admins |

### Performance Tests

| Test | Target |
|------|--------|
| Account list loads (1000+ accounts) | <2 seconds |
| Pagination doesn't reload entire list | Incremental loading |
| Charts render efficiently | <1 second |
| No memory leaks in admin navigation | Stable memory usage |
| Audit log with 10k+ entries | Pagination handles load |

---

## 11. Documentation Updates

After implementation, update the following documentation files:

| File | Updates |
|------|---------|
| `docs/ARCHITECTURE.md` | Add admin section, describe access model |
| `docs/DATABASE_SCHEMA.md` | Add new tables: `platform_config`, `admin_audit_log`, `email_delivery_logs`, `impersonation_sessions` |
| `docs/EDGE_FUNCTIONS.md` | Add `admin-impersonate`, `admin-stripe-sync`, `resend-webhook` |
| `docs/HOOKS_REFERENCE.md` | Add all admin hooks with signatures |
| `docs/SECURITY.md` | Document admin access controls, impersonation security, audit logging |
| `docs/DEVELOPMENT_STANDARDS.md` | Add admin-specific patterns and requirements |

---

## Appendix A: Query Keys

```typescript
// src/lib/admin/admin-query-keys.ts

export const adminQueryKeys = {
  // Accounts
  accounts: (filters: AccountFilters) => ['admin', 'accounts', filters] as const,
  account: (userId: string) => ['admin', 'account', userId] as const,
  
  // Config
  allConfigs: () => ['admin', 'config'] as const,
  config: (key: string) => ['admin', 'config', key] as const,
  
  // Plans
  plans: () => ['admin', 'plans'] as const,
  plan: (planId: string) => ['admin', 'plan', planId] as const,
  subscriptions: (filters?: SubscriptionFilters) => ['admin', 'subscriptions', filters] as const,
  
  // Team
  team: () => ['admin', 'team'] as const,
  
  // Knowledge
  articles: (filters?: ArticleFilters) => ['admin', 'articles', filters] as const,
  article: (articleId: string) => ['admin', 'article', articleId] as const,
  categories: () => ['admin', 'categories'] as const,
  
  // Emails
  emailLogs: (filters?: EmailLogFilters) => ['admin', 'email-logs', filters] as const,
  emailStats: () => ['admin', 'email-stats'] as const,
  
  // Revenue
  revenue: (dateRange?: DateRange) => ['admin', 'revenue', dateRange] as const,
  
  // Audit
  auditLog: (filters?: AuditLogFilters) => ['admin', 'audit-log', filters] as const,
} as const;
```

---

## Appendix B: Audit Action Types

```typescript
// src/lib/admin/audit-actions.ts

export const AUDIT_ACTIONS = {
  // Account actions
  ACCOUNT_VIEW: 'account.view',
  ACCOUNT_SUSPEND: 'account.suspend',
  ACCOUNT_ACTIVATE: 'account.activate',
  ACCOUNT_DELETE: 'account.delete',
  
  // Config actions
  CONFIG_UPDATE: 'config.update',
  
  // Plan actions
  PLAN_CREATE: 'plan.create',
  PLAN_UPDATE: 'plan.update',
  PLAN_DELETE: 'plan.delete',
  
  // Team actions
  TEAM_INVITE: 'team.invite',
  TEAM_REMOVE: 'team.remove',
  TEAM_ROLE_CHANGE: 'team.role_change',
  
  // Article actions
  ARTICLE_CREATE: 'article.create',
  ARTICLE_UPDATE: 'article.update',
  ARTICLE_PUBLISH: 'article.publish',
  ARTICLE_UNPUBLISH: 'article.unpublish',
  ARTICLE_DELETE: 'article.delete',
  
  // Email actions
  EMAIL_SEND: 'email.send',
  EMAIL_ANNOUNCEMENT: 'email.announcement',
  
  // Impersonation actions
  IMPERSONATION_START: 'impersonation.start',
  IMPERSONATION_END: 'impersonation.end',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
```

---

## Appendix C: TypeScript Types

```typescript
// src/types/admin.ts

export interface AdminAccount {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  company_name: string | null;
  created_at: string;
  subscription: AdminSubscription | null;
  usage: AdminAccountUsage;
  role: string;
  status: 'active' | 'suspended';
}

export interface AdminSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  mrr: number;
}

export interface AdminAccountUsage {
  agents: number;
  conversations: number;
  leads: number;
  knowledge_sources: number;
  team_members: number;
}

export interface PlatformConfig {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_user?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
  action: string;
  target_type: string;
  target_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ImpersonationSession {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  reason: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
}

export interface EmailDeliveryLog {
  id: string;
  resend_email_id: string;
  to_email: string;
  from_email: string;
  subject: string | null;
  template_type: string | null;
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  opened_at: string | null;
  clicked_at: string | null;
  bounce_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  activeCount: number;
  churnRate: number;
  trialCount: number;
  arpu: number;
  ltv: number;
}

export interface SecurityGuardrails {
  enabled: boolean;
  block_pii: boolean;
  block_prompt_injection: boolean;
}
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Pilot Development Team*
