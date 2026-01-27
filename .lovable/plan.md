
## Fix Empty State Navigation in Locations Tab

### Problem
When all property listings are deleted while communities still exist, the Locations page shows the Properties empty state **without** the view toggle buttons. This traps the user in an empty view with no way to switch to the Communities tab where their data exists.

### Root Cause
The empty state for each view (Communities/Properties) completely replaces the toolbar that contains the ViewToggle buttons, making it impossible to switch views when one view is empty.

### Solution
Always show the ViewToggle buttons even when a view is empty, so users can navigate between Communities and Properties regardless of data state.

---

### File: `src/components/agents/sections/AriLocationsSection.tsx`

**1. Move ViewToggle outside the conditional empty state blocks (~lines 673-797)**

Currently, each view has this structure:
```tsx
{viewMode === 'communities' && (
  <>
    {locationsWithCounts.length === 0 ? (
      <EmptyState ... />  // No ViewToggle here!
    ) : (
      <div>
        <DataTableToolbar>
          {ViewToggle}  // Only shown when data exists
        </DataTableToolbar>
        ...
      </div>
    )}
  </>
)}
```

**Change to:**
```tsx
{/* Always show ViewToggle for navigation */}
{(locations.length > 0 || propertiesWithLocation.length > 0) && (
  <div className="flex items-center justify-between">
    {ViewToggle}
    {/* Only show filters when current view has data */}
    {((viewMode === 'communities' && locationsWithCounts.length > 0) ||
      (viewMode === 'properties' && propertiesWithLocation.length > 0)) && 
      FilterPopover}
  </div>
)}

{/* Communities View */}
{viewMode === 'communities' && (
  <>
    {locationsWithCounts.length === 0 ? (
      <EmptyState ... />
    ) : (
      <div className="space-y-3">
        <DataTableToolbar ... />  // Keep search/toolbar
        ...
      </div>
    )}
  </>
)}
```

**2. Update the global empty state condition**

Only show the "no locations yet" empty state (with Add Location button) when BOTH locations AND properties are empty. This is the true "getting started" state.

**3. Keep individual view empty states for context**

- Communities empty + Properties have data → Show toggle + message: "No communities yet. Switch to Properties to see synced homes."
- Properties empty + Communities have data → Show toggle + message: "No properties synced yet. Connect WordPress to sync homes."

---

### Technical Implementation

Refactor lines 672-798 to:

1. Extract a standalone header bar with ViewToggle that's always visible when any data exists
2. Keep the DataTableToolbar with search inside each view's data table section
3. Update empty state conditions to check for the "both empty" scenario separately

---

### Result

| Scenario | Before | After |
|----------|--------|-------|
| Properties empty, Communities exist | Stuck on Properties empty state, no toggle | ViewToggle visible, can switch to Communities |
| Communities empty, Properties exist | Stuck on Communities empty state | ViewToggle visible, can switch to Properties |
| Both empty | Empty state with Add button | Same - Empty state with Add button |

