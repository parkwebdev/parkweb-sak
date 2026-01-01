# Team Scoping Standard

> **MANDATORY READING** for all development on Pilot.  
> **Last Updated**: January 2026  
> This document establishes the coding standard for account-scoped data access and permission guards.

## Overview

All data in Pilot is scoped to an **account owner**. Team members share access to the owner's data - they do **not** have their own separate data stores.

Additionally, all interactive UI elements that modify data are protected by **permission guards** to ensure team members can only perform actions they're authorized for.

### Core Concept: `accountOwnerId`

The `accountOwnerId` is the user ID that owns the subscription and all associated data:

| User Type | `accountOwnerId` Value |
|-----------|----------------------|
| Account Owner (has subscription) | Their own `user.id` |
| Team Member | Their team owner's `user_id` |

## The Hook Pattern (REQUIRED)

Every hook that fetches or creates account-scoped data **MUST** follow this pattern:

### 1. Import and Use `useAccountOwnerId`

```typescript
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';

export function useMyFeature() {
  const { accountOwnerId, isTeamMember, loading: ownerLoading } = useAccountOwnerId();
  // ...
}
```

### 2. Query Data Using `accountOwnerId`

```typescript
const { data } = useQuery({
  queryKey: ['my-feature', accountOwnerId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('user_id', accountOwnerId!)  // ← Use accountOwnerId, NOT user.id
    // ...
  },
  enabled: !!accountOwnerId,  // ← Wait for accountOwnerId to be resolved
});
```

### 3. Create Data With `accountOwnerId`

```typescript
const createItem = async (itemData: ItemData) => {
  const { error } = await supabase
    .from('my_table')
    .insert({
      ...itemData,
      user_id: accountOwnerId,  // ← NEVER use user.id directly!
    });
};
```

### 4. Include `accountOwnerId` in Query Keys

```typescript
queryKey: queryKeys.leads.list(accountOwnerId)
// or
queryKey: ['my-feature', 'list', accountOwnerId]
```

### 5. Handle Loading State

```typescript
enabled: !!accountOwnerId && !ownerLoading
```

## Complete Example

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { supabase } from '@/integrations/supabase/client';

