

# Plan: Move Locations Search to TopBar Center

## Overview

Move the search input from `AriLocationsSection` (inline in the data table toolbar) to the TopBar's center slot, matching the pattern used by Help Center.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar                                                               │
│ ┌──────────────┬──────────────────────┬───────────────────────────┐ │
│ │ Left         │ Center (empty)       │ Right                     │ │
│ │ Ari > Locat..│                      │ [WordPress] [Add Location]│ │
│ └──────────────┴──────────────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AriLocationsSection                                                  │
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │ [Communities] [Properties]  [Filter]  ← ViewToggle + FilterPopover││
│ └───────────────────────────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │ [🔍 Search...]                        ← DataTableToolbar          ││
│ └───────────────────────────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │ Data Table                                                        ││
│ └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar                                                               │
│ ┌──────────────┬──────────────────────┬───────────────────────────┐ │
│ │ Left         │ Center               │ Right                     │ │
│ │ Ari > Locat..│ [🔍 Search...]       │ [WordPress] [Add Location]│ │
│ └──────────────┴──────────────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AriLocationsSection                                                  │
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │ [Communities] [Properties]  [Filter]  ← ViewToggle + FilterPopover││
│ └───────────────────────────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │ Data Table (no inline search)                                     ││
│ └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Option Analysis

| Approach | Pros | Cons |
|----------|------|------|
| **A. Extend AriSectionActionsContext** | Single context for all section content, consistent pattern | More complexity in existing context |
| **B. Create new AriSectionCenterContext** | Separation of concerns, clear responsibility | Another context to manage |
| **C. Lift state to AriConfigurator** | Simpler, direct control | Adds props drilling, couples parent to section logic |

**Chosen: Option A** - Extend `AriSectionActionsContext` to support a `centerContent` ReactNode in addition to `actions`.

---

## Implementation Details

### 1. Extend AriSectionActionsContext
**File:** `src/contexts/AriSectionActionsContext.tsx`

Add support for center content:

```tsx
// Add to interface
interface AriSectionActionsContextValue {
  actions: SectionAction[];
  centerContent: ReactNode | null;  // NEW
  registerActions: (sectionId: string, actions: SectionAction[]) => void;
  unregisterActions: (sectionId: string) => void;
  registerCenterContent: (sectionId: string, content: ReactNode) => void;  // NEW
  unregisterCenterContent: (sectionId: string) => void;  // NEW
  currentSection: string | null;
  setCurrentSection: (sectionId: string | null) => void;
}

// Add new state
const [centerContentBySection, setCenterContentBySection] = 
  useState<Record<string, ReactNode>>({});

const registerCenterContent = useCallback((sectionId: string, content: ReactNode) => {
  setCenterContentBySection(prev => ({ ...prev, [sectionId]: content }));
}, []);

const unregisterCenterContent = useCallback((sectionId: string) => {
  setCenterContentBySection(prev => {
    const next = { ...prev };
    delete next[sectionId];
    return next;
  });
}, []);

const centerContent = currentSection 
  ? centerContentBySection[currentSection] || null 
  : null;
```

Add hook for sections to register center content:

```tsx
export function useRegisterSectionCenterContent(
  sectionId: string, 
  content: ReactNode
) {
  const { registerCenterContent, unregisterCenterContent } = useAriSectionActions();
  
  useEffect(() => {
    registerCenterContent(sectionId, content);
    return () => unregisterCenterContent(sectionId);
  }, [sectionId, content, registerCenterContent, unregisterCenterContent]);
}
```

---

### 2. Create LocationsTopBarSearch Component
**File:** `src/components/agents/locations/LocationsTopBarSearch.tsx`

Self-contained search component that manages its own state (like HCTopBarSearch):

```tsx
import { useState, memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';

interface LocationsTopBarSearchProps {
  /** Current global filter value from parent */
  value: string;
  /** Callback when search changes */
  onChange: (value: string) => void;
  /** Placeholder based on view mode */
  placeholder?: string;
}

export const LocationsTopBarSearch = memo(function LocationsTopBarSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: LocationsTopBarSearchProps) {
  return (
    <TopBarSearch
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      showPopover={false}  // No dropdown results - just filters the table
      className="w-48 lg:w-64"
    />
  );
});
```

---

### 3. Update AriLocationsSection
**File:** `src/components/agents/sections/AriLocationsSection.tsx`

