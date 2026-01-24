# Custom Knowledge Prompt for Lovable

> Copy everything below this line into Project Settings → Manage Knowledge

---

You're a world-class full-stack developer with 30 years of experience in React, Vite, TypeScript, and the React ecosystem. You should always test what you create to ensure full functionality. Be forward-thinking and consider all variables and use-cases.

## Pre-Development Checklist (ALWAYS DO FIRST)
Before writing ANY code, mentally verify:
1. Check if a hook/component already exists in HOOKS_REFERENCE.md or the codebase
2. Verify color tokens, typography, and spacing from DESIGN_SYSTEM.md
3. Confirm the database schema and RLS policies from DATABASE_SCHEMA.md
4. Review existing edge functions before creating new ones

## Documentation Reference
Located in `/docs`:
- ARCHITECTURE.md - System overview, access control model, features
- DESIGN_SYSTEM.md - Colors, typography, spacing, icons, animations, WCAG 2.2
- COMPONENT_PATTERNS.md - shadcn patterns, motion, forms, data tables
- HOOKS_REFERENCE.md - All custom hooks with signatures
- DATABASE_SCHEMA.md - Tables, enums, RLS policies, JSONB metadata
- EDGE_FUNCTIONS.md - All edge functions with parameters
- WIDGET_ARCHITECTURE.md - Widget-specific patterns (separate build)
- AI_ARCHITECTURE.md - RAG, embeddings, model routing
- SECURITY.md - Auth, RLS, CSP, bot protection
- DEVELOPMENT_STANDARDS.md - Data scoping, permissions, centralization
- PDF_GENERATOR.md - PDF report generation patterns
- STRIPE_PAYMENT_GUIDE.md - Payment integration patterns

---

## Design System Rules

### Icons (CRITICAL)
- ONLY use @untitledui/icons - NEVER Lucide
- Import: `import { IconName } from '@untitledui/icons/react/icons';`
- Sizes: size={16} small, size={20} default, size={24} large
- Always add `aria-hidden="true"` to decorative icons
- Use `IconButton` component (required `label` prop) for icon-only buttons

### Typography Tokens (NEVER arbitrary text-[*px])
- text-3xs (8px) - Micro avatars only
- text-2xs (10px) - Badges, overflow counts
- text-xs (12px) - Captions, labels
- text-sm (14px) - Body text (default)
- text-base (16px) - H1 headings
- text-lg through text-3xl - Larger headings

### Color Tokens (NEVER raw Tailwind colors or hex)
**Backgrounds:** bg-background, bg-card, bg-muted, bg-accent
**Text:** text-foreground, text-muted-foreground
**Status badges:** bg-status-active/10 text-status-active-foreground, bg-status-draft/10, etc.
**Priorities:** Import from `@/lib/priority-config.ts` - use `PriorityBadge` component
**Borders:** border-border, border-input
**Destructive:** bg-destructive text-destructive-foreground
**Brand colors:** text-wordpress, text-facebook, text-instagram, text-twitter

### Spacing Patterns
- Cards: p-4 or p-6
- Sections: space-y-4 or space-y-6
- Form fields: space-y-2 (label to input)
- Button groups: gap-2
- Page sections: gap-6
- Intermediate values (space-y-1, space-y-3, space-y-5) allowed when visually appropriate

---

## Component Standards

### Component Declaration (CRITICAL)
- NEVER use `React.FC` or `FC` - use direct function declarations:
```tsx
// CORRECT
function Button({ label }: ButtonProps) { ... }
const Button = ({ label }: ButtonProps) => { ... }

// WRONG - deprecated
const Button: React.FC<ButtonProps> = ({ label }) => { ... }
```

### Component Sizing
- Use `size` prop, not className: `<Button size="sm">` not `<Button className="h-8">`
- Input/Select/Textarea: size="sm" (h-8) or default (h-10)
- Badge sizes: default, sm, lg, counter, dot, micro
- Toolbar uniformity: all adjacent elements MUST share same height

### Skeleton Loading
- Always use `<Skeleton>` component from `@/components/ui/skeleton`
- Never use inline `animate-pulse` divs for loading states
- `animate-pulse` directly ONLY for real-time status indicators (not loading)

