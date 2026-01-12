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
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
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
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
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
            {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
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
    <DataTable
      table={table}
      columns={columns}
      isLoading={loading}
      emptyMessage="No subscriptions found"
    />
  );
}