export function useMyFeature() {
  const queryClient = useQueryClient();
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();

  // READ: Fetch data scoped to account owner
  const { data, isLoading } = useQuery({
    queryKey: ['my-feature', accountOwnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('user_id', accountOwnerId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!accountOwnerId,
  });

  // CREATE: Insert with account owner's user_id
  const createMutation = useMutation({
    mutationFn: async (newItem: NewItem) => {
      const { error } = await supabase
        .from('my_table')
        .insert({
          ...newItem,
          user_id: accountOwnerId,  // ← Critical!
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feature', accountOwnerId] });
    },
  });

  return {
    data: data ?? [],
    isLoading: isLoading || ownerLoading,
    createItem: createMutation.mutateAsync,
  };
}
```

---

## Data Classification

### Account-Scoped Data (Use `accountOwnerId`)

These hooks fetch/create data owned by the account:

| Data Type | Hook | Status |
|-----------|------|--------|
| Agents | `useAgent` | ✅ |
| Leads | `useLeads` | ✅ |
| Lead Stages | `useLeadStages` | ✅ |
| Conversations | `useConversations` | ✅ |
| Analytics (all) | `useAnalytics`, `useTrafficAnalytics`, etc. | ✅ |
| Conversation Funnel | `useConversationFunnel` | ✅ |
| Plan Limits | `usePlanLimits` | ✅ |
| Knowledge Sources | `useKnowledgeSources` | ✅ |
| Locations | `useLocations` | ✅ |
| Webhooks | `useWebhooks` | ✅ |
| Report Exports | `useReportExports` | ✅ |
| Scheduled Reports | `useScheduledReports` | ✅ |

### User-Specific Data (Use `user.id`)

These hooks fetch/create data personal to the current user:

| Data Type | Why |
|-----------|-----|
| User's own profile | Personal identity |
| User's role/permissions | Individual access control |
| Notification preferences | Personal settings |
| Security logs (own actions) | Personal audit trail |

### Agent-Scoped Data (Inherited via `agentId`)

These hooks are scoped via `agentId`. Since `useAgent` uses `accountOwnerId`, the scoping works automatically:

| Data Type | Hook |
|-----------|------|
| Agent Tools | `useAgentTools` |
| Connected Accounts | `useConnectedAccounts` |
| Calendar Events | `useCalendarEvents` |
| Properties | `useProperties` |
| Help Articles/Categories | `useHelpArticles` |
| Announcements | `useAnnouncements` |
| News Items | `useNewsItems` |

---

## Adding New Hooks Checklist

When creating a new hook for account-scoped data:

- [ ] Import `useAccountOwnerId` hook
- [ ] Use `accountOwnerId` for all SELECT queries
- [ ] Use `accountOwnerId` for INSERT operations (`user_id: accountOwnerId`)
- [ ] Include `accountOwnerId` in query keys
- [ ] Set `enabled: !!accountOwnerId`
- [ ] Handle loading states properly (combine with `ownerLoading`)
- [ ] **Update this documentation!**

---

## Common Mistakes to Avoid

### ❌ Wrong: Using `user.id` for account data

```typescript
// WRONG - This creates data under the team member, not the account owner!
const { user } = useAuth();
await supabase.from('leads').insert({ user_id: user.id, ... });
```

### ✅ Correct: Using `accountOwnerId`

```typescript
// CORRECT - Data is created under the account owner
const { accountOwnerId } = useAccountOwnerId();
await supabase.from('leads').insert({ user_id: accountOwnerId, ... });
```

### ❌ Wrong: Missing `accountOwnerId` in query key

```typescript
// WRONG - Cache won't update properly when switching accounts
queryKey: ['leads', status]
```

### ✅ Correct: Including `accountOwnerId` in query key

```typescript
// CORRECT - Cache is properly scoped
queryKey: ['leads', accountOwnerId, status]
```

---

## RLS Policies

Database RLS (Row Level Security) policies use the `has_account_access()` function to verify access:

```sql
-- Example RLS policy
CREATE POLICY "Users can view accessible leads"
ON public.leads
FOR SELECT
USING (has_account_access(user_id));
```

The `has_account_access()` function checks if the current user:
1. Is the account owner (`auth.uid() = account_owner_id`), OR
2. Is a team member of the account owner

**Important:** RLS is a safety net, not a replacement for proper filtering. Always use `accountOwnerId` in your queries for clarity and performance.

---

---

## Permission Guards

All interactive UI elements that modify data **MUST** be protected by permission guards.

### Using `PermissionGuard` Component

```typescript
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// Wrap UI elements that require permission
<PermissionGuard permission="manage_leads">
  <Button onClick={handleDelete}>Delete Lead</Button>
</PermissionGuard>
```

### Using `useCanManage` Hooks (REQUIRED)

> **Important:** Always use `useCanManage` hooks instead of the raw `isAdmin || hasPermission()` pattern.

```typescript
import { useCanManage } from '@/hooks/useCanManage';

function MyComponent() {
  // Single permission check
  const canManageLeads = useCanManage('manage_leads');
  
  return (
    <Button disabled={!canManageLeads} onClick={handleDelete}>
      Delete
    </Button>
  );
}
```

For multiple permissions:

```typescript
import { useCanManageMultiple } from '@/hooks/useCanManage';

function MyComponent() {
  const perms = useCanManageMultiple(['manage_leads', 'manage_team', 'view_billing']);
  
  return (
    <>
      {perms.manage_leads && <DeleteButton />}
      {perms.manage_team && <InviteButton />}
    </>
  );
}
```

For dynamic permissions (e.g., permission passed as prop):

```typescript
import { useCanManageChecker } from '@/hooks/useCanManage';

function PermissionButton({ permission }: { permission: AppPermission }) {
  const canManage = useCanManageChecker();
  const hasAccess = canManage(permission);
  // ...
}
```

### Passing `canManage` Props

For reusable components, pass permission result as a prop:

```typescript
// Parent component
const canManageLeads = useCanManage('manage_leads');
<LeadsTable canManage={canManageLeads} ... />

// Child component
interface LeadsTableProps {
  canManage?: boolean;
}
function LeadsTable({ canManage = false }: LeadsTableProps) {
  // Disable actions if canManage is false
}
```

### ❌ Forbidden Pattern

Do NOT use the raw pattern in components:

```typescript
// WRONG - creates inconsistency and harder to maintain
const { hasPermission, isAdmin } = useRoleAuthorization();
const canManage = isAdmin || hasPermission('manage_leads');
```

### ✅ Correct Pattern

```typescript
// CORRECT - centralized, consistent, less code
const canManage = useCanManage('manage_leads');
```

---

## Permission-to-Feature Mapping

| Permission | Routes | UI Elements |
|------------|--------|-------------|
| `manage_ari` | /ari | All Ari configurator sections |
| `view_conversations` | /conversations | Inbox sidebar item |
| `manage_conversations` | - | Takeover, close, reopen, send message |
| `view_leads` | /leads | Leads sidebar item |
| `manage_leads` | - | Delete, stage change, drag-and-drop, bulk actions, row selection |
| `view_bookings` | /planner | Planner sidebar item |
| `manage_bookings` | - | Add event, drag/resize, delete |
| `view_dashboard` | /analytics, /report-builder | Analytics sidebar item |
| `view_team` | /settings (team tab) | Team tab in settings |
| `manage_team` | - | Invite member button, role management |
| `view_billing` | /settings (billing/usage tabs) | Billing tabs in settings |
| `manage_billing` | - | Upgrade, manage subscription buttons |
| `view_settings` | /settings | Settings sidebar item |
| `manage_knowledge` | - | Knowledge section in Ari |
| `manage_help_articles` | - | Help Articles section in Ari |
| `manage_webhooks` | - | Webhooks section in Ari |
| `manage_integrations` | - | Integrations section, Connect Calendar |
| `manage_api_keys` | - | API Access section in Ari |
| `manage_leads` | - | Lead stage management in ManageStagesDialog |

---

## Implemented Permission Guards (Complete)

The following components have permission guards fully implemented:

### Routes (`App.tsx`)
- All protected routes wrapped with `PermissionGuard` component
- Redirects to appropriate fallback when permission denied

### Sidebar Navigation (`Sidebar.tsx`)
- Nav items filtered based on `view_*` permissions
- Team members only see items they're permitted to access

### Settings (`SettingsLayout.tsx`, `TeamSettings.tsx`, `SubscriptionSettings.tsx`)
- Settings tabs filtered by permission
- Team/billing tabs hidden without respective view permissions
- Invite button hidden without `manage_team`

### Conversations (`ChatHeader.tsx`, `Conversations.tsx`)
- Takeover/close/reopen buttons require `manage_conversations`
- Message input disabled without permission

### Leads (`Leads.tsx`, `LeadsKanbanBoard.tsx`, `LeadsTable.tsx`, `LeadDetailsSheet.tsx`, `ManageStagesDialog.tsx`)
- Create/delete buttons require `manage_leads`
- Stage change dropdowns disabled without permission
- Kanban drag-and-drop disabled without permission
- Row selection checkboxes disabled without permission
- Floating bulk action bar hidden without permission
- Lead stage management (create, edit, delete, reorder) requires `manage_leads`
- `canManage` prop passed to child components

### Planner (`Planner.tsx`, `EventDetailDialog.tsx`)
- Add event button requires `manage_bookings`
- Event drag/resize disabled without permission
- Delete/cancel buttons hidden without permission

### Ari Configurator (`AriSectionMenu.tsx`, `AriApiAccessSection.tsx`, `AgentApiKeyManager.tsx`)
- Menu sections filtered by permission
- Users only see sections they can access
- API key create/edit/revoke buttons require `manage_ari` permission
- `canManage` prop passed to `AgentApiKeyManager`

## Role Management Dialog

The `RoleManagementDialog` component allows admins to manage team member roles:

### Security Features
- Always fetches `currentUserRole` to determine if role dropdown should appear
- Role dropdown only visible for admin/super_admin editing others
- Users editing themselves see read-only role display
- `canEditPermissions` derived from admin status

### Backend Protection
- `updateMemberRole` in `useTeam` checks `canManageRoles` before database call
- `removeMember` in `useTeam` checks `canManageRoles` before database call
- RLS policies on `user_roles` table enforce:
  - SELECT: Own role or admin
  - UPDATE: Admin only
  - INSERT: Super admin only

---

## Adding Permission Guards Checklist

When creating new features:

- [ ] Identify the permission required (or create a new one)
- [ ] Guard routes in `App.tsx` with `PermissionGuard`
- [ ] Hide/disable buttons without permission
- [ ] Disable drag-and-drop without permission
- [ ] Disable form edits without permission
- [ ] Hide sidebar items without view permission
- [ ] Pass `canManage` prop to reusable components
- [ ] Add client-side permission checks in mutation functions
- [ ] Test as team member with limited permissions
- [ ] **Update this documentation!**

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Table structures and RLS policies
- [HOOKS_REFERENCE.md](./HOOKS_REFERENCE.md) - All hooks with signatures
- [SECURITY.md](./SECURITY.md) - Security best practices