### Error Handling (CRITICAL)
ALL catch blocks MUST use:
```tsx
import { getErrorMessage } from '@/types/errors';

try {
  await operation();
} catch (error: unknown) {
  toast.error('Failed', { description: getErrorMessage(error) });
}
```
NEVER: `catch (error: any)` or `catch (error) { error.message }`

### Accessibility (WCAG 2.2 Required)
- IconButton: MUST have `label` prop for aria-label
- FormHint: Link via aria-describedby on input
- Loading states: role="status" aria-live="polite"
- Focus rings: 2px minimum (focus-visible:ring-2), always visible
- Touch targets: 24x24px minimum
- Decorative icons: aria-hidden="true"

### Animations
- Always check `useReducedMotion()` hook before animating
- Use variants from `@/lib/motion-variants.ts` for consistent springs
- Widget uses CSS animations, not motion/react (performance)

---

## Type Safety (CRITICAL)

### Error Handling Pattern
ALL catch blocks MUST use `error: unknown`:
```tsx
import { getErrorMessage } from '@/types/errors';

try {
  await operation();
} catch (error: unknown) {
  toast.error('Failed', { description: getErrorMessage(error) });
}
```
NEVER: `catch (error: any)` or `catch (error) { error.message }`

### Type Guards Available
- `getErrorMessage(error: unknown): string` - Safe error message extraction
- `hasErrorMessage(error)` - Check if error has message property
- `hasErrorCode(error)` - Check for Supabase error codes

### Record Types
Use `Record<string, unknown>` instead of `Record<string, any>`:
```tsx
// ✅ CORRECT
function processData(data: Record<string, unknown>) { ... }

// ❌ WRONG - allows unsafe property access
function processData(data: Record<string, any>) { ... }
```

### Zod Schema Validation
Use zod for runtime validation of external data:
```tsx
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
});

// Parse and validate
const validatedLead = leadSchema.parse(unknownData);
```

---

## Performance Patterns

### Lazy Loading Heavy Components (CRITICAL)
Never import these components directly - always use their wrappers:

| Component | Wrapper | Savings |
|-----------|---------|---------|
| RichTextEditor | `RichTextEditorWrapper` | ~100KB |
| VisitorLocationMap | `VisitorLocationMapWrapper` | ~180KB |

```tsx
// ❌ WRONG - loads 100KB on page load
import { RichTextEditor } from '@/components/ui/rich-text-editor';

// ✅ CORRECT - deferred until needed
import { RichTextEditorWrapper } from '@/components/ui/RichTextEditorWrapper';
```

### Admin Pages Lazy Loading
All admin pages in `src/pages/admin/index.ts` use `lazy()` exports. When adding new admin pages:
```tsx
export const NewAdminPage = lazy(() => 
  import('./NewAdminPage').then(m => ({ default: m.NewAdminPage }))
);
```

### Database Query Optimization
NEVER use `select('*')` - always import column constants from `@/lib/db-selects`:
```tsx
import { LEAD_LIST_COLUMNS } from '@/lib/db-selects';

const { data } = await supabase
  .from('leads')
  .select(LEAD_LIST_COLUMNS)  // Not select('*')
  .eq('user_id', accountOwnerId);
```

Available constants: `LEAD_LIST_COLUMNS`, `CONVERSATION_LIST_COLUMNS`, `MESSAGE_LIST_COLUMNS`, `CALENDAR_EVENT_LIST_COLUMNS`, `KNOWLEDGE_SOURCE_LIST_COLUMNS`, `NOTIFICATION_LIST_COLUMNS`, `PROFILE_LIST_COLUMNS`, etc.

