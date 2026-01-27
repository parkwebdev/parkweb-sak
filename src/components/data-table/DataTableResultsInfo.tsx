/**
 * @fileoverview Data table results info component showing "Showing X to Y of Z" pattern.
 * Displays current page range and total count, with support for selection count.
 */

import { Table } from '@tanstack/react-table';

interface DataTableResultsInfoProps<TData> {
  /** TanStack table instance */
  table: Table<TData>;
  /** Total count for server-side pagination (uses table row count if not provided) */
  totalCount?: number;
  /** Label for the items (e.g., "results", "sources", "articles") */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays "Showing X to Y of Z results" or selection count.
 * Supports both client-side and server-side pagination.
 */
export function DataTableResultsInfo<TData>({
  table,
  totalCount,
  label = 'results',
  className,
}: DataTableResultsInfoProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = totalCount ?? table.getFilteredRowModel().rows.length;
  const startRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, filteredCount);

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  if (selectedCount > 0) {
    return (
      <p className={`text-sm text-muted-foreground ${className || ''}`}>
        {selectedCount} of {filteredCount.toLocaleString()} selected
      </p>
    );
  }

  return (
    <p className={`text-sm text-muted-foreground ${className || ''}`}>
      Showing {startRow.toLocaleString()} to {endRow.toLocaleString()} of{' '}
      {filteredCount.toLocaleString()} {label}
    </p>
  );
}
