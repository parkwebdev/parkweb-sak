/**
 * @fileoverview Horizontal bar chart displaying usage metrics.
 * Shows conversations, knowledge sources, and team members with status-based coloring.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { PlanLimits, CurrentUsage } from '@/hooks/usePlanLimits';

interface UsageBarChartProps {
  usage: CurrentUsage | null;
  limits: PlanLimits | null;
  loading?: boolean;
}

interface MetricConfig {
  key: string;
  label: string;
  current: number;
  limit: number | null | undefined;
  description: string;
  helpCenterPath: string;
}

const getBarColor = (percentage: number): string => {
  if (percentage >= 100) return 'hsl(var(--destructive))';
  if (percentage >= 80) return 'hsl(var(--warning))';
  return 'hsl(var(--success))';
};

function UsageBarChartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function UsageBarChart({ usage, limits, loading }: UsageBarChartProps) {
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return <UsageBarChartSkeleton />;
  }

  if (!usage || !limits) return null;

  const metrics: MetricConfig[] = [
    {
      key: 'conversations',
      label: 'Conversations this month',
      current: usage.conversations_this_month,
      limit: limits.max_conversations_per_month,
      description: 'Total chat conversations initiated with your AI agent this billing period. Resets monthly.',
      helpCenterPath: '/help-center/getting-started/conversations',
    },
    {
      key: 'knowledge_sources',
      label: 'Knowledge Sources',
      current: usage.knowledge_sources,
      limit: limits.max_knowledge_sources,
      description: 'Documents, URLs, and files your agent uses to answer questions accurately.',
      helpCenterPath: '/help-center/getting-started/knowledge-sources',
    },
    {
      key: 'team_members',
      label: 'Team Members',
      current: usage.team_members,
      limit: limits.max_team_members,
      description: 'Users with access to your account. Includes admins and team members.',
      helpCenterPath: '/help-center/getting-started/team-management',
    },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const isUnlimited = metric.limit === undefined || metric.limit === null;
        const limitValue = metric.limit ?? 1;
        const percentage = isUnlimited ? 0 : Math.min((metric.current / limitValue) * 100, 100);
        const displayPercentage = isUnlimited ? 0 : (metric.current / limitValue) * 100;
        const isAtLimit = !isUnlimited && displayPercentage >= 100;
        const isNearLimit = !isUnlimited && displayPercentage >= 80;

        return (
          <div 
            key={metric.key}
            className="flex items-center gap-3 animate-fade-in"
            style={{ 
              animationDelay: prefersReducedMotion ? '0ms' : `${index * 50}ms`,
              animationFillMode: 'both',
            }}
          >
            {/* Label */}
            <span className="text-sm text-muted-foreground w-40 shrink-0">
              {metric.label}
            </span>

            {/* Bar with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 h-8 relative overflow-hidden bg-muted/30 rounded-md cursor-default">
                  <div
                    className="h-full rounded-md transition-all duration-500 ease-out"
                    style={{
                      width: isUnlimited ? '0%' : `${percentage}%`,
                      backgroundColor: getBarColor(displayPercentage),
                      animation: prefersReducedMotion ? 'none' : undefined,
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{metric.description}</p>
                <Link 
                  to={metric.helpCenterPath}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Learn more →
                </Link>
              </TooltipContent>
            </Tooltip>

            {/* Usage count */}
            <span className={cn(
              'text-sm tabular-nums w-24 text-right shrink-0 font-medium',
              isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'
            )}>
              {metric.current.toLocaleString()}
              <span className="text-muted-foreground font-normal">
                {' '}/ {isUnlimited ? '∞' : limitValue.toLocaleString()}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