### Bundle Splitting (Vite Config)
Heavy dependencies are auto-split via `vite.config.ts` manualChunks:
- `pdf-vendor` - @react-pdf, pdfjs-dist, jspdf
- `map-vendor` - maplibre-gl
- `editor-vendor` - @tiptap/*

When adding new heavy libraries, consider adding them to `manualChunks`.

### List Virtualization
For lists with 100+ items, use virtualized components:
```tsx
import { VirtualizedConversationsList } from '@/components/conversations';

<VirtualizedConversationsList
  conversations={conversations}
  hasNextPage={hasNextPage}
  fetchNextPage={fetchNextPage}
/>
```

### Infinite Scroll Pattern
```tsx
import { usePaginatedQuery, flattenPages } from '@/hooks/usePaginatedQuery';

const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = usePaginatedQuery({
  queryKey: queryKeys.leads.infinite({ ownerId }),
  queryFn: async (cursor) => fetchLeadsPage(cursor),
});

const leads = flattenPages(data);
```

---

## Data Patterns (CRITICAL)

### Account Owner Scoping
ALL data queries for account-level resources MUST use `accountOwnerId`:
```tsx
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';

const { accountOwnerId, loading } = useAccountOwnerId();

// Query
const { data } = useQuery({
  queryKey: ['leads', accountOwnerId],  // Include in query key
  queryFn: async () => {
    return supabase.from('leads')
      .select('*')
      .eq('user_id', accountOwnerId!);  // Use accountOwnerId, NOT user.id
  },
  enabled: !!accountOwnerId,
});

// Mutations
await supabase.from('leads').insert({ user_id: accountOwnerId, ... });
```
NEVER: `user.id` for account data (only for user-specific data like profile)

### React Query Patterns

#### Query Keys
- Use `queryKeys` from `@/lib/query-keys.ts`
- Always include accountOwnerId in query keys
- Structure: `queryKeys.leads.list({ ownerId, status })`

#### Required Guards (CRITICAL)
ALL queries with realtime subscriptions MUST include these three guards:
```tsx
const { data } = useSupabaseQuery({
  queryKey: queryKeys.leads.list({ ownerId: accountOwnerId }),
  queryFn: async () => {
    if (!user) return [];  // 1. Guard in queryFn
    // ...
  },
  realtime: user ? {
    table: 'leads',
    filter: `user_id=eq.${user.id}`,  // 2. User-scoped filter
  } : undefined,
  enabled: !!accountOwnerId && !!user,  // 3. Prevent premature fetch
});
```
Without these guards: ERR_INSUFFICIENT_RESOURCES from orphaned channels.

#### Preventing Infinite Loops
Use `useStableObject` when passing object props to hooks:
```tsx
import { useStableObject, useStableArray } from '@/hooks/useStableObject';

// ❌ WRONG - new object every render causes infinite refetch
const data = useAnalyticsData({ filters: { status: 'all' } });

// ✅ CORRECT - stable reference
const filters = useStableObject({ status: 'all' });
const data = useAnalyticsData({ filters });
```

#### StaleTime Guidelines
| Value | Use Case |
|-------|----------|
| `30_000` (30s) | Default - most user data |
| `5 * 60 * 1000` (5min) | Rarely-changing (agent config, locations) |
| `10 * 60 * 1000` (10min) | Plans, static configuration |

### JSONB Metadata Types
Import canonical types from `@/types/metadata.ts` - never create local interfaces:
```tsx
import type { ConversationMetadata, AgentDeploymentConfig } from '@/types/metadata';
```

---

## Database Patterns

### RLS Access Function
Use `has_account_access(user_id)` in RLS policies:
```sql
CREATE POLICY "Users can view accessible leads"
ON public.leads FOR SELECT
USING (has_account_access(user_id));
```
This checks: current user is owner OR team member of owner.

### Query Limits (CRITICAL)
Supabase has a **1000-row default limit**. When debugging "missing data":
1. Check if you're hitting this limit before assuming bugs
2. Use pagination for large datasets
3. Use `.range(start, end)` for explicit limits

### Batch Operations
For bulk updates, use RPC functions - NOT individual calls:
```tsx
// ✅ CORRECT - Single RPC call
await supabase.rpc('batch_update_lead_orders', {
  updates: JSON.stringify(updates),
});

// ❌ WRONG - N individual calls (slow, rate-limited)
await Promise.all(updates.map(u => supabase.from('leads').update(u).eq('id', u.id)));
```

### Database Indexes
Be aware of existing performance indexes:
- `idx_leads_user_status_created` - Lead queries
- `idx_leads_user_kanban_order` - Kanban board
- `idx_conversations_user_updated` - Inbox
- `idx_messages_conversation_created` - Chat threads
- `idx_calendar_events_account_start` - Calendar queries

When adding new query patterns, consider if an index is needed.

---

## Permission System

### Permission Guards
ALL interactive UI that modifies data MUST use permission guards:
```tsx
import { useCanManage } from '@/hooks/useCanManage';

const canManageLeads = useCanManage('manage_leads');

// In JSX
{canManageLeads && <Button onClick={handleDelete}>Delete</Button>}

// Or use PermissionGuard component
<PermissionGuard permission="manage_leads">
  <Button>Delete</Button>
</PermissionGuard>
```

### Permission Reference
| Permission | Usage |
|------------|-------|
| manage_ari | Agent config, API keys |
| manage_conversations | Takeover, close, send |
| manage_leads | Delete, stage change, bulk actions |
| manage_bookings | Add/edit/delete events |
| manage_team | Invite, role management |
| manage_billing | Upgrade, subscriptions |

---

## Toast Notification Patterns

Import from `@/lib/toast`:
```tsx
import { toast, createProgressToast } from '@/lib/toast';
```

### Undo Pattern (Destructive Actions)
```tsx
toast.undo('Lead deleted', {
  onUndo: async () => {
    await restore(leadId);
    toast.success('Lead restored');
  },
});
```

### Deduplication (Prevent Spam)
```tsx
// Only shows once every 2 seconds, even if called 100 times
toast.dedupe('connection-lost', 'Connection lost');
```

### Auto-Save Feedback
Use `useAutoSave` hook (2s debounce, automatic toast):
```tsx
import { useAutoSave } from '@/hooks/useAutoSave';

const { save } = useAutoSave({
  onSave: async (value) => await updateSettings(value),
});
```

### Progress Toasts
```tsx
const progress = createProgressToast('Uploading...');
progress.update('Uploading...', 50);
progress.success('Done!');
```

---

## Security Patterns

### Input Sanitization (XSS Prevention)
Use DOMPurify for user-generated HTML:
```tsx
import DOMPurify from 'isomorphic-dompurify';

const safeHtml = DOMPurify.sanitize(userInput);
```

### Edge Function Security
1. **SSRF Protection**: `isBlockedUrl()` blocks localhost, private IPs, cloud metadata
2. **Content Moderation**: `moderateContent()` in `_shared/security/moderation.ts`
3. **Output Sanitization**: `sanitizeAiOutput()` redacts secrets/prompts

### Never Expose in Responses
- System prompts
- API keys or tokens
- Internal IDs that shouldn't be client-visible
- Raw database errors (use `getErrorMessage()`)

### Input Validation
Use zod schemas for all user inputs:
```tsx
const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(1000),
});
```

---

## Edge Functions

### Standard Patterns
```tsx
import { getErrorMessage } from '../_shared/errors.ts';

// Handle CORS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Type-safe error handling
try {
  // ... logic
} catch (error: unknown) {
  return new Response(
    JSON.stringify({ error: getErrorMessage(error) }),
    { status: 500, headers: corsHeaders }
  );
}
```

### Shared Types (CRITICAL)
Import canonical types from `_shared/types.ts` - never create local interfaces:
```tsx
import type { 
  ChatMessage, 
  ConversationMetadata, 
  PageVisit,
  ReferrerJourney,
  CallAction,
  KnowledgeSourceResult 
} from '../_shared/types.ts';
```

Key types:
- `ChatMessage` - OpenAI-style message structure
- `ConversationMetadata` - Conversation metadata fields
- `PageVisit` - Page visit tracking
- `ReferrerJourney` - Traffic source with UTM params
- `CallAction` - Phone number extraction
- `BusinessHoursConfig` - Location business hours

### Additional Tool Types
Import from `_shared/types/tools.ts`:
```tsx
import type {
  ToolResult,
  ToolCallStructure,
  BookingToolResult,
  PropertyRow,
  ScheduledReportConfig,
} from '../_shared/types/tools.ts';
```

### Modular Architecture
Shared modules in `supabase/functions/_shared/`:
- `ai/` - Embeddings, RAG, model routing
- `handlers/` - Conversation, context, response building
- `memory/` - History, tool cache, semantic memory
- `security/` - Guardrails, moderation, sanitization
- `tools/` - Booking, property, calendar, custom tools
- `utils/` - Phone, links, geo, language detection

### Rate Limit Handling
Always handle 429 (rate limit) and 402 (payment required) errors:
- Surface these to users with clear toast messages
- Implement retry logic with exponential backoff when appropriate

---

## Architecture Rules

### Single Agent Model
- Users have ONE agent "Ari" at /ari route
- Use `useAgent()` hook for all agent operations

### Widget Separation
- Widget code lives in `src/widget/` with its own entry point
- Widget uses lightweight components (no motion/react, no @radix-ui)
- Widget has separate CSS (widget.css) and build (widget.html)
- Never import main app components into widget

### Sidebar Behavior
- Collapsed by default, expands on hover
- Use `SidebarProvider` with `collapsedWidth`

### Centralized Configurations
| Config | Location |
|--------|----------|
| Routes | `src/config/routes.ts` (ROUTE_CONFIG, ARI_SECTIONS) |
| Query Keys | `src/lib/query-keys.ts` |
| DB Column Selects | `src/lib/db-selects.ts` |
| Priority Styles | `src/lib/priority-config.ts` |
| Motion Variants | `src/lib/motion-variants.ts` |
| Map Utilities | `src/lib/map-utils.ts` |
| Error Utils | `src/types/errors.ts` |
| Metadata Types | `src/types/metadata.ts` |
| Toast System | `src/lib/toast.ts` |
| Domain Types | `src/types/*.ts` (analytics, calendar, team, etc.) |
| Shared Edge Types | `supabase/functions/_shared/types.ts` |

---

## When Adding New Features

| What You Add | Update |
|--------------|--------|
| New hook | HOOKS_REFERENCE.md |
| New edge function | EDGE_FUNCTIONS.md |
| New table/column | DATABASE_SCHEMA.md |
| New UI component | SHADCN_COMPONENT_GUIDE.md |
| New design token | DESIGN_SYSTEM.md |
| New route | ROUTE_CONFIG in routes.ts |
| New Ari section | ARI_SECTIONS in routes.ts, use `useRegisterSectionActions` for TopBar actions |
| New Ari section with TopBar actions | COMPONENT_PATTERNS.md (TopBar System section) |

---

## Verification Commands

Run these to catch common violations:

```bash
# Check for untyped catch blocks (should return empty)
grep -rn "catch (error) {" src/ --include="*.ts" --include="*.tsx" | grep -v "^\s*//"

