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

## 7. TypeScript Strict Mode Preparation

> **Status**: Phases 4.1 & 4.5 Complete ✓  
> **Completed**: January 2026

### Error Handling Standard

All `catch` blocks MUST use `error: unknown` typing:

```typescript
// ✅ CORRECT: Typed catch block
try {
  await riskyOperation();
} catch (error: unknown) {
  console.error('Operation failed:', error);
  // Use getErrorMessage(error) for user-facing messages
}

// ❌ WRONG: Untyped catch block (breaks strict mode)
try {
  await riskyOperation();
} catch (error) {  // Implicit 'any' type
  console.error(error.message);  // Unsafe property access
}
```

### Record Types Standard

Use `Record<string, unknown>` instead of `Record<string, any>`:

```typescript
// ✅ CORRECT
function processData(data: Record<string, unknown>) { ... }

// ❌ WRONG: Allows unsafe property access
function processData(data: Record<string, any>) { ... }
```

### Phase 4.1: Frontend Type Safety

```bash
# Verify no untyped catch blocks (should only find JSDoc examples)
grep -rn "catch (error) {" src/ --include="*.ts" --include="*.tsx" | grep -v "^\s*//"
grep -rn "catch (e) {" src/ --include="*.ts" --include="*.tsx"
grep -rn "catch (err) {" src/ --include="*.ts" --include="*.tsx"

# Verify no Record<string, any> (should return empty)
grep -rn "Record<string, any>" src/ --include="*.ts" --include="*.tsx"
```

**Files Updated in Phase 4.1:**

| File | Changes |
|------|---------|
| `src/components/leads/LeadActivityPanel.tsx` | 3 catch blocks typed |
| `src/lib/pdf-components/fonts.ts` | 2 catch blocks typed |
| `src/lib/pdf-generator.tsx` | 1 catch block typed |
| `src/components/AuthTurnstile.tsx` | 3 catch blocks typed |
| `src/components/settings/SessionsSection.tsx` | 1 catch block typed |
| `src/pages/EmailTemplatesTest.tsx` | 1 catch block typed |
| `src/pages/Leads.tsx` | 5 catch blocks typed |
| `src/pages/ReportBuilder.tsx` | 1 catch block typed |
| `src/widget/utils/migration.ts` | 1 catch block typed |
| `src/widget/components/TurnstileWidget.tsx` | 2 catch blocks typed |
| `src/widget/hooks/useWidgetMessaging.ts` | Already typed ✓ |
| `src/components/pdf/PdfJsViewer.tsx` | 2 catch blocks typed |
| `src/widget/api.ts` | `Record<string, any>` → `Record<string, unknown>` |

### Phase 4.5: Edge Functions Type Safety

All edge functions now follow strict TypeScript standards:

1. **No `: any` annotations** - All parameters and return types explicitly typed
2. **`catch (error: unknown)`** - All error handlers use unknown type
3. **Shared types** - Canonical types in `_shared/types.ts`

```bash
# Verify no untyped catch blocks in edge functions
grep -rn "catch (error: any)" supabase/functions/
grep -rn "catch (error) {" supabase/functions/ --include="*.ts"

# Verify no : any type annotations
grep -rn ": any" supabase/functions/ --include="*.ts"
```

**Files Updated in Phase 4.5:**

| File | Changes |
|------|---------|
| `supabase/functions/_shared/types.ts` | Consolidated shared types with JSDoc |
| `supabase/functions/_shared/errors.ts` | Type-safe `getErrorMessage()` |
| `supabase/functions/_shared/ai/rag.ts` | Fixed `: any` → explicit types |
| `supabase/functions/_shared/ai/embeddings.ts` | Typed catch blocks |
| `supabase/functions/_shared/handlers/context.ts` | Typed arrays and records |
| `supabase/functions/_shared/handlers/response-builder.ts` | Fixed implicit any params |
| `supabase/functions/_shared/memory/semantic-memory.ts` | Typed memory operations |
| `supabase/functions/_shared/tools/property-tools.ts` | Typed property interfaces |
| `supabase/functions/_shared/tools/custom-tools.ts` | Typed tool execution |
| `supabase/functions/_shared/security/guardrails.ts` | Typed security checks |
| `supabase/functions/widget-chat/index.ts` | Typed request/response |

**Shared Types Reference** (`_shared/types.ts`):

| Type | Purpose |
|------|---------|
| `ChatMessage` | OpenAI-style message structure |
| `ConversationMetadata` | Metadata stored with conversations |
| `PageVisit` | Visitor page tracking |
| `ReferrerJourney` | Traffic source tracking |
| `ShownProperty` | Property context for multi-property |
| `CallAction` | Phone number extraction for calls |
| `KnowledgeSourceResult` | RAG search results |
| `ToolUsage` | Tool execution tracking |
| `LinkPreview` | URL preview metadata |
| `BusinessHoursConfig` | Location business hours |
| `GoogleCalendarEventBody` | Google Calendar API payload |
| `MicrosoftCalendarEventBody` | Microsoft Graph API payload |

