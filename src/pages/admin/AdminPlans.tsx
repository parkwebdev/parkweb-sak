/**
 * Admin Plans Page
 * 
 * Manage subscription plans and Stripe integration.
 * View and edit plan features, limits, and pricing.
 * 
 * @module pages/admin/AdminPlans
 */

import { useState, useMemo, useCallback } from 'react';
import { CreditCard01, Plus } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  PlansTable, 
  RevenueMetricsCards, 
  PlanEditorSheet, 
  SubscriptionsTable,
  StripeSync 
} from '@/components/admin/plans';
import { AdminPermissionGuard } from '@/components/admin/AdminPermissionGuard';
import { useAdminPlans, useAdminSubscriptions, useRevenueAnalytics } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import type { AdminPlan } from '@/types/admin';

/**
 * Plans and billing management page for Super Admin.
 */
export function AdminPlans() {
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleCreatePlan = useCallback(() => {
    setEditingPlan(null);
    setEditorOpen(true);
  }, []);

  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={CreditCard01} title="Plans & Billing" />,
    right: (
      <Button size="sm" onClick={handleCreatePlan}>
        <Plus size={16} className="mr-1.5" aria-hidden="true" />
        New Plan
      </Button>
    ),
  }), [handleCreatePlan]);
  useTopBar(topBarConfig);

  const { 
    plans, 
    loading: plansLoading, 
    createPlan, 
    updatePlan, 
    deletePlan,
    isCreating,
    isUpdating,
  } = useAdminPlans();

  const { subscriptions, activeSubscriptions, loading: subscriptionsLoading } = useAdminSubscriptions();
  const { mrr, data: revenueData, loading: revenueLoading } = useRevenueAnalytics();

  const handleEditPlan = useCallback((plan: AdminPlan) => {
    setEditingPlan(plan);
    setEditorOpen(true);
  }, []);

  const handleSavePlan = async (planData: Partial<AdminPlan>) => {
    if (editingPlan) {
      await updatePlan(editingPlan.id, planData);
    } else {
      await createPlan(planData as Omit<AdminPlan, 'id' | 'created_at' | 'updated_at'>);
    }
    setEditorOpen(false);
  };

  return (
    <AdminPermissionGuard permission="view_revenue">
      <div className="p-6 space-y-6">
        {/* Revenue Metrics - no header, TopBar handles page title */}
        <RevenueMetricsCards
          mrr={mrr}
          arr={revenueData?.arr || 0}
          churnRate={revenueData?.churnRate || 0}
          activeSubscriptions={activeSubscriptions}
          loading={revenueLoading}
        />

        {/* Tabs */}
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <PlansTable
              plans={plans}
              loading={plansLoading}
              onUpdate={async (id, updates) => { await updatePlan(id, updates); }}
              onCreate={async (plan) => { await createPlan(plan); }}
              onDelete={deletePlan}
              isUpdating={isUpdating}
              isCreating={isCreating}
            />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsTable
              subscriptions={subscriptions}
              loading={subscriptionsLoading}
            />
          </TabsContent>

          <TabsContent value="stripe">
            <StripeSync />
          </TabsContent>
        </Tabs>

        {/* Plan Editor Sheet */}
        <PlanEditorSheet
          open={editorOpen}
          onOpenChange={setEditorOpen}
          plan={editingPlan}
          onSave={handleSavePlan}
          saving={isCreating || isUpdating}
        />
      </div>
    </AdminPermissionGuard>
  );
}