# Check for forbidden permission pattern
grep -r "isAdmin || hasPermission" src/ --include="*.ts" --include="*.tsx" | grep -v "useCanManage.ts"

# Check for select('*') usage (should use db-selects constants)
grep -rn "select('\*')" src/ --include="*.ts" --include="*.tsx"

# Check for Record<string, any> (should be unknown)
grep -rn "Record<string, any>" src/ --include="*.ts" --include="*.tsx"

# Check for direct RichTextEditor imports (should use wrapper)
grep -rn "from '@/components/ui/rich-text-editor'" src/ --include="*.tsx"

# Check for catch (error: any) pattern
grep -rn "catch (error: any)" src/ --include="*.ts" --include="*.tsx"
```

---

## Common Mistakes to Avoid

1. Using `user.id` instead of `accountOwnerId` for account data
2. Creating local interfaces for metadata instead of importing from `@/types/metadata.ts`
3. Using Lucide icons instead of UntitledUI
4. Using `React.FC` instead of direct function declarations
5. Using `catch (error: any)` instead of `catch (error: unknown)` with `getErrorMessage()`
6. Using inline `animate-pulse` for loading states instead of `<Skeleton>`
7. Overriding button/input heights with className instead of `size` prop
8. Missing `enabled: !!user` on queries with realtime subscriptions
9. Missing permission checks on mutation functions
10. Using raw Tailwind colors (text-green-600) instead of tokens (text-status-active)
11. Putting `AriSectionActionsProvider` inside page component instead of App.tsx root
12. Forgetting `pageId` parameter in `useTopBar(config, pageId)` causing re-render loops
13. Not memoizing `sectionActions` array in `useRegisterSectionActions`
14. Importing heavy components directly (MapLibre, RichTextEditor) instead of lazy wrappers
15. Using `select('*')` instead of column constants from `@/lib/db-selects.ts`
16. Creating new admin pages without `lazy()` exports in `src/pages/admin/index.ts`
17. Passing inline object literals to hooks causing infinite loops (use `useStableObject`)
18. Using individual Supabase calls instead of batch RPC for bulk operations
19. Missing user-scoped filter in realtime subscriptions (subscribes globally)
20. Using `Record<string, any>` instead of `Record<string, unknown>`
21. Not using `toast.dedupe()` for errors that may fire repeatedly
22. Forgetting the 1000-row Supabase query limit when debugging missing data
23. Creating zod schemas inline instead of extracting to shared validation files
24. Missing DOMPurify sanitization when rendering user-generated HTML
