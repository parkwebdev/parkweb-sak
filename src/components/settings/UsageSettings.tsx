/**
 * @fileoverview Usage settings page displaying plan usage and features.
 * Clean section-based layout without card wrappers.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useCanManage } from '@/hooks/useCanManage';
import { useNavigate } from 'react-router-dom';
import { UsageMetricsGrid } from './UsageMetricsGrid';
import { FeaturesGrid } from './FeaturesGrid';

export const UsageSettings = () => {
  const { limits, usage, features, loading, planName, hasActiveSubscription } = usePlanLimits();
  const navigate = useNavigate();
  const canViewBilling = useCanManage('view_billing');

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <UsageMetricsGrid usage={null} limits={null} loading />
        <Separator />
        <FeaturesGrid features={null} loading />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">No active subscription</p>
        {canViewBilling && (
          <Button onClick={() => navigate('/settings?tab=billing')}>
            Subscribe Now
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Plan Usage</h2>
          <Badge variant="secondary">{planName}</Badge>
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
      </div>

      {/* Usage Metrics */}
      <UsageMetricsGrid usage={usage} limits={limits} />

      {/* Features Section */}
      {features && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Plan Features</h3>
            <FeaturesGrid features={features} />
          </div>
        </>
      )}
    </div>
  );
};
