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
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, DataTableToolbar, DataTablePagination } from '@/components/data-table';
import { landingPagesColumns, type LandingPageData } from '@/components/data-table/columns/landing-pages-columns';
import { SkeletonTableSection } from '@/components/ui/skeleton';
import { ChartCardHeader } from './ChartCardHeader';

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

  // Calculate total visits for context summary
  const totalVisits = data.reduce((sum, page) => sum + page.visits, 0);
  const contextSummary = data.length > 0 
    ? `Showing ${totalVisits.toLocaleString()} visits across ${data.length} pages`
    : undefined;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Top Landing Pages"
          />
          <SkeletonTableSection rows={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Top Landing Pages"
          contextSummary={contextSummary}
          rightSlot={
            data.length > 0 ? (
              <div className="w-64">
                <DataTableToolbar
                  table={table}
                  searchPlaceholder="Search pages..."
                  searchColumn="url"
                />
              </div>
            ) : undefined
          }
        />
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
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
