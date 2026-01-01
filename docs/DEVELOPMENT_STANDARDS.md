# Development Standards

> **MANDATORY READING** for all development on Pilot.  
> **Last Updated**: January 2026

This document establishes coding standards for data scoping, permission guards, and centralization patterns.

---

## 1. Data Scoping

All data in Pilot is scoped to an **account owner**. Team members share access to the owner's data.

### Core Concept: `accountOwnerId`

| User Type | `accountOwnerId` Value |
|-----------|----------------------|
| Account Owner (has subscription) | Their own `user.id` |
| Team Member | Their team owner's `user_id` |

### Required Hook Pattern

```typescript
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';

export function useMyFeature() {
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();

  const { data } = useQuery({
    queryKey: ['my-feature', accountOwnerId],  // ← Include in query key
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('user_id', accountOwnerId!);       // ← Use accountOwnerId, NOT user.id
      if (error) throw error;
      return data;
    },
    enabled: !!accountOwnerId,                  // ← Wait for resolution
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: NewItem) => {
      await supabase.from('my_table').insert({
        ...newItem,
        user_id: accountOwnerId,               // ← NEVER use user.id directly
      });
    },
  });
}
```

### Data Classification

| Category | Scope By | Examples |
|----------|----------|----------|
| Account Data | `accountOwnerId` | Agents, leads, conversations, analytics, knowledge |
| User Data | `user.id` | Profile, preferences, notification settings |
| Agent Data | `agentId` (inherits) | Tools, calendars, properties, help articles |

### Common Mistakes

```typescript
// ❌ WRONG: Using user.id for account data
const { user } = useAuth();
await supabase.from('leads').insert({ user_id: user.id, ... });
// Creates data under team member, not account owner!

// ✅ CORRECT: Using accountOwnerId
const { accountOwnerId } = useAccountOwnerId();
await supabase.from('leads').insert({ user_id: accountOwnerId, ... });

// ❌ WRONG: Missing accountOwnerId in query key
queryKey: ['leads', status]
// Cache won't update properly when switching accounts

// ✅ CORRECT: Include accountOwnerId
queryKey: ['leads', accountOwnerId, status]
```

### Adding New Hooks Checklist

- [ ] Import `useAccountOwnerId` hook
- [ ] Use `accountOwnerId` for all SELECT queries
- [ ] Use `accountOwnerId` for INSERT operations
- [ ] Include `accountOwnerId` in query keys
- [ ] Set `enabled: !!accountOwnerId`
- [ ] Combine loading states (`isLoading || ownerLoading`)
- [ ] Add `onSuccess` invalidation with correct query key

### RLS Policies

Database RLS uses `has_account_access()` to verify access:

```sql
CREATE POLICY "Users can view accessible leads"
ON public.leads FOR SELECT
USING (has_account_access(user_id));
```

The function checks if current user is the account owner OR a team member. RLS is a safety net—always use `accountOwnerId` in queries for clarity and performance.

---

## 2. Permission Guards

All interactive UI that modifies data **MUST** use permission guards.

### Use `useCanManage` Hooks (REQUIRED)

```typescript
import { useCanManage, useCanManageMultiple, useCanManageChecker } from '@/hooks/useCanManage';

// Single permission
const canManageLeads = useCanManage('manage_leads');

// Multiple permissions
const perms = useCanManageMultiple(['manage_leads', 'manage_team']);

// Dynamic (prop-based)
const canManage = useCanManageChecker();
const hasAccess = canManage(props.permission);
```

### PermissionGuard Component

```typescript
import { PermissionGuard } from '@/components/auth/PermissionGuard';

<PermissionGuard permission="manage_leads">
  <Button onClick={handleDelete}>Delete</Button>
</PermissionGuard>
```

### Forbidden Pattern

```typescript
// ❌ WRONG - Do not use outside useCanManage.ts
const { hasPermission, isAdmin } = useRoleAuthorization();
const canManage = isAdmin || hasPermission('manage_leads');

// ✅ CORRECT
const canManage = useCanManage('manage_leads');
```

---

## 3. Centralization Rules

### Single Sources of Truth

| Config | File | Exports |
|--------|------|---------|
| Routes | `src/config/routes.ts` | `ROUTE_CONFIG`, `getRouteById()` |
| Settings Tabs | `src/config/routes.ts` | `SETTINGS_TABS` |
| Ari Sections | `src/config/routes.ts` | `ARI_SECTIONS`, `getValidAriSectionIds()` |
| Permissions | `src/hooks/useCanManage.ts` | `useCanManage*` hooks |

