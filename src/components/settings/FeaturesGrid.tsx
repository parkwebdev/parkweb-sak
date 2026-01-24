/**
 * @fileoverview Features grid displaying plan features by category.
 * Shows enabled/disabled features with check/x icons in a compact grid.
 */

import { Check, X, HelpCircle } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import type { PlanFeatures } from '@/hooks/usePlanLimits';

interface FeaturesGridProps {
  features: PlanFeatures | null;
  loading?: boolean;
}

interface FeatureItem {
  key: keyof PlanFeatures;
  label: string;
  description: string;
  helpCenterPath?: string;
}

interface CategoryConfig {
  name: string;
  features: FeatureItem[];
}

const FEATURE_CATEGORIES: CategoryConfig[] = [
  {
    name: 'Core',
    features: [
      { 
        key: 'widget', 
        label: 'Chat Widget',
        description: 'Embeddable chat interface for your website that connects visitors to your AI agent.',
        helpCenterPath: '/help-center/getting-started/widget-installation',
      },
      { 
        key: 'webhooks', 
        label: 'Webhooks',
        description: 'Send real-time notifications to external services when events occur.',
        helpCenterPath: '/help-center/integrations/webhooks',
      },
    ],
  },
  {
    name: 'Tools',
    features: [
      { 
        key: 'custom_tools', 
        label: 'Custom Tools',
        description: 'Extend your agent with custom API integrations and actions.',
        helpCenterPath: '/help-center/agent-configuration/custom-tools',
      },
      { 
        key: 'integrations', 
        label: 'Integrations',
        description: 'Connect to third-party services like CRMs, calendars, and more.',
        helpCenterPath: '/help-center/integrations/overview',
      },
    ],
  },
  {
    name: 'Knowledge',
    features: [
      { 
        key: 'knowledge_sources', 
        label: 'Knowledge Sources',
        description: 'Train your agent with documents, websites, and custom content.',
        helpCenterPath: '/help-center/getting-started/knowledge-sources',
      },
      { 
        key: 'locations', 
        label: 'Locations',
        description: 'Manage multiple business locations with unique settings and hours.',
        helpCenterPath: '/help-center/agent-configuration/locations',
      },
      { 
        key: 'calendar_booking', 
        label: 'Calendar Booking',
        description: 'Let visitors book appointments directly through your agent.',
        helpCenterPath: '/help-center/integrations/calendar-booking',
      },
    ],
  },
  {
    name: 'Analytics',
    features: [
      { 
        key: 'advanced_analytics', 
        label: 'Advanced Analytics',
        description: 'Deep insights into conversation patterns, user behavior, and agent performance.',
        helpCenterPath: '/help-center/analytics/overview',
      },
      { 
        key: 'report_builder', 
        label: 'Report Builder',
        description: 'Create custom reports with the metrics that matter to your business.',
        helpCenterPath: '/help-center/analytics/report-builder',
      },
      { 
        key: 'scheduled_reports', 
        label: 'Scheduled Reports',
        description: 'Automatically send reports to your team on a recurring schedule.',
        helpCenterPath: '/help-center/analytics/scheduled-reports',
      },
    ],
  },
];

function FeatureRow({ feature, enabled }: { feature: FeatureItem; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {enabled ? (
        <Check size={16} className="text-status-active shrink-0" aria-hidden="true" />
      ) : (
        <X size={16} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
      )}
      <span className={enabled ? 'text-foreground text-sm' : 'text-muted-foreground/70 text-sm'}>
        {feature.label}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            aria-label={`Learn more about ${feature.label}`}
          >
            <HelpCircle size={12} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{feature.description}</p>
          {feature.helpCenterPath && (
            <Link 
              to={feature.helpCenterPath}
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Learn more →
            </Link>
          )}
        </TooltipContent>
      </Tooltip>
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
              feature={feature}
              enabled={features[feature.key] === true}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
