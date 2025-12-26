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
  SortingState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableToolbar } from '@/components/data-table';
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
    data: data.slice(0, 20), // Limit to 20 rows
    columns: landingPagesColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Popular Landing Pages</CardTitle>
          <p className="text-sm text-muted-foreground">Pages where visitors start their journey</p>
        </CardHeader>
        <CardContent>
          <SkeletonTableSection rows={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Popular Landing Pages</CardTitle>
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
          <div className="h-[300px] flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No landing page data available</span>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <DataTable
              table={table}
              columns={landingPagesColumns}
              emptyMessage="No landing page data available"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