**Changes:**
1. Import `useRegisterSectionCenterContent`
2. Create memoized search component with current state
3. Register center content via the hook
4. Remove search from `DataTableToolbar` (set `searchColumn` to undefined or hide it)

```tsx
import { useRegisterSectionCenterContent } from '@/contexts/AriSectionActionsContext';
import { LocationsTopBarSearch } from '@/components/agents/locations/LocationsTopBarSearch';

// Inside the component:

// Register center content for TopBar (search bar)
const searchPlaceholder = viewMode === 'communities' 
  ? 'Search communities...' 
  : 'Search properties...';

const centerContent = useMemo(() => (
  <LocationsTopBarSearch
    value={globalFilter}
    onChange={setGlobalFilter}
    placeholder={searchPlaceholder}
  />
), [globalFilter, searchPlaceholder]);

useRegisterSectionCenterContent('locations', centerContent);

// Update DataTableToolbar to hide search - use a custom prop or wrapper
// Option: Remove search entirely by not rendering DataTableToolbar's search
```

**For removing inline search:**
Since `DataTableToolbar` always renders search, we have two options:

A. Add a `hideSearch` prop to `DataTableToolbar`
B. Create a simpler `LocationsToolbar` component that doesn't include search

**Chosen: Option A** - Add `hideSearch?: boolean` prop to `DataTableToolbar`

---

### 4. Update DataTableToolbar
**File:** `src/components/data-table/DataTableToolbar.tsx`

Add optional `hideSearch` prop:

```tsx
interface DataTableToolbarProps<TData> {
  // ... existing props
  /** Hide the search input (when search is in TopBar) */
  hideSearch?: boolean;
}

// In render:
{!hideSearch && (
  <div className={cn('relative w-full max-w-sm', searchClassName)}>
    {/* Search input */}
  </div>
)}
```

---

### 5. Update AriConfigurator
**File:** `src/pages/AriConfigurator.tsx`

Add center content from context to TopBar config:

```tsx
// Add to AriTopBarActions or create new component
function AriTopBarCenter() {
  const { centerContent } = useAriSectionActions();
  return <>{centerContent}</>;
}

// Update topBarConfig
const topBarConfig = useMemo(() => ({
  left: <TopBarPageContext ... />,
  center: <AriTopBarCenter />,  // NEW
  right: <AriTopBarActions />,
}), [currentSectionLabel]);
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/contexts/AriSectionActionsContext.tsx` | Add `centerContent`, `registerCenterContent`, `unregisterCenterContent`, `useRegisterSectionCenterContent` |
| `src/components/agents/locations/LocationsTopBarSearch.tsx` | **NEW** - Simple search wrapper component |
| `src/components/agents/sections/AriLocationsSection.tsx` | Register center content, update DataTableToolbar usage |
| `src/components/data-table/DataTableToolbar.tsx` | Add `hideSearch` prop |
| `src/pages/AriConfigurator.tsx` | Add `AriTopBarCenter` component, update topBarConfig |

---

## Visual Result

**Before:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Ari > Locations                      [WordPress] [Add Location] │
├──────────────────────────────────────────────────────────────────┤
│ [Communities] [Properties]                         [🔧 Filters] │
├──────────────────────────────────────────────────────────────────┤
│ [🔍 Search...]                                                   │ ← HERE
├──────────────────────────────────────────────────────────────────┤
│ | Name | State | Calendar | WordPress |                         │
│ ...                                                              │
```

**After:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Ari > Locations   [🔍 Search...]     [WordPress] [Add Location] │ ← MOVED
├──────────────────────────────────────────────────────────────────┤
│ [Communities] [Properties]                         [🔧 Filters] │
├──────────────────────────────────────────────────────────────────┤
│ | Name | State | Calendar | WordPress |                         │
│ ...                                                              │
```

---

## Edge Cases Handled

1. **View mode switch**: Search placeholder updates dynamically based on `viewMode`
2. **Section navigation**: Center content auto-clears when leaving Locations section (context handles this)
3. **Empty state**: Search still appears in TopBar even when table has no data (consistent UX)
4. **Responsive**: TopBarSearch has responsive widths (`w-48 lg:w-64`)

---

## Accessibility

- Search maintains keyboard focus and Escape to clear behavior
- `aria-label` preserved on clear button
- No changes to screen reader experience

