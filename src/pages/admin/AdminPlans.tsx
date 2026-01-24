/**
 * Admin Plans Page
 * 
 * Manage subscription plans and Stripe integration.
 * View and edit plan features, limits, and pricing.
 * Only super admins can create/edit/delete plans.
 * 
 * @module pages/admin/AdminPlans
 */

import { useState, useMemo, useCallback } from 'react';
import { CreditCard01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { 
  PlansTable, 
  PlanEditorSheet, 
  SubscriptionsTable,
  StripeSync,
  PlansTabDropdown,
} from '@/components/admin/plans';
import type { PlansTab } from '@/components/admin/plans/PlansTabDropdown';
import { AdminPermissionGuard } from '@/components/admin/AdminPermissionGuard';
import { useAdminPlans, useAdminSubscriptions } from '@/hooks/admin';
import { useAdminRole } from '@/contexts/AdminRoleContext';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import type { AdminPlan } from '@/types/admin';

/**
 * Plans and billing management page for Super Admin.
 */
export function AdminPlans() {
  const [activeTab, setActiveTab] = useState<PlansTab>('plans');
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Only super admins can manage plans
  const { isSuperAdmin } = useAdminRole();

  const handleCreatePlan = useCallback(() => {
    setEditingPlan(null);
    setEditorOpen(true);
  }, []);

  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={CreditCard01} title="Plans & Billing" />,
    right: (
      <div className="flex items-center gap-2">
        <PlansTabDropdown 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        {activeTab === 'plans' && isSuperAdmin && (
          <Button size="sm" onClick={handleCreatePlan}>
            New Plan
          </Button>
        )}
      </div>
    ),
  }), [handleCreatePlan, activeTab, isSuperAdmin]);
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

  const { subscriptions, loading: subscriptionsLoading } = useAdminSubscriptions();

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
        {/* Tab Content - rendered conditionally based on activeTab */}
        {activeTab === 'plans' && (
          <PlansTable
            plans={plans}
            loading={plansLoading}
            onUpdate={async (id, updates) => { await updatePlan(id, updates); }}
            onCreate={async (plan) => { await createPlan(plan); }}
            onDelete={deletePlan}
            isUpdating={isUpdating}
            isCreating={isCreating}
            canManage={isSuperAdmin}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsTable
            subscriptions={subscriptions}
            loading={subscriptionsLoading}
          />
        )}

        {activeTab === 'stripe' && (
          <StripeSync />
        )}

        {/* Plan Editor Sheet - only super admins can save */}
        {isSuperAdmin && (
          <PlanEditorSheet
            open={editorOpen}
            onOpenChange={setEditorOpen}
            plan={editingPlan}
            onSave={handleSavePlan}
            saving={isCreating || isUpdating}
          />
        )}
      </div>
    </AdminPermissionGuard>
  );
}