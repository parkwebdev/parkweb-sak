

# Plan: Compact ViewToggle & Filters in Locations Section

## Overview

Update the Locations section's ViewToggle (Communities/Properties) and Filters button to use smaller, TopBar-consistent sizing, wrapped in a pill-style container.

---

## Current State

```
┌──────────────────────────────────────────────────────────────────┐
│ [Communities (12)]  [Properties (345)]        [Filters ▾]       │
│  ↑                   ↑                          ↑               │
│  Default size        Default size               Default size    │
│  No container        No container               h-10 button     │
└──────────────────────────────────────────────────────────────────┘
```

## Target State

```
┌──────────────────────────────────────────────────────────────────┐
│ ╭─────────────────────────────────────────────╮                  │
│ │ [Communities (12)] [Properties (345)]       │  [Filters ▾]    │
│ ╰─────────────────────────────────────────────╯   ↑              │
│   ↑ bg-muted rounded container with sm buttons   size="sm" h-8  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/agents/sections/AriLocationsSection.tsx`

#### 1. Update ViewToggle Component (lines 463-486)

Wrap the buttons in a pill container and use `size="sm"` for smaller buttons:

**Before:**
```tsx
const ViewToggle = (
  <div className="flex items-center gap-1">
    <Button 
      variant={viewMode === 'communities' ? 'secondary' : 'ghost'}
      onClick={() => setViewMode('communities')}
      className={viewMode === 'communities' ? 'bg-muted hover:bg-muted/80' : ''}
    >
      Communities
      <Badge variant="outline" size="counter" className="ml-1.5">
        {locations.length}
      </Badge>
    </Button>
    <Button 
      variant={viewMode === 'properties' ? 'secondary' : 'ghost'}
      onClick={() => setViewMode('properties')}
      className={viewMode === 'properties' ? 'bg-muted hover:bg-muted/80' : ''}
    >
      Properties
      <Badge variant="outline" size="counter" className="ml-1.5">
        {propertiesWithLocation.length}
      </Badge>
    </Button>
  </div>
);
```

**After:**
```tsx
const ViewToggle = (
  <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1">
    <Button 
      size="sm"
      variant={viewMode === 'communities' ? 'secondary' : 'ghost'}
      onClick={() => setViewMode('communities')}
      className={viewMode === 'communities' 
        ? 'bg-background shadow-sm hover:bg-background/90' 
        : 'hover:bg-transparent'
      }
    >
      Communities
      <Badge variant="outline" size="counter" className="ml-1.5">
        {locations.length}
      </Badge>
    </Button>
    <Button 
      size="sm"
      variant={viewMode === 'properties' ? 'secondary' : 'ghost'}
      onClick={() => setViewMode('properties')}
      className={viewMode === 'properties' 
        ? 'bg-background shadow-sm hover:bg-background/90' 
        : 'hover:bg-transparent'
      }
    >
      Properties
      <Badge variant="outline" size="counter" className="ml-1.5">
        {propertiesWithLocation.length}
      </Badge>
    </Button>
  </div>
);
```

**Key changes:**
- Container: `inline-flex items-center gap-1 rounded-md bg-muted p-1`
- Buttons: Add `size="sm"` for h-8 height
- Active style: `bg-background shadow-sm` (matches TabsList active state pattern)
- Inactive ghost: `hover:bg-transparent` to prevent double-hover effect inside container

#### 2. Update FilterPopover Button (lines 500-509)

Add `size="sm"` to the Filters button:

**Before:**
```tsx
<Button variant="outline" className="gap-1.5">
  <FilterLines size={16} />
  Filters
  {activeFilters.length > 0 && (
    <Badge variant="secondary" size="counter" className="ml-1">
      {activeFilters.length}
    </Badge>
  )}
</Button>
```

**After:**
```tsx
<Button variant="outline" size="sm" className="gap-1.5">
  <FilterLines size={16} />
  Filters
  {activeFilters.length > 0 && (
    <Badge variant="secondary" size="counter" className="ml-1">
      {activeFilters.length}
    </Badge>
  )}
</Button>
```

---

## Visual Comparison

| Element | Before | After |
|---------|--------|-------|
| ViewToggle container | No container | `rounded-md bg-muted p-1` pill |
| ViewToggle buttons | Default (h-10) | `size="sm"` (h-8) |
| Active button style | `bg-muted` | `bg-background shadow-sm` |
| Filters button | Default (h-10) | `size="sm"` (h-8) |

---

## Design Pattern Reference

This matches existing patterns in the codebase:
- **TabsList**: `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1`
- **AnimatedTabsList**: `relative inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1`
- **ThemeSwitcher**: `inline-flex items-center gap-1 rounded-md bg-muted p-1`
- **TopBar actions**: All use `size="sm"` (h-8 buttons)

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/agents/sections/AriLocationsSection.tsx` | Wrap ViewToggle in container, add `size="sm"` to all buttons |

