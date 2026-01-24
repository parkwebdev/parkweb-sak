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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Check, X, Trash01 } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import { PlanActions } from './PlanActions';
import { PlanLimitsEditor } from './PlanLimitsEditor';
import { PlanFeaturesEditor } from './PlanFeaturesEditor';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import type { AdminPlan, PlanLimits, PlanFeatures } from '@/types/admin';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  onUpdate: (id: string, updates: Partial<AdminPlan>) => Promise<void>;
  onCreate: (plan: Omit<AdminPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isCreating?: boolean;
  /** Whether the current user can manage (edit/delete) plans - super admin only */
  canManage?: boolean;
}

const columnHelper = createColumnHelper<AdminPlan>();

/**
 * Plans table with full CRUD functionality.
 * Edit/delete actions only shown to super admins.
 */
export function PlansTable({
  plans,
  loading,
  onUpdate,
  onCreate,
  onDelete,
  isUpdating,
  isCreating,
  canManage = false,
}: PlansTableProps) {
  const [editPlan, setEditPlan] = useState<AdminPlan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AdminPlan>>({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    active: true,
    features: {},
    limits: {},
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price_monthly: 0,
      price_yearly: 0,
      active: true,
      features: {},
      limits: {},
    });
  };

  const handleEdit = (plan: AdminPlan) => {
    if (!canManage) return;
    setFormData({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      active: plan.active,
      features: plan.features,
      limits: plan.limits,
    });
    setEditPlan(plan);
  };

  const handleSave = async () => {
    if (editPlan) {
      await onUpdate(editPlan.id, formData);
      setEditPlan(null);
    } else {
      await onCreate(formData as Omit<AdminPlan, 'id' | 'created_at' | 'updated_at'>);
      setCreateOpen(false);
    }
    resetForm();
  };

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
          const limitParts: string[] = [];
          if (limits.max_conversations_per_month !== undefined) {
            limitParts.push(`${limits.max_conversations_per_month} convos/mo`);
          }
          if (limits.max_team_members !== undefined) {
            limitParts.push(`${limits.max_team_members} team`);
          }
          if (limits.max_knowledge_sources !== undefined) {
            limitParts.push(`${limits.max_knowledge_sources} sources`);
          }
          return (
            <div className="text-xs text-muted-foreground">
              {limitParts.length > 0 ? limitParts.join(' • ') : 'No limits set'}
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
                onEdit={() => handleEdit(row.original)}
                onDelete={() => setDeleteConfirmId(row.original.id)}
              />
            </div>
          ),
        }),
      ] : []),
    ],
    [canManage]
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
        onRowClick={canManage ? (row) => handleEdit(row) : undefined}
      />

      {/* Edit/Create Plan Sheet - only for super admins */}
      {canManage && (
        <Sheet open={!!editPlan || createOpen} onOpenChange={() => { setEditPlan(null); setCreateOpen(false); resetForm(); }}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editPlan ? 'Edit Plan' : 'Create Plan'}</SheetTitle>
              <SheetDescription>
                {editPlan ? 'Update plan details and pricing' : 'Create a new subscription plan'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g., Starter, Pro, Enterprise"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-monthly">Monthly Price ($)</Label>
                  <Input
                    id="price-monthly"
                    type="number"
                    min={0}
                    value={formData.price_monthly || 0}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-yearly">Yearly Price ($)</Label>
                  <Input
                    id="price-yearly"
                    type="number"
                    min={0}
                    value={formData.price_yearly || 0}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Make plan available for purchase</p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <PlanLimitsEditor
                limits={formData.limits || {}}
                onChange={(limits) => setFormData({ ...formData, limits })}
              />

              <PlanFeaturesEditor
                features={formData.features || {}}
                onChange={(features) => setFormData({ ...formData, features })}
              />
            </div>

            <SheetFooter>
              <Button variant="outline" onClick={() => { setEditPlan(null); setCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating || isCreating || !formData.name}>
                {isUpdating || isCreating ? 'Saving...' : 'Save Plan'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No subscriptions found</p>
      </div>
    );
  }

  // Import StatusBadge dynamically to avoid circular deps
  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-2xs">
      {status}
    </Badge>
  );

  return (
    <div className="rounded-lg border border-border divide-y divide-border">
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