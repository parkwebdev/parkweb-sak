/**
 * LandingPagesTable Component
 * 
 * Table displaying landing page analytics with visitor counts.
 * Sortable columns for page URL, visits, and bounce rate.
 * @module components/analytics/LandingPagesTable
 */

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableToolbar, DataTablePagination } from '@/components/data-table';
import { landingPagesColumns, type LandingPageData } from '@/components/data-table/columns/landing-pages-columns';
import { SkeletonTableSection } from '@/components/ui/skeleton';

interface LandingPagesTableProps {
  data: LandingPageData[];
  loading?: boolean;
}

export const LandingPagesTable = React.memo(function LandingPagesTable({ data, loading }: LandingPagesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'visits', desc: true },
  ]);

  const table = useReactTable({
    data,
    columns: landingPagesColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Landing Pages</CardTitle>
          <p className="text-sm text-muted-foreground">Pages where visitors start their journey</p>
        </CardHeader>
        <CardContent>
          <SkeletonTableSection rows={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Top Landing Pages</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Pages where visitors start their journey</p>
          </div>
          <div className="w-64">
            <DataTableToolbar
              table={table}
              searchPlaceholder="Search pages..."
              searchColumn="url"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No landing page data available</span>
          </div>
        ) : (
          <>
            <DataTable
              table={table}
              columns={landingPagesColumns}
              emptyMessage="No landing page data available"
            />
            <DataTablePagination 
              table={table} 
              pageSizeOptions={[10, 25, 50]}
              showRowsPerPage={true}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
});
