/**
 * PlansTable Component
 * 
 * Table displaying subscription plans with management actions.
 * Only super admins can edit/delete plans.
 * 
 * @module components/admin/plans/PlansTable
 */

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanActions } from './PlanActions';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import type { AdminPlan, PlanLimits } from '@/types/admin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PlansTableProps {
  plans: AdminPlan[];
  loading: boolean;
  onEdit?: (plan: AdminPlan) => void;
  onDelete: (id: string) => Promise<void>;
  /** Whether the current user can manage (edit/delete) plans - super admin only */
  canManage?: boolean;
}

const columnHelper = createColumnHelper<AdminPlan>();

/**
 * Plans table with display and action callbacks.
 * Edit/delete actions only shown to super admins.
 */
export function PlansTable({
  plans,
  loading,
  onEdit,
  onDelete,
  canManage = false,
}: PlansTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const columns = useMemo<ColumnDef<AdminPlan, unknown>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Plan',
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{getValue()}</span>
            {!row.original.active && (
              <Badge variant="secondary" className="text-2xs">Inactive</Badge>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('price_monthly', {
        header: 'Monthly',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {formatAdminCurrency(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('price_yearly', {
        header: 'Yearly',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {formatAdminCurrency(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('limits', {
        header: 'Limits',
        cell: ({ getValue }) => {
          const limits = getValue() as PlanLimits;
          
          // Helper to format limit value - null/undefined means unlimited
          const formatLimit = (value: number | null | undefined, label: string) => {
            if (value === null || value === undefined) {
              return `∞ ${label}`;
            }
            return `${value} ${label}`;
          };
          
          const limitParts = [
            formatLimit(limits.max_conversations_per_month, 'convos/mo'),
            formatLimit(limits.max_team_members, 'team'),
            formatLimit(limits.max_knowledge_sources, 'sources'),
          ];
          
          return (
            <div className="text-xs text-muted-foreground">
              {limitParts.join(' • ')}
            </div>
          );
        },
      }),
      columnHelper.accessor('subscriber_count', {
        header: 'Subscribers',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() || 0}</span>
        ),
      }),
      // Only show actions column if user can manage
      ...(canManage ? [
        columnHelper.display({
          id: 'actions',
          header: '',
          size: 50,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <PlanActions
                onEdit={() => onEdit?.(row.original)}
                onDelete={() => setDeleteConfirmId(row.original.id)}
              />
            </div>
          ),
        }),
      ] : []),
    ],
    [canManage, onEdit]
  );

  const table = useReactTable({
    data: plans,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No plans found"
        onRowClick={canManage ? (row) => onEdit?.(row) : undefined}
      />

      {/* Delete Confirmation - only for super admins */}
      {canManage && (
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this plan? Existing subscribers will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

/**
 * Subscriptions table component.
 */
export function SubscriptionsTable({
  subscriptions,
  loading,
}: {
  subscriptions: Array<{
    id: string;
    user_email: string;
    plan_name: string;
    status: string;
    mrr: number;
    created_at: string;
  }>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!subscriptions.length) {
    return (
      <div className="rounded-card border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No subscriptions found</p>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-2xs">
      {status}
    </Badge>
  );

  return (
    <div className="rounded-card border border-border divide-y divide-border">
      {subscriptions.map((sub) => (
        <div key={sub.id} className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{sub.user_email}</p>
            <p className="text-xs text-muted-foreground">{sub.plan_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={sub.status} />
            <span className="font-mono text-sm">{formatAdminCurrency(sub.mrr)}/mo</span>
          </div>
        </div>
      ))}
    </div>
  );
}