/**
 * @fileoverview Usage settings page displaying plan usage and features.
 * Card-based layout with staggered animations matching other settings pages.
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useCanManage } from '@/hooks/useCanManage';
import { useNavigate } from 'react-router-dom';
import { UsageBarChart } from './UsageBarChart';
import { FeaturesGrid, FeatureCategoryDropdown } from './FeaturesGrid';
import type { FeatureCategory } from '@/lib/plan-config';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { useRegisterSettingsActions, SettingsSectionAction } from '@/contexts/SettingsSectionActionsContext';

// Skeleton for Plan Overview card (matches UsageBarChart layout)
const PlanOverviewSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-4 w-52 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-6 flex-1 rounded-md" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Skeleton for Plan Features card (matches FeaturesGrid layout)
const PlanFeaturesSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between space-y-0">
      <div className="space-y-1">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-8 w-32 rounded-md" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const UsageSettings = () => {
  const { limits, usage, features, loading, planName, hasActiveSubscription } = usePlanLimits();
  const navigate = useNavigate();
  const canViewBilling = useCanManage('view_billing');
  const [activeCategory, setActiveCategory] = useState<FeatureCategory | null>(null);

  // Register TopBar action
  const sectionActions = useMemo((): SettingsSectionAction[] => 
    canViewBilling ? [{
      id: 'upgrade-plan',
      label: 'Upgrade Plan',
      onClick: () => navigate('/settings?tab=billing'),
    }] : []
  , [canViewBilling, navigate]);

  useRegisterSettingsActions('usage', sectionActions);

  if (loading) {
    return (
      <div className="space-y-4">
        <PlanOverviewSkeleton />
        <PlanFeaturesSkeleton />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No active subscription</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatedList className="space-y-4" staggerSpeed="fast">
      {/* Plan Overview Card */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Plan Overview</CardTitle>
            <CardDescription className="text-sm">
              Current usage for your {planName} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageBarChart usage={usage} limits={limits} />
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Plan Features Card */}
      {features && (
        <AnimatedItem>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">Plan Features</CardTitle>
                <CardDescription className="text-sm">
                  Features included in your current plan
                </CardDescription>
              </div>
              <FeatureCategoryDropdown
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </CardHeader>
            <CardContent>
              <FeaturesGrid 
                features={features} 
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </CardContent>
          </Card>
        </AnimatedItem>
      )}
    </AnimatedList>
  );
};
