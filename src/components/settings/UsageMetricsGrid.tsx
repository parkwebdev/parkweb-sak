/**
 * @fileoverview Usage metrics grid displaying resource usage with progress bars.
 * Shows conversations, knowledge sources, and team members in a responsive grid.
 */

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanLimits, CurrentUsage } from '@/hooks/usePlanLimits';

interface UsageMetricsGridProps {
  usage: CurrentUsage | null;
  limits: PlanLimits | null;
  loading?: boolean;
}

interface MetricBlockProps {
  label: string;
  current: number;
  limit: number | null | undefined;
}

function MetricBlock({ label, current, limit }: MetricBlockProps) {
  const isUnlimited = limit === undefined || limit === null;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold tabular-nums ${
          isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'
        }`}>
          {current.toLocaleString()}
        </span>
        <span className="text-muted-foreground text-sm">
          / {isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <Progress 
        value={isUnlimited ? 0 : Math.min(percentage, 100)} 
        variant={isAtLimit ? 'destructive' : isNearLimit ? 'warning' : 'success'}
        className="h-1.5"
      />
      {!isUnlimited && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {percentage.toFixed(0)}% used
        </p>
      )}
    </div>
  );
}

function MetricBlockSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function UsageMetricsGrid({ usage, limits, loading }: UsageMetricsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricBlockSkeleton />
        <MetricBlockSkeleton />
        <MetricBlockSkeleton />
      </div>
    );
  }

  if (!usage || !limits) return null;

  const metrics = [
    {
      label: 'Conversations this month',
      current: usage.conversations_this_month,
      limit: limits.max_conversations_per_month,
    },
    {
      label: 'Knowledge Sources',
      current: usage.knowledge_sources,
      limit: limits.max_knowledge_sources,
    },
    {
      label: 'Team Members',
      current: usage.team_members,
      limit: limits.max_team_members,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {metrics.map((metric) => (
        <MetricBlock key={metric.label} {...metric} />
      ))}
    </div>
  );
}
