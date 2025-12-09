# Data Table & Dashboard Guide

This document outlines the TanStack Table architecture and patterns used throughout the ChatPad application.

## Architecture Overview

All data tables use **TanStack Table (React Table v8)** with shadcn/ui components and Framer Motion animations.

### Component Hierarchy

```
DataTable (generic wrapper)
├── TableHeader
│   └── DataTableColumnHeader (sortable headers)
├── motion.tbody (stagger container)
│   └── AnimatedTableRow (motion-enabled rows)
│       └── TableCell
├── DataTableToolbar (search + filters)
├── DataTablePagination (page controls)
└── DataTableRowActions (row action dropdown)
```

## Core Components

### DataTable (`src/components/data-table/DataTable.tsx`)

Generic table wrapper that integrates TanStack Table with shadcn/ui and motion.

```tsx
import { DataTable } from '@/components/data-table';

<DataTable
  table={table}           // TanStack table instance
  columns={columns}       // Column definitions
  onRowClick={handleClick} // Optional row click handler
  emptyMessage="No data." // Empty state message
  isLoading={false}       // Loading state
/>
```

**Features:**
- Accepts TanStack table instance
- Animated rows via `AnimatedTableRow`
- Staggered enter animations via `motion.tbody`
- Respects reduced motion preferences
- Loading skeleton state

### DataTableColumnHeader (`src/components/data-table/DataTableColumnHeader.tsx`)

Sortable column header with visual indicators.

```tsx
import { DataTableColumnHeader } from '@/components/data-table';

{
  accessorKey: 'name',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Name" />
  ),
}
```

**Features:**
- Sort direction icons (ArrowUp, ArrowDown, ChevronSelectorVertical)
- Accessible button wrapper
- Keyboard navigation support

### DataTableToolbar (`src/components/data-table/DataTableToolbar.tsx`)

Search and filter toolbar.

```tsx
import { DataTableToolbar } from '@/components/data-table';

<DataTableToolbar
  table={table}
  searchPlaceholder="Search..."
  searchColumn="name"      // Column-specific search
  globalFilter={true}      // Or use global filter
/>
```

### DataTablePagination (`src/components/data-table/DataTablePagination.tsx`)

Pagination controls with page size selector.

```tsx
import { DataTablePagination } from '@/components/data-table';

<DataTablePagination
  table={table}
  pageSizeOptions={[10, 25, 50, 100]}
  showRowsPerPage={true}
  showSelectedCount={true}
/>
```

### DataTableRowActions (`src/components/data-table/DataTableRowActions.tsx`)

Dropdown menu for row actions.

```tsx
import { DataTableRowActions } from '@/components/data-table';

<DataTableRowActions
  onView={() => handleView(row)}
  onEdit={() => handleEdit(row)}
  onDelete={() => handleDelete(row)}
/>
```

### DataTableViewOptions (`src/components/data-table/DataTableViewOptions.tsx`)

Column visibility toggle dropdown.

```tsx
import { DataTableViewOptions } from '@/components/data-table';

<DataTableViewOptions table={table} />
```

## Column Definition Patterns

### Factory Pattern

Create column definitions using factory functions for reusability:

```tsx
// src/components/data-table/columns/leads-columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../DataTableColumnHeader';

export interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
}

export function createLeadsColumns(options: {
  onView: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}): ColumnDef<Lead>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          onView={() => options.onView(row.original)}
        />
      ),
    },
  ];
}
```

### Static Columns

For simpler tables, export static column definitions:

```tsx
// src/components/data-table/columns/analytics-columns.tsx
export const usageMetricsColumns: ColumnDef<UsageMetricsRow>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
  },
  {
    accessorKey: 'conversations',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Conversations" />
    ),
  },
];
```

## Motion Integration

### AnimatedTableRow (`src/components/ui/animated-table-row.tsx`)

Motion-enabled table row component:

```tsx
import { AnimatedTableRow } from '@/components/ui/animated-table-row';

<AnimatedTableRow
  index={rowIndex}
  onClick={() => handleClick(row)}
  data-state={row.getIsSelected() ? 'selected' : undefined}
>
  {cells}
</AnimatedTableRow>
```

