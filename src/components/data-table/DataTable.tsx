/**
 * @fileoverview Reusable data table component built on TanStack Table.
 * Uses CSS-only animations for performance.
 */

import React from 'react';
import {
  ColumnDef,
  flexRender,
  Table as TanStackTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DataTableColumnMeta } from './types';

/** Get alignment class from column meta */
function getAlignmentClass(meta: DataTableColumnMeta | undefined): string | undefined {
  if (!meta?.align) return undefined;
  switch (meta.align) {
    case 'right': return 'text-right';
    case 'center': return 'text-center';
    default: return undefined;
  }
}

interface DataTableProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  onRowClick?: (row: TData) => void;
  emptyMessage?: React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  table,
  columns,
  onRowClick,
  emptyMessage = 'No results found.',
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  if (isLoading) {
    return (
      <div className="rounded-md border overflow-x-auto min-w-0" role="status" aria-live="polite" aria-label="Loading table data">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto min-w-0">
      <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const columnDef = header.column.columnDef;
                const size = header.column.getSize();
                const hasCustomSize = size !== 150; // 150 is TanStack's default
                const meta = columnDef.meta as DataTableColumnMeta | undefined;
                const alignClass = getAlignmentClass(meta);
                
                return (
                  <TableHead 
                    key={header.id} 
                    colSpan={header.colSpan}
                    className={alignClass}
                    style={{ 
                      width: hasCustomSize ? size : undefined,
                      minWidth: columnDef.minSize,
                      maxWidth: columnDef.maxSize,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  row.getIsSelected() && 'bg-muted/50'
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const columnDef = cell.column.columnDef;
                  const size = cell.column.getSize();
                  const hasCustomSize = size !== 150;
                  const meta = columnDef.meta as DataTableColumnMeta | undefined;
                  const alignClass = getAlignmentClass(meta);
                  
                  return (
                    <TableCell 
                      key={cell.id}
                      className={alignClass}
                      style={{ 
                        width: hasCustomSize ? size : undefined,
                        minWidth: columnDef.minSize,
                        maxWidth: columnDef.maxSize,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-48"
              >
                <div className="flex items-center justify-center h-full">
                  {emptyMessage}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
