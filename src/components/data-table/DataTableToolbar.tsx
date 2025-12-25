/**
 * @fileoverview Data table toolbar with search input and filter controls.
 * Supports column-specific filtering, global search, faceted filters, and view options.
 */

import React, { useState } from 'react';
import { Table } from '@tanstack/react-table';
import { SearchSm, XClose, Columns03 } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataTableColumnsSheet } from './DataTableColumnsSheet';

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
  /** Content rendered after the Columns button (e.g., view toggle) */
  endContent?: React.ReactNode;
  /** Controlled search value (when provided, search becomes controlled) */
  searchValue?: string;
  /** Callback when search value changes (required when searchValue is provided) */
  onSearchChange?: (value: string) => void;
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
  endContent,
  searchValue: controlledSearchValue,
  onSearchChange: controlledOnSearchChange,
}: DataTableToolbarProps<TData>) {
  // Determine if search is controlled externally
  const isControlled = controlledSearchValue !== undefined;
  const isFiltered = isControlled
    ? !!controlledSearchValue
    : globalFilter
    ? table.getState().globalFilter
    : searchColumn
    ? table.getColumn(searchColumn)?.getFilterValue()
    : false;

  // Check if any column filters are active
  const hasColumnFilters = table.getState().columnFilters.length > 0;

  const handleSearchChange = (value: string) => {
    if (isControlled) {
      controlledOnSearchChange?.(value);
    } else if (globalFilter) {
      table.setGlobalFilter(value);
    } else if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value);
    }
  };

  const handleClear = () => {
    if (isControlled) {
      controlledOnSearchChange?.('');
    } else if (globalFilter) {
      table.setGlobalFilter('');
    } else if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue('');
    }
  };

  const handleResetFilters = () => {
    table.resetColumnFilters();
    if (isControlled) {
      controlledOnSearchChange?.('');
    } else if (globalFilter) {
      table.setGlobalFilter('');
    }
  };

  const searchDisplayValue = isControlled
    ? controlledSearchValue
    : globalFilter
    ? (table.getState().globalFilter as string) ?? ''
    : searchColumn
    ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
    : '';

  const [columnsSheetOpen, setColumnsSheetOpen] = useState(false);

  return (
    <>
      <div className={cn('flex items-center justify-between gap-2', className)}>
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {prefix}
          <div className={cn('relative w-full max-w-sm', searchClassName)}>
            <SearchSm className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchDisplayValue}
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
          {showViewOptions && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => setColumnsSheetOpen(true)}
            >
              <Columns03 className="h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          )}
          {endContent}
        </div>
      </div>
      
      {showViewOptions && (
        <DataTableColumnsSheet
          open={columnsSheetOpen}
          onOpenChange={setColumnsSheetOpen}
          table={table}
        />
      )}
    </>
  );
}
