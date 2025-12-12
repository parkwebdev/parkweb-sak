/**
 * @fileoverview Reusable data table component built on TanStack Table.
 * Features animated rows, loading states, and empty state messages.
 */

import React from 'react';
import {
  ColumnDef,
  flexRender,
  Table as TanStackTable,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'motion/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { staggerContainerVariants, fadeReducedVariants, getVariants } from '@/lib/motion-variants';

interface DataTableProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  table,
  columns,
  onRowClick,
  emptyMessage = 'No results found.',
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = getVariants(
    staggerContainerVariants,
    fadeReducedVariants,
    prefersReducedMotion
  );

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
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
        <motion.tbody
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="[&_tr:last-child]:border-0"
        >
          <AnimatePresence mode="popLayout">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <AnimatedTableRow
                  key={row.id}
                  index={index}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    row.getIsSelected() && 'bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </AnimatedTableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </motion.tbody>
      </Table>
    </div>
  );
}
