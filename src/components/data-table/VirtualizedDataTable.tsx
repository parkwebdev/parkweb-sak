/**
 * Virtualized Data Table Component
 * 
 * Uses @tanstack/react-virtual for efficient rendering of large datasets.
 * Only renders visible rows for improved performance with 10k+ records.
 * 
 * @component
 */

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flexRender, type Table, type ColumnDef } from '@tanstack/react-table';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VirtualizedDataTableProps<TData, TValue> {
  /** TanStack Table instance */
  table: Table<TData>;
  /** Column definitions */
  columns: ColumnDef<TData, TValue>[];
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Message when no data */
  emptyMessage?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Estimated row height for virtualization */
  rowHeight?: number;
  /** Maximum height of the scrollable area */
  maxHeight?: string;
  /** Number of rows to render outside the viewport */
  overscan?: number;
}

export function VirtualizedDataTable<TData, TValue>({
  table,
  columns,
  onRowClick,
  emptyMessage = 'No results',
  isLoading = false,
  rowHeight = 52,
  maxHeight = '600px',
  overscan = 10,
}: VirtualizedDataTableProps<TData, TValue>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const getScrollElement = useCallback(() => parentRef.current, []);
  const estimateSize = useCallback(() => rowHeight, [rowHeight]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
    estimateSize,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead key={header.id}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </UITable>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Fixed header */}
      <UITable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
      </UITable>
      
      {/* Virtualized scrollable body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <UITable>
          <TableBody
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
              display: 'block',
            }}
          >
            {items.map((virtualItem) => {
              const row = rows[virtualItem.index];
              return (
                <TableRow
                  key={row.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                    'flex w-full'
                  )}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${rowHeight}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className="flex items-center"
                      style={{ flex: 1 }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </UITable>
      </div>
    </div>
  );
}
