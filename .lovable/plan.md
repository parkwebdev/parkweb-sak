

# Plan: Stripe-Style Row Actions with Hover Icons + Context Menu

## Overview

Transform all table action patterns from vertical 3-dot menus to the Stripe-inspired dual-interaction pattern:
1. **Hover state**: Show quick action icons in a pill-like container (edit, delete)
2. **Click on dots**: Open full context menu with icons + labels + extra options

This provides faster access to common actions while maintaining discoverability.

---

## Visual Design (Based on Stripe Reference)

```text
Default state (no hover):
┌─────────────────────────────────────────────────────────────────────┐
│  Row content...                                             ···    │
└─────────────────────────────────────────────────────────────────────┘

Hover state (shows quick actions):
┌─────────────────────────────────────────────────────────────────────┐
│  Row content...                                    [✎] [🗑] [···]  │
└─────────────────────────────────────────────────────────────────────┘
                                                     ↑     ↑    ↑
                                             Edit  Delete  More menu

Click on ··· opens full menu:
                                                          ┌──────────────┐
                                                          │ ACTIONS      │
                                                          ├──────────────┤
                                                          │ ✎  Edit      │
                                                          │ 🗑  Delete    │
                                                          │ ⎘  Copy ID   │
                                                          └──────────────┘
```

---

## Technical Implementation

### Part 1: Create Reusable `RowActions` Component

**New file: `src/components/ui/row-actions.tsx`**

A composable component that handles:
- Hover detection on parent row
- Quick action icon buttons (shown on hover)
- Horizontal dots menu trigger
- Full context menu on click

```typescript
interface QuickAction {
  icon: React.ComponentType<{ size?: number }>;
  label: string;          // For aria-label
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface RowActionsProps {
  quickActions: QuickAction[];
  menuContent: React.ReactNode;  // Full dropdown menu items
  isHovered?: boolean;           // Controlled hover state
}
```

Key features:
- Uses `DotsHorizontal` from `@untitledui/icons` (not vertical)
- Quick action icons appear with `opacity-0 group-hover:opacity-100` transition
- Tooltips on hover for each icon
- Click on dots opens full `DropdownMenu`

---

### Part 2: Update All Action Components

#### Files to modify (DotsVertical -> DotsHorizontal + hover actions):

| File | Quick Actions | Menu Items |
|------|--------------|------------|
| `AccountActions.tsx` | View, Impersonate | View, Impersonate, Suspend/Activate, Delete |
| `PlanActions.tsx` | Edit, Delete | Edit, Delete |
| `PlatformArticleActions.tsx` | Delete | Delete |
| `PilotTeamActions.tsx` | Edit, Remove | Manage Permissions, Remove Member |
| `leads-columns.tsx` | View | View details |
| `team-columns.tsx` | (already horizontal) | Manage Role, Edit Profile, Remove |
| `MetricCardWithChart.tsx` | - | (keep as-is, not table row) |
| `PreviewChat.tsx` | - | (keep as-is, not table row) |
| `PromptTestChat.tsx` | - | (keep as-is, not table row) |

---

### Part 3: Table Row Hover State Integration

Update `DataTable.tsx` to pass hover state to action cells:

```typescript
// In DataTable.tsx - TableRow needs "group" class for CSS hover
<TableRow
  className={cn(
    'group transition-colors',  // Add "group" for child hover detection
    onRowClick && 'cursor-pointer hover:bg-muted/50'
  )}
>
```

Action cells can then use `group-hover:opacity-100` for visibility.

---

### Part 4: Implementation Details per Component

#### `src/components/admin/accounts/AccountActions.tsx`

**Before:**
```tsx
<DotsVertical size={16} aria-hidden="true" />
```

**After:**
```tsx
<div className="flex items-center gap-0.5">
  {/* Quick actions - visible on row hover */}
  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton variant="ghost" size="icon-sm" label="View details" onClick={onView}>
          <Eye size={14} />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>View</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton variant="ghost" size="icon-sm" label="Impersonate" onClick={onImpersonate}>
          <SwitchHorizontal01 size={14} />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>Impersonate</TooltipContent>
    </Tooltip>
  </div>
  
  {/* Full menu trigger - always visible */}
  <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <IconButton variant="ghost" size="icon-sm" label="More actions">
        <DotsHorizontal size={16} />
      </IconButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
      {/* ... all menu items with icons */}
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

#### `src/components/admin/plans/PlanActions.tsx`

Quick actions: Edit (pencil), Delete (trash)
Full menu: Edit Plan, Delete Plan

---

#### `src/components/admin/knowledge/PlatformArticleActions.tsx`

Quick actions: Delete only (trash icon)
Full menu: Delete Article

---

#### `src/components/admin/team/PilotTeamActions.tsx`

Quick actions: Settings (if canEdit), Trash (if canDelete)
Full menu: Manage Permissions, Remove Member

---

#### `src/components/data-table/columns/leads-columns.tsx`

Quick actions: Eye icon for View
Full menu: View details

---

### Part 5: Icon Imports Update

Replace across all files:
```tsx
// Before
import { DotsVertical, ... } from '@untitledui/icons';

// After  
import { DotsHorizontal, ... } from '@untitledui/icons';
```

---

### Part 6: Menu Header Label

Following Stripe's pattern, add a subtle "ACTIONS" header label:

```tsx
<DropdownMenuContent>
  <DropdownMenuLabel className="text-2xs text-muted-foreground uppercase tracking-wider">
    Actions
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  {/* items */}
</DropdownMenuContent>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/row-actions.tsx` | Reusable row actions component with hover + menu |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/accounts/AccountActions.tsx` | DotsHorizontal, hover icons, menu label |
| `src/components/admin/plans/PlanActions.tsx` | DotsHorizontal, hover icons, menu label |
| `src/components/admin/knowledge/PlatformArticleActions.tsx` | DotsHorizontal, hover icons, menu label |
| `src/components/admin/team/PilotTeamActions.tsx` | DotsHorizontal, hover icons, menu label |
| `src/components/data-table/columns/leads-columns.tsx` | DotsHorizontal, hover icons, menu label |
| `src/components/data-table/columns/team-columns.tsx` | Add hover icons (already uses horizontal) |
| `src/components/data-table/DataTable.tsx` | Add `group` class to TableRow |
| `src/components/analytics/MetricCardWithChart.tsx` | DotsHorizontal (minor, not table) |
| `src/components/agents/PreviewChat.tsx` | DotsHorizontal (minor, header menu) |
| `src/components/admin/prompts/PromptTestChat.tsx` | DotsHorizontal (minor, header menu) |

---

## Accessibility Considerations

- All quick action icons have `aria-label` via IconButton's required `label` prop
- Tooltips provide visual labels on hover
- Full menu remains accessible via keyboard navigation
- Focus ring visible on all interactive elements

---

## Testing Checklist

After implementation:
- Hover over table rows to verify quick action icons appear
- Click quick action icons to verify they trigger correct actions
- Click horizontal dots to verify full menu opens
- Verify menu has "ACTIONS" header
- Test keyboard navigation through menu items
- Verify tooltips appear on quick action hover
- Test on mobile (touch) - quick actions may need alternate trigger

