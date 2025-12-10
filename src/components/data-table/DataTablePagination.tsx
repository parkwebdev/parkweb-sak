import React from 'react';
import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
} from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showRowsPerPage?: boolean;
  showSelectedCount?: boolean;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
  showRowsPerPage = true,
  showSelectedCount = false,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        {showSelectedCount && table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <span>
            {table.getFilteredSelectedRowModel().rows.length} of {totalRows} row(s)
            selected
          </span>
        ) : (
          <span>
            Showing {startRow} to {endRow} of {totalRows} results
          </span>
        )}
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        {showRowsPerPage && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="-ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronRight className="-mr-2 h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
