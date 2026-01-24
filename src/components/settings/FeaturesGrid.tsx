/**
 * @fileoverview Features grid displaying plan features by category.
 * Shows enabled/disabled features with check/x icons in a compact grid.
 */

import { Check, X } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanFeatures } from '@/hooks/usePlanLimits';

interface FeaturesGridProps {
  features: PlanFeatures | null;
  loading?: boolean;
}

interface FeatureItem {
  key: keyof PlanFeatures;
  label: string;
}

interface CategoryConfig {
  name: string;
  features: FeatureItem[];
}

const FEATURE_CATEGORIES: CategoryConfig[] = [
  {
    name: 'Core',
    features: [
      { key: 'widget', label: 'Chat Widget' },
      { key: 'webhooks', label: 'Webhooks' },
    ],
  },
  {
    name: 'Tools',
    features: [
      { key: 'custom_tools', label: 'Custom Tools' },
      { key: 'integrations', label: 'Integrations' },
    ],
  },
  {
    name: 'Knowledge',
    features: [
      { key: 'knowledge_sources', label: 'Knowledge Sources' },
      { key: 'locations', label: 'Locations' },
      { key: 'calendar_booking', label: 'Calendar Booking' },
    ],
  },
  {
    name: 'Analytics',
    features: [
      { key: 'advanced_analytics', label: 'Advanced Analytics' },
      { key: 'report_builder', label: 'Report Builder' },
      { key: 'scheduled_reports', label: 'Scheduled Reports' },
    ],
  },
];

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {enabled ? (
        <Check size={16} className="text-status-active shrink-0" aria-hidden="true" />
      ) : (
        <X size={16} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
      )}
      <span className={enabled ? 'text-foreground text-sm' : 'text-muted-foreground/70 text-sm'}>
        {label}
      </span>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-32" />
    </div>
  );
}

export function FeaturesGrid({ features, loading }: FeaturesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <CategorySkeleton />
        <CategorySkeleton />
        <CategorySkeleton />
        <CategorySkeleton />
      </div>
    );
  }

  if (!features) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {FEATURE_CATEGORIES.map((category) => (
        <div key={category.name} className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {category.name}
          </h4>
          {category.features.map((feature) => (
            <FeatureRow
              key={feature.key}
              label={feature.label}
              enabled={features[feature.key] === true}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
