/**
 * @fileoverview Data table toolbar with search input and filter controls.
 * Supports column-specific filtering, global search, faceted filters, and view options.
 */

import React from 'react';
import { Table } from '@tanstack/react-table';
import { SearchSm, XClose } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataTableViewOptions } from './DataTableViewOptions';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  globalFilter?: boolean;
  children?: React.ReactNode;
  prefix?: React.ReactNode;
  className?: string;
  searchClassName?: string;
  /** Render faceted filter components */
  filterContent?: React.ReactNode;
  /** Show column visibility toggle */
  showViewOptions?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  searchColumn,
  globalFilter = false,
  children,
  prefix,
  className,
  searchClassName,
  filterContent,
  showViewOptions = false,
}: DataTableToolbarProps<TData>) {
  const isFiltered = globalFilter
    ? table.getState().globalFilter
    : searchColumn
    ? table.getColumn(searchColumn)?.getFilterValue()
    : false;

  // Check if any column filters are active
  const hasColumnFilters = table.getState().columnFilters.length > 0;

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

  const handleResetFilters = () => {
    table.resetColumnFilters();
    if (globalFilter) {
      table.setGlobalFilter('');
    }
  };

  const searchValue = globalFilter
    ? (table.getState().globalFilter as string) ?? ''
    : searchColumn
    ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
    : '';

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {prefix}
        <div className={cn('relative w-full max-w-sm', searchClassName)}>
          <SearchSm className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
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
        {filterContent}
        {hasColumnFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <XClose className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {showViewOptions && <DataTableViewOptions table={table} />}
      </div>
    </div>
  );
}