---

## 8. Performance Patterns

> **Status**: Implemented ✓  
> **Completed**: January 2026

Performance optimizations for handling large data sets and high user loads.

### React Query Global Configuration

Global defaults are set in `src/App.tsx`. Individual hooks should only override when necessary:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30s - default for most data
      gcTime: 5 * 60 * 1000,       // 5 min garbage collection
      retry: 2,
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**StaleTime Guidelines:**
| Value | Use Case |
|-------|----------|
| `30_000` (30s) | Default - most user data |
| `5 * 60 * 1000` (5min) | Rarely-changing data (agent config, locations) |
| `2 * 60 * 1000` (2min) | Analytics data |
| `10 * 60 * 1000` (10min) | Plans, static configuration |

### Column Selection Optimization

**ALWAYS** use specific columns instead of `select('*')` for list views:

```typescript
import { LEAD_LIST_COLUMNS, CONVERSATION_LIST_COLUMNS } from '@/lib/db-selects';

// ✅ CORRECT: Use predefined columns
const { data } = await supabase
  .from('leads')
  .select(LEAD_LIST_COLUMNS)
  .eq('user_id', accountOwnerId);

// ❌ WRONG: Fetches unnecessary data
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('user_id', accountOwnerId);
```

**Benefits:**
- Reduces payload size by 40-60%
- Faster query execution
- Less memory usage on client

**Available Columns** (`src/lib/db-selects.ts`):
| Constant | Table | Use Case |
|----------|-------|----------|
| `LEAD_LIST_COLUMNS` | leads | Kanban, table views |
| `LEAD_DETAIL_COLUMNS` | leads | Detail sheets |
| `CONVERSATION_LIST_COLUMNS` | conversations | Inbox list |
| `MESSAGE_LIST_COLUMNS` | messages | Chat display |
| `WEBHOOK_LOG_COLUMNS` | webhook_logs | Monitoring |
| `CALENDAR_EVENT_LIST_COLUMNS` | calendar_events | Planner |
| `KNOWLEDGE_SOURCE_LIST_COLUMNS` | knowledge_sources | Knowledge management |
| `HELP_ARTICLE_LIST_COLUMNS` | help_articles | Help center |
| `NOTIFICATION_LIST_COLUMNS` | notifications | Notification list |
| `TEAM_MEMBER_LIST_COLUMNS` | team_members | Team management |
| `ANNOUNCEMENT_LIST_COLUMNS` | announcements | Widget announcements |
| `AGENT_API_KEY_COLUMNS` | agent_api_keys | API key management |
| `LEAD_STAGE_COLUMNS` | lead_stages | Pipeline stages |
| `LEAD_ACTIVITY_COLUMNS` | lead_activities | Activity timeline |
| `LEAD_COMMENT_COLUMNS` | lead_comments | Comment threads |
| `LEAD_ASSIGNEE_COLUMNS` | lead_assignees | Assignee management |
| `NEWS_ITEM_COLUMNS` | news_items | News/updates feed |
| `LOCATION_COLUMNS` | locations | Location management |
| `HELP_CATEGORY_COLUMNS` | help_categories | Help categories |
| `SCHEDULED_REPORT_COLUMNS` | scheduled_reports | Scheduled reports |
| `PROFILE_LIST_COLUMNS` | profiles | Profile lookups |
| `REPORT_EXPORT_COLUMNS` | report_exports | Export history |
| `PROPERTY_LIST_COLUMNS` | properties | Property listings |
| `WEBHOOK_COLUMNS` | webhooks | Webhook configuration |
| `KB_ARTICLE_POPULARITY_COLUMNS` | kb_article_popularity | Article analytics |

### Image Optimization

Use `<OptimizedImage>` component or add `loading="lazy"` and `decoding="async"` to all images:

```tsx
import { OptimizedImage } from '@/components/ui/optimized-image';

// Regular image (lazy loaded)
<OptimizedImage src="/image.jpg" alt="Description" />

// Priority image (above-the-fold, loads immediately)
<OptimizedImage src="/hero.jpg" alt="Hero" priority />

// Or use native attributes directly
<img 
  src="/image.jpg" 
  alt="Description"
  loading="lazy"
  decoding="async"
/>
```

**Guidelines:**
- Use `priority` prop for above-the-fold images (hero, logo)
- All other images should use lazy loading (default)
- Always include `alt` text for accessibility

### Batch Operations

For bulk updates (drag-and-drop, multi-select actions), use RPC functions instead of multiple individual calls:

