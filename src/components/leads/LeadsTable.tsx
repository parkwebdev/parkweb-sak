/**
 * @fileoverview Leads data table with sorting, selection, filtering, and pagination.
 * Integrates with TanStack Table for row selection, faceted filters, and bulk actions.
 */

import React, { useMemo, useCallback } from 'react';
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
} from '@tanstack/react-table';
import { useState } from 'react';
import { Trash01, Download01, LayoutAlt04, List } from '@untitledui/icons';
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  DataTableFacetedFilter,
  DataTableFloatingBar,
} from '@/components/data-table';
import { createLeadsColumns, type Lead } from '@/components/data-table/columns/leads-columns';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { Button } from '@/components/ui/button';

interface LeadsTableProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onView: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: string) => void;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onBulkDelete?: (ids: string[]) => void;
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
}

const STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

export const LeadsTable = React.memo(function LeadsTable({
  leads,
  selectedIds,
  onView,
  onStatusChange,
  onSelectionChange,
  onSelectAll,
  onBulkDelete,
  viewMode,
  onViewModeChange,
}: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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
        onStatusChange,
        StatusDropdown: LeadStatusDropdown,
      }),
    [onView, onStatusChange]
  );

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
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
        searchPlaceholder="Filter by name..."
        globalFilter
        showViewOptions
      >
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={STATUS_OPTIONS}
        />
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('kanban')}
            aria-label="Kanban view"
          >
            <LayoutAlt04 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </DataTableToolbar>
      <DataTable
        table={table}
        columns={columns}
        onRowClick={handleRowClick}
        emptyMessage="No leads found"
      />
      {leads.length > 10 && (
        <DataTablePagination table={table} showSelectedCount />
      )}
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
        <Button variant="outline" size="sm" className="h-7">
          <Download01 className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DataTableFloatingBar>
    </div>
  );
});
