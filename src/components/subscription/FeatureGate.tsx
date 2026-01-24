/**
 * @fileoverview Feature gate wrapper that checks subscription features.
 * Renders children if feature is enabled, otherwise shows upgrade prompt.
 */

import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradePrompt } from './UpgradePrompt';
import { Skeleton } from '@/components/ui/skeleton';

type FeatureType = 
  | 'widget' | 'webhooks'
  | 'custom_tools' | 'integrations'
  | 'knowledge_sources' | 'locations' | 'calendar_booking'
  | 'advanced_analytics' | 'report_builder' | 'scheduled_reports';

interface FeatureGateProps {
  feature: FeatureType;
  children: React.ReactNode;
  /** Custom loading skeleton - defaults to card skeleton */
  loadingSkeleton?: React.ReactNode;
}

export function FeatureGate({ feature, children, loadingSkeleton }: FeatureGateProps) {
  const { loading, hasActiveSubscription, hasFeature } = usePlanLimits();

  // Show loading state while checking subscription
  if (loading) {
    return loadingSkeleton || (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // No subscription or feature not enabled - show upgrade prompt
  if (!hasActiveSubscription || !hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }

  // Feature is enabled - render children
  return <>{children}</>;
}
