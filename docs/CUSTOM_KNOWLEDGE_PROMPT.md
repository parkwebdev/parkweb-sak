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
- Use `queryKeys` from `@/lib/query-keys.ts`
- Always include user/owner ID in query keys
- Set `enabled: !!dependency` to prevent premature fetching
- Use `useStableObject()` hook when passing object props to prevent infinite loops

### JSONB Metadata Types
Import canonical types from `@/types/metadata.ts` - never create local interfaces:
```tsx
import type { ConversationMetadata, AgentDeploymentConfig } from '@/types/metadata';
```

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
| Priority Styles | `src/lib/priority-config.ts` |
| Motion Variants | `src/lib/motion-variants.ts` |
| Error Utils | `src/types/errors.ts` |
| Metadata Types | `src/types/metadata.ts` |

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
