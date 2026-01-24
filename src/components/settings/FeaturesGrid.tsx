/**
 * @fileoverview Features grid displaying plan features in a row-based list.
 * Shows enabled/disabled features with check/x icons, inline descriptions, and category badges.
 */

import { X } from '@untitledui/icons';
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
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-status-active shrink-0 mt-0.5" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.0315 12C2.0312 11.8662 2.00492 11.7325 1.95265 11.6065L1.23121 9.85975C1.07879 9.49188 1.00006 9.09699 1 8.69879C0.999936 8.30038 1.07838 7.90585 1.23084 7.53776C1.3833 7.16967 1.6068 6.83523 1.88856 6.55355C2.17025 6.27194 2.50465 6.04858 2.87267 5.89623L4.6166 5.17384C4.86916 5.06941 5.0706 4.86887 5.17575 4.61659L5.8983 2.87214C6.20608 2.12905 6.79645 1.53866 7.53953 1.23085C8.28261 0.923049 9.11753 0.923048 9.86061 1.23085L11.6037 1.9529C11.8567 2.05733 12.141 2.0572 12.3938 1.95231L12.3958 1.95149L14.1404 1.23192C14.8832 0.924529 15.7183 0.924429 16.4611 1.23209C17.204 1.53984 17.7943 2.13006 18.1021 2.87295L18.8073 4.57552C18.8136 4.58896 18.8196 4.60259 18.8253 4.61641C18.9298 4.86924 19.1304 5.07024 19.383 5.1753L21.1279 5.8981C21.871 6.20591 22.4614 6.7963 22.7692 7.53939C23.0769 8.28247 23.0769 9.11739 22.7692 9.86048L22.0468 11.6045C21.9943 11.7311 21.9681 11.8661 21.9681 12.0003C21.9681 12.1345 21.9943 12.2689 22.0468 12.3955L22.7692 14.1395C23.0769 14.8826 23.0769 15.7175 22.7692 16.4606C22.4614 17.2037 21.871 17.7941 21.1279 18.1019L19.383 18.8247C19.1304 18.9298 18.9298 19.1308 18.8253 19.3836C18.8196 19.3974 18.8136 19.411 18.8073 19.4245L18.1021 21.127C17.7943 21.8699 17.204 22.4602 16.4611 22.7679C15.7183 23.0756 14.8832 23.0755 14.1404 22.7681L12.3958 22.0485L12.3938 22.0477C12.141 21.9428 11.8567 21.9427 11.6037 22.0471L9.86061 22.7691C9.11753 23.077 8.28261 23.077 7.53953 22.7691C6.79645 22.4613 6.20608 21.8709 5.8983 21.1279L5.17575 19.3834C5.0706 19.1311 4.86916 18.9306 4.6166 18.8262L2.87267 18.1038C2.50465 17.9514 2.17025 17.7281 1.88856 17.4465C1.6068 17.1648 1.3833 16.8303 1.23084 16.4622C1.07838 16.0941 0.999936 15.6996 1 15.3012C1.00006 14.903 1.07879 14.5081 1.23121 14.1402L1.95265 12.3935C2.00492 12.2675 2.0312 12.1338 2.0315 12ZM16.2071 10.2071C16.5976 9.81658 16.5976 9.18342 16.2071 8.79289C15.8166 8.40237 15.1834 8.40237 14.7929 8.79289L11 12.5858L9.70711 11.2929C9.31658 10.9024 8.68342 10.9024 8.29289 11.2929C7.90237 11.6834 7.90237 12.3166 8.29289 12.7071L10.2929 14.7071C10.6834 15.0976 11.3166 15.0976 11.7071 14.7071L16.2071 10.2071Z"
            fill="currentColor"
          />
        </svg>
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
