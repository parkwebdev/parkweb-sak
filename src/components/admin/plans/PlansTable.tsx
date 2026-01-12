/**
 * PlansTable Component
 * 
 * Table displaying subscription plans with management actions.
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
import { Edit02, Trash01, Plus, Check, X } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
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
}

const columnHelper = createColumnHelper<AdminPlan>();

/**
 * Plans table with full CRUD functionality.
 */
export function PlansTable({
  plans,
  loading,
  onUpdate,
  onCreate,
  onDelete,
  isUpdating,
  isCreating,
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
          return (
            <div className="text-xs text-muted-foreground space-x-2">
              {limits.agents !== undefined && <span>{limits.agents} agents</span>}
              {limits.conversations_per_month !== undefined && (
                <span>• {limits.conversations_per_month} convos/mo</span>
              )}
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
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <IconButton
              label="Edit plan"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row.original);
              }}
            >
              <Edit02 size={14} />
            </IconButton>
            <IconButton
              label="Delete plan"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(row.original.id);
              }}
            >
              <Trash01 size={14} className="text-destructive" />
            </IconButton>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: plans,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Subscription Plans</h3>
          <p className="text-xs text-muted-foreground">
            {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
          New Plan
        </Button>
      </div>

      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No plans found"
      />

      {/* Edit/Create Plan Sheet */}
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

      {/* Delete Confirmation */}
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
    </div>
  );
}

/**
 * Plan limits editor component.
 */
export function PlanLimitsEditor({
  limits,
  onChange,
}: {
  limits: PlanLimits;
  onChange: (limits: PlanLimits) => void;
}) {
  const limitFields = [
    { key: 'agents', label: 'Max Agents' },
    { key: 'conversations_per_month', label: 'Conversations/Month' },
    { key: 'knowledge_sources', label: 'Knowledge Sources' },
    { key: 'team_members', label: 'Team Members' },
    { key: 'api_requests_per_day', label: 'API Requests/Day' },
  ];

  return (
    <div className="space-y-3">
      <Label>Limits</Label>
      <div className="grid grid-cols-2 gap-3">
        {limitFields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
              type="number"
              min={0}
              placeholder="Unlimited"
              value={limits[key] ?? ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                onChange({ ...limits, [key]: value });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Plan features editor component.
 */
export function PlanFeaturesEditor({
  features,
  onChange,
}: {
  features: PlanFeatures;
  onChange: (features: PlanFeatures) => void;
}) {
  const [newFeature, setNewFeature] = useState('');

  const featureList = Object.keys(features);

  const handleAdd = () => {
    if (newFeature && !features[newFeature]) {
      onChange({ ...features, [newFeature]: true });
      setNewFeature('');
    }
  };

  const handleToggle = (key: string) => {
    onChange({ ...features, [key]: !features[key] });
  };

  const handleRemove = (key: string) => {
    const updated = { ...features };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>Features</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Feature name"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <IconButton label="Add feature" size="sm" variant="outline" onClick={handleAdd}>
          <Plus size={14} />
        </IconButton>
      </div>
      <div className="space-y-2">
        {featureList.map((key) => (
          <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/50">
            <div className="flex items-center gap-2">
              {features[key] ? (
                <Check size={14} className="text-status-active" aria-hidden="true" />
              ) : (
                <X size={14} className="text-muted-foreground" aria-hidden="true" />
              )}
              <span className="text-sm">{key}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={features[key]}
                onCheckedChange={() => handleToggle(key)}
              />
              <IconButton
                label="Remove feature"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(key)}
              >
                <Trash01 size={12} className="text-destructive" />
              </IconButton>
            </div>
          </div>
        ))}
        {featureList.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No features added</p>
        )}
      </div>
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

  return (
    <div className="rounded-lg border border-border divide-y divide-border">
      {subscriptions.map((sub) => (
        <div key={sub.id} className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{sub.user_email}</p>
            <p className="text-xs text-muted-foreground">{sub.plan_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
              {sub.status}
            </Badge>
            <span className="font-mono text-sm">{formatAdminCurrency(sub.mrr)}/mo</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Revenue metrics cards component.
 */
export function RevenueMetricsCards({
  mrr = 0,
  arr = 0,
  churnRate = 0,
  activeSubscriptions = 0,
  loading,
}: {
  mrr?: number;
  arr?: number;
  churnRate?: number;
  activeSubscriptions?: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatAdminCurrency(mrr)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatAdminCurrency(arr)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{churnRate.toFixed(1)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Subs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{activeSubscriptions}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Stripe sync controls component.
 */
export function StripeSync() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Stripe Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Sync plans and subscriptions with Stripe
        </p>
        <Button variant="outline" size="sm" disabled>
          Sync Now
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Plan editor sheet (alias for backward compatibility).
 */
export function PlanEditorSheet() {
  return null;
}