```typescript
// ✅ CORRECT: Single RPC call
const { error } = await supabase.rpc('batch_update_lead_orders', {
  updates: JSON.stringify(updates),
});

// ❌ WRONG: N individual calls
const results = await Promise.all(
  updates.map(u => supabase.from('leads').update(u).eq('id', u.id))
);
```

**Available Batch Functions:**
| Function | Purpose |
|----------|---------|
| `batch_update_lead_orders` | Kanban drag-and-drop reordering |

### Infinite Scroll (Foundation)

For large data lists, use cursor-based pagination with `usePaginatedQuery`:

```typescript
import { usePaginatedQuery, flattenPages } from '@/hooks/usePaginatedQuery';

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePaginatedQuery({
  queryKey: ['leads', accountOwnerId],
  queryFn: async (cursor) => {
    let query = supabase
      .from('leads')
      .select(LEAD_LIST_COLUMNS)
      .eq('user_id', accountOwnerId)
      .order('created_at', { ascending: false })
      .limit(25);
    
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return {
      data: data || [],
      nextCursor: data?.length === 25 ? data.at(-1)?.created_at : null,
    };
  },
  enabled: !!accountOwnerId,
});

// Flatten for rendering
const leads = flattenPages(data);
```

### Bundle Analysis

Bundle analyzer generates `dist/stats.html` on production builds:

```bash
npm run build
# Open dist/stats.html to view bundle composition
```

**Optimization Targets:**
- Main chunk < 200KB gzipped
- Widget chunk < 50KB gzipped
- Vendor chunks split by usage

### Database Indexes

Performance-critical indexes added:

```sql
-- Lead queries
CREATE INDEX idx_leads_user_status_created ON leads(user_id, status, created_at DESC);
CREATE INDEX idx_leads_user_kanban_order ON leads(user_id, stage_id, kanban_order);

-- Conversation queries
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);

-- Message queries  
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
```

### List Virtualization

For long lists (100+ items), use `@tanstack/react-virtual` for performance:

```tsx
import { VirtualizedConversationsList } from '@/components/conversations';
import { VirtualizedMessageThread } from '@/components/conversations';

// Use virtualized components for large lists
<VirtualizedConversationsList
  conversations={conversations}
  hasNextPage={hasNextPage}
  fetchNextPage={fetchNextPage}
  isFetchingNextPage={isFetchingNextPage}
  {...otherProps}
/>
```

**Available Virtualized Components:**
| Component | Use Case |
|-----------|----------|
| `VirtualizedConversationsList` | Inbox conversation list with infinite scroll |
| `VirtualizedMessageThread` | Long message threads (100+ messages) |

### Infinite Scroll Page Integration (Section 6 - Verified Complete)

Pages using infinite scroll should follow this pattern:

```tsx
// 1. Import the infinite hook
import { useInfiniteLeads } from '@/hooks/useInfiniteLeads';

// 2. Destructure pagination controls
const { 
  leads, 
  loading,
  hasNextPage, 
  fetchNextPage, 
  isFetchingNextPage 
} = useInfiniteLeads();

// 3. Set up intersection observer for auto-loading
const loadMoreRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.1, rootMargin: '100px' }
  );
  
  observer.observe(loadMoreRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// 4. Add trigger element and loading indicator at end of list
<div ref={loadMoreRef} className="h-4" aria-hidden="true" />

{isFetchingNextPage && (
  <div className="flex justify-center py-4">
    <Loading02 size={20} className="animate-spin text-muted-foreground" aria-hidden="true" />
    <span className="sr-only">Loading more items</span>
  </div>
)}
```

**Completed Integrations:**
| Page | Hook Used | Status |
|------|-----------|--------|
| `src/pages/Leads.tsx` | `useInfiniteLeads` | ✅ Verified Complete |
| `src/pages/Conversations.tsx` | `useInfiniteConversations` + `VirtualizedConversationsList` | ✅ Verified Complete |

### Performance Checklist

When adding new data features:

- [ ] Use column selection from `db-selects.ts` (not `select('*')`)
- [ ] Set appropriate `staleTime` for query caching
- [ ] Add `loading="lazy"` to images
- [ ] Consider pagination for lists > 50 items
- [ ] Use batch RPC for bulk updates
- [ ] Add database indexes for common query patterns
- [ ] Include `accountOwnerId` in query keys for cache consistency
- [ ] Use virtualization for lists > 100 items
- [ ] Use RealtimeManager for real-time subscriptions
- [ ] Use infinite scroll hooks for paginated data

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Tables and RLS policies
- [HOOKS_REFERENCE.md](./HOOKS_REFERENCE.md) - Hook signatures
- [SECURITY.md](./SECURITY.md) - Security practices
