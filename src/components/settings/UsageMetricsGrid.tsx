/**
 * @fileoverview Usage metrics grid displaying resource usage with circular progress.
 * Shows conversations, knowledge sources, and team members in a responsive grid.
 */

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { HelpCircle } from '@untitledui/icons';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { PlanLimits, CurrentUsage } from '@/hooks/usePlanLimits';

interface UsageMetricsGridProps {
  usage: CurrentUsage | null;
  limits: PlanLimits | null;
  loading?: boolean;
}

interface MetricConfig {
  label: string;
  description: string;
  helpCenterPath?: string;
}

const METRIC_DESCRIPTIONS: Record<string, MetricConfig> = {
  conversations: {
    label: 'Conversations this month',
    description: 'Total chat conversations initiated with your AI agent this billing period. Resets monthly.',
    helpCenterPath: '/help-center/getting-started/conversations',
  },
  knowledge_sources: {
    label: 'Knowledge Sources',
    description: 'Documents, URLs, and files your agent uses to answer questions accurately.',
    helpCenterPath: '/help-center/getting-started/knowledge-sources',
  },
  team_members: {
    label: 'Team Members',
    description: 'Users with access to your account. Includes admins and team members.',
    helpCenterPath: '/help-center/getting-started/team-management',
  },
};

interface MetricBlockProps {
  metricKey: string;
  current: number;
  limit: number | null | undefined;
  delay?: number;
}

function MetricBlock({ metricKey, current, limit, delay = 0 }: MetricBlockProps) {
  const animatedValue = useAnimatedCounter(current, { duration: 800, delay });
  const config = METRIC_DESCRIPTIONS[metricKey];
  
  const isUnlimited = limit === undefined || limit === null;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const animatedPercentage = isUnlimited ? 0 : (animatedValue / limit) * 100;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  const variant = isAtLimit ? 'destructive' : isNearLimit ? 'warning' : 'success';

  return (
    <div className="flex items-center gap-4">
      <CircularProgress
        value={isUnlimited ? 0 : animatedPercentage}
        variant={variant}
        size={72}
        strokeWidth={6}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{config.label}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button" 
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                aria-label={`Learn more about ${config.label}`}
              >
                <HelpCircle size={14} aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{config.description}</p>
              {config.helpCenterPath && (
                <Link 
                  to={config.helpCenterPath}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Learn more →
                </Link>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
        <p className={cn(
          'text-lg font-semibold tabular-nums',
          isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'
        )}>
          {animatedValue.toLocaleString()}
          <span className="text-muted-foreground text-sm font-normal">
            {' '}/ {isUnlimited ? '∞' : limit.toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}

function MetricBlockSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-[72px] w-[72px] rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export function UsageMetricsGrid({ usage, limits, loading }: UsageMetricsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MetricBlockSkeleton />
        <MetricBlockSkeleton />
        <MetricBlockSkeleton />
      </div>
    );
  }

  if (!usage || !limits) return null;

  const metrics = [
    {
      metricKey: 'conversations',
      current: usage.conversations_this_month,
      limit: limits.max_conversations_per_month,
    },
    {
      metricKey: 'knowledge_sources',
      current: usage.knowledge_sources,
      limit: limits.max_knowledge_sources,
    },
    {
      metricKey: 'team_members',
      current: usage.team_members,
      limit: limits.max_team_members,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {metrics.map((metric, index) => (
        <MetricBlock key={metric.metricKey} {...metric} delay={index * 100} />
      ))}
    </div>
  );
}
