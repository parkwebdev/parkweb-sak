/**
 * @fileoverview Usage settings page displaying plan usage and features.
 * Card-based layout with staggered animations matching other settings pages.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useCanManage } from '@/hooks/useCanManage';
import { useNavigate } from 'react-router-dom';
import { UsageMetricsGrid } from './UsageMetricsGrid';
import { FeaturesGrid } from './FeaturesGrid';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
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

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No active subscription</p>
          {canViewBilling && (
            <Button onClick={() => navigate('/settings?tab=billing')}>
              Subscribe Now
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatedList className="space-y-4" staggerSpeed="fast">
      {/* Plan Overview Card */}
      <AnimatedItem>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Plan Overview</CardTitle>
              <CardDescription className="text-sm">
                Current usage for your {planName} plan
              </CardDescription>
            </div>
            {canViewBilling && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/settings?tab=billing')}
              >
                Upgrade Plan
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <UsageMetricsGrid usage={usage} limits={limits} />
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Plan Features Card */}
      {features && (
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Plan Features</CardTitle>
              <CardDescription className="text-sm">
                Features included in your current plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturesGrid features={features} />
            </CardContent>
          </Card>
        </AnimatedItem>
      )}
    </AnimatedList>
  );
};
