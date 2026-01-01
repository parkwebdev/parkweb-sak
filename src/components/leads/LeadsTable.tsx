/**
 * @fileoverview Leads data table with sorting, selection, filtering, and pagination.
 * Integrates with TanStack Table for row selection, faceted filters, and bulk actions.
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  SortingState,
  RowSelectionState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Trash01, Sliders02 } from '@untitledui/icons';
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  DataTableFloatingBar,
} from '@/components/data-table';
import { createLeadsColumns, type Lead } from '@/components/data-table/columns/leads-columns';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { ViewModeToggle } from './ViewModeToggle';
import { Button } from '@/components/ui/button';
import type { SortOption } from './LeadsViewSettingsSheet';

interface LeadsTableProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onView: (lead: Lead) => void;
  onStageChange: (leadId: string, stageId: string) => void;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onBulkDelete?: (ids: string[]) => void;
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings?: () => void;
  // External column visibility control
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  // Column order
  columnOrder: string[];
  // Default sorting
  defaultSort: SortOption | null;
  /** Whether the user can manage leads (select for bulk actions, etc.) */
  canManage?: boolean;
}

export const LeadsTable = React.memo(function LeadsTable({
  leads,
  selectedIds,
  onView,
  onStageChange,
  onSelectionChange,
  onSelectAll,
  onBulkDelete,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  defaultSort,
  canManage = true,
}: LeadsTableProps) {
  // Initialize sorting from defaultSort
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (defaultSort) {
      return [{ id: defaultSort.column, desc: defaultSort.direction === 'desc' }];
    }
    return [];
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Update sorting when defaultSort changes (only if sorting is currently empty or matches previous default)
  useEffect(() => {
    if (defaultSort) {
      setSorting([{ id: defaultSort.column, desc: defaultSort.direction === 'desc' }]);
    }
  }, [defaultSort]);

  const rowSelection = useMemo(() => {
    const selection: RowSelectionState = {};
    leads.forEach((lead, index) => {
      if (selectedIds.has(lead.id)) {
        selection[index] = true;
      }
    });
    return selection;
  }, [leads, selectedIds]);

  const columns = useMemo(
    () =>
      createLeadsColumns({
        onView,
        onStageChange,
        StatusDropdown: LeadStatusDropdown,
      }),
    [onView, onStageChange]
  );

  // Reorder columns based on columnOrder prop
  const orderedColumns = useMemo(() => {
    // Keep select column first, then order the rest
    const selectCol = columns.find(col => col.id === 'select');
    const otherCols = columns.filter(col => col.id !== 'select');
    
    const orderedOtherCols = columnOrder
      .map(id => otherCols.find(col => {
        const colId = col.id || (col as { accessorKey?: string }).accessorKey;
        return colId === id;
      }))
      .filter((col): col is typeof otherCols[0] => col !== undefined);
    
    // Add any columns not in the order (in case new columns are added)
    otherCols.forEach(col => {
      const colId = col.id || (col as { accessorKey?: string }).accessorKey;
      if (!columnOrder.includes(colId as string)) {
        orderedOtherCols.push(col);
      }
    });
    
    return selectCol ? [selectCol, ...orderedOtherCols] : orderedOtherCols;
  }, [columns, columnOrder]);

  const handleRowSelectionChange = useCallback((updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    
    const allSelected = Object.keys(newSelection).length === leads.length;
    const noneSelected = Object.keys(newSelection).length === 0;
    
    if (allSelected && !selectedIds.size) {
      onSelectAll(true);
    } else if (noneSelected && selectedIds.size > 0) {
      onSelectAll(false);
    } else {
      leads.forEach((lead, index) => {
        const wasSelected = selectedIds.has(lead.id);
        const isNowSelected = newSelection[index] ?? false;
        if (wasSelected !== isNowSelected) {
          onSelectionChange(lead.id, isNowSelected);
        }
      });
    }
  }, [leads, selectedIds, onSelectAll, onSelectionChange, rowSelection]);

  const table = useReactTable({
    data: leads,
    columns: orderedColumns,
    state: {
      sorting,
      rowSelection: canManage ? rowSelection : {},
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: canManage,
    onSortingChange: setSorting,
    onRowSelectionChange: canManage ? handleRowSelectionChange : undefined,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
      onColumnVisibilityChange(newVisibility);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      arrIncludesSome: (row, columnId, filterValue: string[]) => {
        const value = row.getValue(columnId) as string;
        return filterValue.includes(value);
      },
    },
  });

  const handleRowClick = useCallback((lead: Lead) => {
    onView(lead);
  }, [onView]);

  const handleBulkDelete = useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);
    onBulkDelete?.(ids);
  }, [table, onBulkDelete]);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search leads..."
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        prefix={
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        }
        endContent={
          onOpenSettings && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={onOpenSettings}
            >
              <Sliders02 size={16} />
              <span className="hidden sm:inline">Customize</span>
            </Button>
          )
        }
      />
      <DataTable
        table={table}
        columns={orderedColumns}
        onRowClick={handleRowClick}
        emptyMessage="No leads found"
      />
      {leads.length > 10 && (
        <DataTablePagination table={table} showSelectedCount={canManage} />
      )}
      {canManage && (
        <DataTableFloatingBar table={table}>
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-7"
            >
              <Trash01 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </DataTableFloatingBar>
      )}
    </div>
  );
});
