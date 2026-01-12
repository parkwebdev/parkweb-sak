/**
 * PlanEditorSheet Component
 * 
 * Sheet for creating and editing subscription plans.
 * 
 * @module components/admin/plans/PlanEditorSheet
 */

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlanLimitsEditor } from './PlanLimitsEditor';
import { PlanFeaturesEditor } from './PlanFeaturesEditor';
import type { AdminPlan, PlanFeatures, PlanLimits } from '@/types/admin';

interface PlanEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
  onSave: (plan: Partial<AdminPlan>) => void;
  saving?: boolean;
}

const defaultLimits: PlanLimits = {
  agents: 1,
  conversations_per_month: 100,
  knowledge_sources: 5,
  team_members: 1,
  locations: 1,
  api_calls_per_day: 1000,
};

const defaultFeatures: PlanFeatures = {
  advanced_analytics: false,
  custom_branding: false,
  api_access: false,
  priority_support: false,
  sla: false,
  sso: false,
  audit_logs: false,
  custom_integrations: false,
};

/**
 * Sheet component for editing plan details.
 */
export function PlanEditorSheet({
  open,
  onOpenChange,
  plan,
  onSave,
  saving,
}: PlanEditorSheetProps) {
  const [formData, setFormData] = useState<Partial<AdminPlan>>({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    active: true,
    limits: defaultLimits,
    features: defaultFeatures,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        active: plan.active,
        limits: plan.limits || defaultLimits,
        features: plan.features || defaultFeatures,
      });
    } else {
      setFormData({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        active: true,
        limits: defaultLimits,
        features: defaultFeatures,
      });
    }
  }, [plan]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const isEditing = !!plan;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Plan' : 'Create Plan'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the plan details and limits'
              : 'Create a new subscription plan'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Pro, Enterprise"
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_monthly: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-yearly">Yearly Price ($)</Label>
                <Input
                  id="price-yearly"
                  type="number"
                  min={0}
                  value={formData.price_yearly || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_yearly: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Make this plan available for purchase
                </p>
              </div>
              <Switch
                checked={formData.active ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
            </div>
          </div>

          {/* Limits */}
          <PlanLimitsEditor
            limits={formData.limits || defaultLimits}
            onChange={(limits) => setFormData({ ...formData, limits })}
          />

          {/* Features */}
          <PlanFeaturesEditor
            features={formData.features || defaultFeatures}
            onChange={(features) => setFormData({ ...formData, features })}
          />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name || saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Plan'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
