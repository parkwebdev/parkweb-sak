/**
 * @fileoverview Data table toolbar with search input.
 * Supports column-specific filtering or global search with clear button.
 */

import React from 'react';
import { Table } from '@tanstack/react-table';
import { SearchMd, XClose } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  globalFilter?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  searchColumn,
  globalFilter = false,
  children,
  className,
}: DataTableToolbarProps<TData>) {
  const isFiltered = globalFilter
    ? table.getState().globalFilter
    : searchColumn
    ? table.getColumn(searchColumn)?.getFilterValue()
    : false;

  const handleSearchChange = (value: string) => {
    if (globalFilter) {
      table.setGlobalFilter(value);
    } else if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value);
    }
  };

  const handleClear = () => {
    if (globalFilter) {
      table.setGlobalFilter('');
    } else if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue('');
    }
  };

  const searchValue = globalFilter
    ? (table.getState().globalFilter as string) ?? ''
    : searchColumn
    ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
    : '';

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-sm">
          <SearchMd className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
            size="sm"
          />
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              onClick={handleClear}
            >
              <XClose className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
