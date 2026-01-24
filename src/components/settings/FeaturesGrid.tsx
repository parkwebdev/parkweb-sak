/**
 * @fileoverview Features grid displaying plan features in a row-based list.
 * Shows enabled/disabled features with check/x icons, inline descriptions, and category badges.
 */

import { Check, X } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PLAN_FEATURES } from '@/lib/plan-config';
import type { PlanFeatures } from '@/hooks/usePlanLimits';

interface FeaturesGridProps {
  features: PlanFeatures | null;
  loading?: boolean;
}

interface FeatureItem {
  key: string;
  label: string;
  description: string;
  category: string;
  helpCenterPath?: string;
}

// Help Center paths for each feature
const FEATURE_HELP_PATHS: Record<string, string> = {
  widget: '/help-center?category=ari&article=installation',
  webhooks: '/help-center?category=ari&article=webhooks',
  custom_tools: '/help-center?category=ari&article=custom-tools',
  integrations: '/help-center?category=ari&article=integrations',
  knowledge_sources: '/help-center?category=ari&article=knowledge-sources',
  locations: '/help-center?category=ari&article=locations',
  calendar_booking: '/help-center?category=planner&article=overview',
  advanced_analytics: '/help-center?category=analytics&article=overview',
  report_builder: '/help-center?category=analytics&article=report-builder',
  scheduled_reports: '/help-center?category=analytics&article=report-builder',
};

// Flatten PLAN_FEATURES into a single list with help paths
const ALL_FEATURES: FeatureItem[] = PLAN_FEATURES.map(feature => ({
  key: feature.key,
  label: feature.label,
  description: feature.description,
  category: feature.category,
  helpCenterPath: FEATURE_HELP_PATHS[feature.key],
}));

function FeatureRow({ feature, enabled }: { feature: FeatureItem; enabled: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {enabled ? (
        <Check size={16} className="text-status-active shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <X size={16} className="text-muted-foreground/50 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-sm font-medium",
            enabled ? "text-foreground" : "text-muted-foreground/70"
          )}>
            {feature.label}
          </span>
          <Badge variant="outline" className="text-2xs shrink-0">
            {feature.category}
          </Badge>
        </div>
        <p className={cn(
          "text-xs mt-0.5",
          enabled ? "text-muted-foreground" : "text-muted-foreground/50"
        )}>
          {feature.description}
        </p>
        {enabled && feature.helpCenterPath && (
          <Link 
            to={feature.helpCenterPath}
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            Learn more →
          </Link>
        )}
      </div>
    </div>
  );
}

function FeatureRowSkeleton() {
  return (
    <div className="py-3 space-y-1">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-full max-w-md" />
    </div>
  );
}

export function FeaturesGrid({ features, loading }: FeaturesGridProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <FeatureRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!features) return null;

  return (
    <div className="divide-y divide-border">
      {ALL_FEATURES.map((feature) => (
        <FeatureRow
          key={feature.key}
          feature={feature}
          enabled={features[feature.key as keyof PlanFeatures] === true}
        />
      ))}
    </div>
  );
}