**Features:**
- Fade + slide-up enter animation
- Exit animation via AnimatePresence
- Index-based stagger delay
- Hover/tap feedback
- Respects `useReducedMotion`

### Motion Variants (`src/lib/motion-variants.ts`)

Shared animation variants:

```tsx
import {
  staggerContainerVariants,
  tableRowVariants,
  fadeReducedVariants,
  getVariants,
} from '@/lib/motion-variants';

// Get appropriate variants based on reduced motion preference
const variants = getVariants(
  tableRowVariants,
  fadeReducedVariants,
  prefersReducedMotion
);
```

### Reduced Motion Support

All tables respect user's reduced motion preference:

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

const prefersReducedMotion = useReducedMotion();
const containerVariants = getVariants(
  staggerContainerVariants,
  fadeReducedVariants,
  prefersReducedMotion
);
```

## Table Implementation Example

Complete example of a TanStack Table implementation:

```tsx
import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
} from '@tanstack/react-table';
import { DataTable, DataTableToolbar, DataTablePagination } from '@/components/data-table';
import { createLeadsColumns } from '@/components/data-table/columns';

export function LeadsTable({ leads, onView, onStatusChange }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = useMemo(
    () => createLeadsColumns({ onView, onStatusChange }),
    [onView, onStatusChange]
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} searchColumn="name" />
      <DataTable table={table} columns={columns} onRowClick={onView} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

## Available Column Definitions

### Conversations (`conversations-columns.tsx`)
- Selection checkbox
- Agent / Lead (with subtext showing lead name)
- Messages count
- Duration (formatted from created_at)
- % of Total (progress bar with percentage)
- Status (badge with color coding)
- Actions (view, delete)

### Leads (`leads-columns.tsx`)
- Selection checkbox
- Name, Email, Phone, Company
- Status (with dropdown)
- Actions (view)

### Team (`team-columns.tsx`)
- Member (avatar + name + email)
- Role (badge)
- Actions (edit, delete)

### Landing Pages (`landing-pages-columns.tsx`)
- Page URL (formatted path)
- Views, Avg Duration
- Conversions, Conversion Rate
- Agent (badge)

### Analytics (`analytics-columns.tsx`)
- Conversations analytics
- Leads analytics
- Agent performance
- Usage metrics

## Best Practices

1. **Type Safety**: Always define proper TypeScript interfaces for row data
2. **Memoization**: Memoize column definitions to prevent unnecessary re-renders
3. **Motion**: Use `AnimatedTableRow` for consistent animations
4. **Reduced Motion**: Always check `useReducedMotion` for accessibility
5. **Loading States**: Show skeleton loaders during data fetching
6. **Empty States**: Provide meaningful empty state messages
7. **Responsive**: Test tables on mobile viewports

## File Structure

```
src/components/data-table/
├── index.ts                    # Exports all components
├── DataTable.tsx               # Generic table wrapper
├── DataTableColumnHeader.tsx   # Sortable header
├── DataTableToolbar.tsx        # Search + filters
├── DataTablePagination.tsx     # Page controls
├── DataTableRowActions.tsx     # Row action dropdown
├── DataTableViewOptions.tsx    # Column visibility
└── columns/
    ├── index.ts                # Column exports
    ├── conversations-columns.tsx # Conversations table columns
    ├── leads-columns.tsx       # Leads table columns
    ├── team-columns.tsx        # Team table columns
    ├── landing-pages-columns.tsx
    └── analytics-columns.tsx   # Analytics table columns
```

## ChatPad-Specific Patterns

### Conversations Table
Uses TanStack Table with real-time Supabase subscriptions, unread badges, and human takeover status indicators.

### Leads Table
Includes inline status dropdown editing, bulk selection, and view details sheet.

### Team Members Table
Role-based action visibility with avatar rendering and role badges.

### Analytics Data Tables
Dynamic column selection based on active tab with CSV export functionality.
