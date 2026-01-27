

# Plan: Fix Duplicate "Showing X of X" in Table Pagination

## Problem

The `DataTablePagination` component currently displays "Showing X to Y of Z results" on the bottom-left of every table, but we've now added `DataTableResultsInfo` above each table which shows the same information - creating unnecessary duplication.

## Current Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ Showing 1 to 25 of 150 sources  ← DataTableResultsInfo (TOP)   │
├─────────────────────────────────────────────────────────────────┤
│                         DATA TABLE                              │
├─────────────────────────────────────────────────────────────────┤
│ Showing 1 to 25 of 150 ← DUPLICATE  |  Rows per page [25▾]  ◀ ▶ │
└─────────────────────────────────────────────────────────────────┘
```

## New Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ Showing 1 to 25 of 150 sources  ← DataTableResultsInfo (TOP)   │
├─────────────────────────────────────────────────────────────────┤
│                         DATA TABLE                              │
├─────────────────────────────────────────────────────────────────┤
│ Rows per page [25▾]  ← MOVED LEFT    |    Page 1 of 6  ◀ ▶     │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Changes

### File: `src/components/data-table/DataTablePagination.tsx`

**Remove:**
- The entire left-side div containing "Showing X to Y of Z results" (lines 41-52)
- The `startRow`, `endRow`, `totalRows` calculations (no longer needed)
- The `showSelectedCount` prop (selection count is now handled by `DataTableResultsInfo`)

**Restructure:**
- Move "Rows per page" dropdown to the left side
- Keep page navigation controls on the right side

**Updated component structure:**

```tsx
export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
  showRowsPerPage = true,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <div className="flex items-center justify-between px-2 pt-4">
      {/* Left side: Rows per page */}
      {showRowsPerPage ? (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select ...>
            ...
          </Select>
        </div>
      ) : (
        <div /> // Spacer for layout
      )}

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-2">
        {/* First, Prev, "Page X of Y", Next, Last buttons */}
      </div>
    </div>
  );
}
```

## Interface Cleanup

**Before:**
```tsx
interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showRowsPerPage?: boolean;
  showSelectedCount?: boolean;  // REMOVE - no longer needed
}
```

**After:**
```tsx
interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showRowsPerPage?: boolean;
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/data-table/DataTablePagination.tsx` | Remove duplicate results text, move rows-per-page to left, remove `showSelectedCount` prop |

## Backward Compatibility

- Any existing usage of `showSelectedCount` prop will be ignored (no breaking changes)
- All tables using `DataTablePagination` will automatically get the new layout
- `DataTableResultsInfo` at the top continues to handle both results count and selection count

