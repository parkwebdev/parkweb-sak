/**
 * @fileoverview Leads data table with sorting, selection, and pagination.
 * Integrates with TanStack Table for row selection and status updates.
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable, DataTablePagination } from '@/components/data-table';
import { createLeadsColumns, type Lead } from '@/components/data-table/columns/leads-columns';
import { LeadStatusDropdown } from './LeadStatusDropdown';

interface LeadsTableProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onView: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: string) => void;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const LeadsTable = ({
  leads,
  selectedIds,
  onView,
  onStatusChange,
  onSelectionChange,
  onSelectAll,
}: LeadsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

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

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      
      // Sync with parent state
      const allSelected = Object.keys(newSelection).length === leads.length;
      const noneSelected = Object.keys(newSelection).length === 0;
      
      if (allSelected && !selectedIds.size) {
        onSelectAll(true);
      } else if (noneSelected && selectedIds.size > 0) {
        onSelectAll(false);
      } else {
        // Individual row changes
        leads.forEach((lead, index) => {
          const wasSelected = selectedIds.has(lead.id);
          const isNowSelected = newSelection[index] ?? false;
          if (wasSelected !== isNowSelected) {
            onSelectionChange(lead.id, isNowSelected);
          }
        });
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClick = (lead: Lead) => {
    onView(lead);
  };

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        onRowClick={handleRowClick}
        emptyMessage="No leads found"
      />
      {leads.length > 10 && (
        <DataTablePagination table={table} showSelectedCount />
      )}
    </div>
  );
};
