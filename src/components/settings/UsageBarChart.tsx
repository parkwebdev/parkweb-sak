/**
 * @fileoverview Horizontal bar chart displaying usage metrics.
 * Shows conversations, knowledge sources, and team members with status-based coloring.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HelpCircle } from '@untitledui/icons';
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
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 flex-1 rounded-md" />
          <Skeleton className="h-4 w-20" />
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
      helpCenterPath: '/help-center?category=settings&article=usage',
    },
    {
      key: 'knowledge_sources',
      label: 'Knowledge Sources',
      current: usage.knowledge_sources,
      limit: limits.max_knowledge_sources,
      description: 'Documents, URLs, and files your agent uses to answer questions accurately.',
      helpCenterPath: '/help-center?category=ari&article=knowledge-sources',
    },
    {
      key: 'team_members',
      label: 'Team Members',
      current: usage.team_members,
      limit: limits.max_team_members,
      description: 'Users with access to your account. Includes admins and team members.',
      helpCenterPath: '/help-center?category=settings&article=team',
    },
  ];

  return (
    <div className="space-y-3">
      {metrics.map((metric, index) => {
        const isUnlimited = metric.limit === undefined || metric.limit === null;
        const limitValue = metric.limit ?? 1;
        const percentage = isUnlimited ? 0 : Math.min((metric.current / limitValue) * 100, 100);
        const displayPercentage = isUnlimited ? 0 : (metric.current / limitValue) * 100;
        const isAtLimit = !isUnlimited && displayPercentage >= 100;
        const isNearLimit = !isUnlimited && displayPercentage >= 80;
        const animationDelay = prefersReducedMotion ? 0 : index * 50;

        return (
          <div 
            key={metric.key}
            className="flex items-center gap-3 group animate-fade-in"
            style={{ 
              animationDelay: `${animationDelay}ms`,
              animationFillMode: 'both',
            }}
          >
            {/* Label with help tooltip */}
            <div className="flex items-center gap-1.5 w-44 shrink-0">
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {metric.label}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    aria-label={`Learn more about ${metric.label}`}
                  >
                    <HelpCircle size={14} aria-hidden="true" />
                  </button>
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
            </div>

            {/* Bar with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 h-6 relative overflow-hidden bg-muted/50 rounded-md">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: isUnlimited ? '0%' : `${Math.max(percentage, metric.current > 0 ? 4 : 0)}%`,
                      backgroundColor: getBarColor(displayPercentage),
                      animation: prefersReducedMotion ? 'none' : `growWidth 600ms ease-out ${animationDelay}ms both`,
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="space-y-1">
                  <p className="font-medium">{metric.label}</p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">{metric.current.toLocaleString()}</span> of {isUnlimited ? 'unlimited' : limitValue.toLocaleString()} used
                  </p>
                  {!isUnlimited && (
                    <p className={cn(
                      isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-success'
                    )}>
                      {displayPercentage.toFixed(0)}% of limit
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Usage count */}
            <span className={cn(
              'text-sm tabular-nums w-20 text-right shrink-0',
              isAtLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-warning font-medium' : 'text-muted-foreground group-hover:text-foreground transition-colors'
            )}>
              {metric.current.toLocaleString()} / {isUnlimited ? '∞' : limitValue.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