### Route Guards

All protected routes use `PermissionGuard` with `getGuardProps(routeId)`:

```typescript
<Route path="/leads" element={
  <PermissionGuard {...getGuardProps('leads')}>
    <Leads />
  </PermissionGuard>
} />
```

---

## 4. Verification & Guardrails

### Verification Commands

```bash
# Check for forbidden permission pattern (should return empty)
grep -r "isAdmin || hasPermission" src/ --include="*.ts" --include="*.tsx" | grep -v "useCanManage.ts"

# Check for duplicate config definitions (should only show routes.ts)
grep -rn "const ROUTE_CONFIG\|const SETTINGS_TABS\|const ARI_SECTIONS" src/

# Verify PermissionGuard usage in App.tsx
grep -rn "PermissionGuard" src/App.tsx
```

### CI Check (Recommended)

```bash
if grep -r "isAdmin || hasPermission" src/ --include="*.ts" --include="*.tsx" | grep -v "useCanManage.ts" | grep -q .; then
  echo "ERROR: Found forbidden permission pattern. Use useCanManage hooks instead."
  exit 1
fi
```

### Code Review Checklist

- [ ] New routes added to `ROUTE_CONFIG`
- [ ] New settings tabs added to `SETTINGS_TABS`
- [ ] New Ari sections added to `ARI_SECTIONS`
- [ ] Permission checks use `useCanManage*` hooks
- [ ] Data queries use `accountOwnerId` (not `user.id`)
- [ ] `accountOwnerId` included in query keys

---

## 5. Permission Reference

| Permission | Routes | UI Elements |
|------------|--------|-------------|
| `manage_ari` | /ari | Ari configurator, API keys |
| `view_conversations` | /conversations | Inbox sidebar |
| `manage_conversations` | - | Takeover, close, send |
| `view_leads` | /leads | Leads sidebar |
| `manage_leads` | - | Delete, stage change, drag-drop, bulk actions |
| `view_bookings` | /planner | Planner sidebar |
| `manage_bookings` | - | Add/edit/delete events |
| `view_dashboard` | /analytics | Analytics sidebar |
| `view_team` | /settings | Team tab |
| `manage_team` | - | Invite, role management |
| `view_billing` | /settings | Billing tabs |
| `manage_billing` | - | Upgrade, manage subscription |

### Adding Permission Guards Checklist

- [ ] Identify the permission required (or create new one)
- [ ] Guard routes in `App.tsx` with `PermissionGuard`
- [ ] Hide/disable buttons without permission
- [ ] Disable drag-and-drop without permission
- [ ] Disable form edits without permission
- [ ] Hide sidebar items without view permission
- [ ] Pass `canManage` prop to reusable components
- [ ] Test as team member with limited permissions

---

## 6. Implemented Guards

### Routes (`App.tsx`)
All protected routes wrapped with `PermissionGuard` using `getGuardProps()`.

### Sidebar (`Sidebar.tsx`)
Nav items filtered based on `view_*` permissions.

### Settings (`SettingsLayout.tsx`)
Tabs filtered by permission; invite button requires `manage_team`.

### Conversations (`ChatHeader.tsx`)
Takeover/close/reopen require `manage_conversations`; input disabled without permission.

### Leads (`Leads.tsx`, `LeadsKanbanBoard.tsx`, `LeadsTable.tsx`)
- Create/delete require `manage_leads`
- Stage dropdowns disabled without permission
- Kanban drag-drop disabled without permission
- Row selection disabled without permission
- Bulk actions hidden without permission

### Planner (`Planner.tsx`, `EventDetailDialog.tsx`)
Add event requires `manage_bookings`; drag/resize disabled without permission.

### Ari (`AriSectionMenu.tsx`, `AgentApiKeyManager.tsx`)
Sections filtered by permission; API key actions require `manage_ari`.

### Role Management (`RoleManagementDialog.tsx`)
- Role dropdown only visible for admins editing others
- Users editing themselves see read-only display
- Backend checks `canManageRoles` before database calls
- RLS on `user_roles`: SELECT (own/admin), UPDATE (admin), INSERT (super_admin)

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Tables and RLS policies
- [HOOKS_REFERENCE.md](./HOOKS_REFERENCE.md) - Hook signatures
- [SECURITY.md](./SECURITY.md) - Security practices
