/**
 * @fileoverview Sortable column header component for data tables.
 * Shows sort direction indicators and handles sort toggle.
 */

import React from 'react';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ChevronSelectorVertical,
  ArrowUp,
  ArrowDown,
} from '@untitledui/icons';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 data-[state=open]:bg-accent', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
      aria-label={`Sort by ${title}`}
    >
      <span>{title}</span>
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
      ) : (
        <ChevronSelectorVertical className="ml-2 h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
