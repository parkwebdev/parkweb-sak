# Team Scoping Standard

> **MANDATORY READING** for all development on Pilot.
> This document establishes the coding standard for account-scoped data access.

## Overview

All data in Pilot is scoped to an **account owner**. Team members share access to the owner's data - they do **not** have their own separate data stores.

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

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Table structures and RLS policies
- [HOOKS_REFERENCE.md](./HOOKS_REFERENCE.md) - All hooks with signatures
- [SECURITY.md](./SECURITY.md) - Security best practices
