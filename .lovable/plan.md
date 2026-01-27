

# Plan: Move Help Articles Search to TopBar Center

## Overview

Move the search input from `HelpArticlesManager` (inline in the DataTableToolbar) to the TopBar's center slot, matching the pattern just implemented for Locations.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TopBar                                                                       │
│ ┌──────────────┬────────────────────┬─────────────────────────────────────┐ │
│ │ Left         │ Center (empty)     │ Right                               │ │
│ │ Ari > Help.. │                    │ [Embed All] [Import] [Cat] [+Add]   │ │
│ └──────────────┴────────────────────┴─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HelpArticlesManager                                                          │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ [🔍 Search articles...]              [🔧 Filters]   ← DataTableToolbar    ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ DataTable                                                                 ││
│ └───────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TopBar                                                                       │
│ ┌──────────────┬────────────────────┬─────────────────────────────────────┐ │
│ │ Left         │ Center             │ Right                               │ │
│ │ Ari > Help.. │ [🔍 Search...]     │ [Embed All] [Import] [Cat] [+Add]   │ │
│ └──────────────┴────────────────────┴─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HelpArticlesManager                                                          │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ [🔧 Filters]  [Active Filter Chips...]    ← Filters only, no search      ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ DataTable                                                                 ││
│ └───────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

Since the `AriSectionActionsContext` was already extended to support `centerContent` and `useRegisterSectionCenterContent` for Locations, we can reuse that exact same pattern:

1. Create a new `HelpArticlesTopBarSearch` component (mirroring `LocationsTopBarSearch`)
2. Register it as center content in `HelpArticlesManager` using the existing hook
3. Hide the inline search in `DataTableToolbar` using the `hideSearch` prop

---

## Implementation Details

### 1. Create HelpArticlesTopBarSearch Component
**File:** `src/components/agents/articles/HelpArticlesTopBarSearch.tsx` (NEW)

Simple search wrapper component that passes value/onChange to `TopBarSearch`:

```tsx
import { memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';

interface HelpArticlesTopBarSearchProps {
  /** Current global filter value from parent */
  value: string;
  /** Callback when search changes */
  onChange: (value: string) => void;
}

/**
 * Search component for the Help Articles section TopBar.
 * No popover/dropdown - just filters the data table directly.
 */
export const HelpArticlesTopBarSearch = memo(function HelpArticlesTopBarSearch({
  value,
  onChange,
}: HelpArticlesTopBarSearchProps) {
  return (
    <TopBarSearch
      placeholder="Search articles..."
      value={value}
      onChange={onChange}
      showPopover={false}
      className="w-48 lg:w-64"
    />
  );
});
```

### 2. Update HelpArticlesManager
**File:** `src/components/agents/HelpArticlesManager.tsx`

**Changes:**

**A. Add imports:**
```tsx
import { useRegisterSectionCenterContent } from '@/contexts/AriSectionActionsContext';
import { HelpArticlesTopBarSearch } from './articles/HelpArticlesTopBarSearch';
```

**B. Register center content (after line 604, after `useRegisterSectionActions`):**
```tsx
// Register center content for TopBar (search bar)
const centerContent = useMemo(() => (
  <HelpArticlesTopBarSearch
    value={globalFilter}
    onChange={setGlobalFilter}
  />
), [globalFilter]);

useRegisterSectionCenterContent('help-articles', centerContent);
```

**C. Update DataTableToolbar to hide search (lines 786-791):**
```tsx
<DataTableToolbar
  table={table}
  searchPlaceholder="Search articles..."
  globalFilter
  searchClassName="max-w-xs"
  hideSearch  // NEW - hide inline search, moved to TopBar
/>
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/agents/articles/HelpArticlesTopBarSearch.tsx` | **NEW** - Simple search wrapper component |
| `src/components/agents/HelpArticlesManager.tsx` | Import new hook, register center content, add `hideSearch` to toolbar |

---

## Visual Result

**Before:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Ari > Help Articles        [Embed] [Import] [Categories] [+Add] │
├──────────────────────────────────────────────────────────────────┤
│ [🔍 Search articles...]                           [🔧 Filters]  │ ← HERE
├──────────────────────────────────────────────────────────────────┤
│ | Title | Category | Status |                                   │
│ ...                                                              │
```

**After:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Ari > Help..  [🔍 Search...]   [Embed] [Import] [Cat] [+Add]    │ ← MOVED
├──────────────────────────────────────────────────────────────────┤
│                                                   [🔧 Filters]  │
├──────────────────────────────────────────────────────────────────┤
│ | Title | Category | Status |                                   │
│ ...                                                              │
```

---

## Dependencies

This implementation relies on infrastructure already created for Locations:

- ✅ `useRegisterSectionCenterContent` hook in `AriSectionActionsContext.tsx`
- ✅ `centerContent` state management in context
- ✅ `AriTopBarCenter` component in `AriConfigurator.tsx`
- ✅ `hideSearch` prop in `DataTableToolbar.tsx`
- ✅ `TopBarSearch` component with `showPopover={false}` support

No changes needed to the context or AriConfigurator - they already support this pattern.

---

## Technical Notes

1. **Section ID**: Uses `'help-articles'` to match the existing `useRegisterSectionActions` call
2. **Global Filter**: Reuses the existing `globalFilter` / `setGlobalFilter` state from TanStack Table
3. **Toolbar simplification**: The toolbar will only show the Filters button, not the search input
4. **Empty state**: Search still appears in TopBar even when no articles exist (helps with empty search feedback)

