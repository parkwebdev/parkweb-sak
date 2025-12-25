/**
 * @fileoverview Floating action bar for bulk row operations.
 * Appears when rows are selected, providing batch action buttons.
 */

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { XClose } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface DataTableFloatingBarProps<TData> {
  table: Table<TData>;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableFloatingBar<TData>({
  table,
  children,
  className,
}: DataTableFloatingBarProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-6 z-50 mx-auto w-fit',
        className
      )}
    >
      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedCount} selected
        </span>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2">
          {children}
        </div>
        <Separator orientation="vertical" className="h-5" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          <XClose className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>
    </div>
  );
}
