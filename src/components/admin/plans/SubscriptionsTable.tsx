/**
 * SubscriptionsTable Component
 * 
 * Data table for displaying all subscriptions across accounts.
 * 
 * @module components/admin/plans/SubscriptionsTable
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTablePagination } from '@/components/data-table/DataTablePagination';
import { DataTableResultsInfo } from '@/components/data-table/DataTableResultsInfo';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortTime } from '@/lib/time-formatting';
import type { AdminSubscription } from '@/types/admin';

interface SubscriptionsTableProps {
  subscriptions: AdminSubscription[];
  loading: boolean;
}

const columnHelper = createColumnHelper<AdminSubscription>();

/**
 * Table component for displaying all subscriptions.
 */
export function SubscriptionsTable({ subscriptions, loading }: SubscriptionsTableProps) {
  const columns = useMemo<ColumnDef<AdminSubscription, unknown>[]>(
    () => [
      columnHelper.accessor('user_email', {
        header: 'Account',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('plan_name', {
        header: 'Plan',
        cell: ({ getValue }) => (
          <Badge variant="outline">{getValue()}</Badge>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} type="subscription" />,
      }),
      columnHelper.accessor('mrr', {
        header: 'MRR',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">
            ${(getValue() / 100).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor('current_period_end', {
        header: 'Renews',
        cell: ({ getValue }) => {
          const date = getValue();
          return date ? (
            <span className="text-xs text-muted-foreground">
              {formatShortTime(new Date(date))}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Started',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatShortTime(new Date(getValue()))}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTableResultsInfo table={table} label="subscriptions" />
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No subscriptions found"
      />
      {subscriptions.length > 0 && <DataTablePagination table={table} showRowsPerPage />}
    </div>
  );
}
