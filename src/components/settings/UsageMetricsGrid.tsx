/**
 * @fileoverview Usage metrics grid displaying resource usage with progress bars.
 * Shows conversations, knowledge sources, and team members in a responsive grid.
 * Supports bar and ring visualization styles.
 */

import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { HelpCircle, BarChart07, PieChart01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { PlanLimits, CurrentUsage } from '@/hooks/usePlanLimits';

type VisualizationStyle = 'bar' | 'ring';

interface UsageMetricsGridProps {
  usage: CurrentUsage | null;
  limits: PlanLimits | null;
  loading?: boolean;
}

interface MetricConfig {
  label: string;
  description: string;
  docUrl?: string;
}

const METRIC_DESCRIPTIONS: Record<string, MetricConfig> = {
  conversations: {
    label: 'Conversations this month',
    description: 'Total chat conversations initiated with your AI agent this billing period. Resets monthly.',
    docUrl: 'https://docs.lovable.dev/features/conversations',
  },
  knowledge_sources: {
    label: 'Knowledge Sources',
    description: 'Documents, URLs, and files your agent uses to answer questions accurately.',
    docUrl: 'https://docs.lovable.dev/features/knowledge',
  },
  team_members: {
    label: 'Team Members',
    description: 'Users with access to your account. Includes admins and team members.',
    docUrl: 'https://docs.lovable.dev/features/team',
  },
};

interface MetricBlockProps {
  metricKey: string;
  current: number;
  limit: number | null | undefined;
  delay?: number;
  visualizationStyle: VisualizationStyle;
}

function MetricBlock({ metricKey, current, limit, delay = 0, visualizationStyle }: MetricBlockProps) {
  const animatedValue = useAnimatedCounter(current, { duration: 800, delay });
  const config = METRIC_DESCRIPTIONS[metricKey];
  
  const isUnlimited = limit === undefined || limit === null;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const animatedPercentage = isUnlimited ? 0 : (animatedValue / limit) * 100;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  const variant = isAtLimit ? 'destructive' : isNearLimit ? 'warning' : 'success';

  if (visualizationStyle === 'ring') {
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
                {config.docUrl && (
                  <a 
                    href={config.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Learn more →
                  </a>
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-muted-foreground">{config.label}</p>
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
            {config.docUrl && (
              <a 
                href={config.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                Learn more →
              </a>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold tabular-nums ${
          isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'
        }`}>
          {animatedValue.toLocaleString()}
        </span>
        <span className="text-muted-foreground text-sm">
          / {isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <Progress 
        value={isUnlimited ? 0 : Math.min(animatedPercentage, 100)} 
        variant={variant}
        className="h-1.5"
      />
      {!isUnlimited && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {animatedPercentage.toFixed(0)}% used
        </p>
      )}
    </div>
  );
}

function StyleToggle({ 
  value, 
  onChange 
}: { 
  value: VisualizationStyle; 
  onChange: (style: VisualizationStyle) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
      <button
        type="button"
        onClick={() => onChange('bar')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          value === 'bar' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Bar chart view"
        aria-pressed={value === 'bar'}
      >
        <BarChart07 size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onChange('ring')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          value === 'ring' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Ring chart view"
        aria-pressed={value === 'ring'}
      >
        <PieChart01 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function MetricBlockSkeleton({ visualizationStyle }: { visualizationStyle: VisualizationStyle }) {
  if (visualizationStyle === 'ring') {
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
  const [visualizationStyle, setVisualizationStyle] = useState<VisualizationStyle>('bar');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-20" />
        </div>
        <div className={cn(
          'grid gap-8',
          visualizationStyle === 'ring' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'
        )}>
          <MetricBlockSkeleton visualizationStyle={visualizationStyle} />
          <MetricBlockSkeleton visualizationStyle={visualizationStyle} />
          <MetricBlockSkeleton visualizationStyle={visualizationStyle} />
        </div>
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <StyleToggle value={visualizationStyle} onChange={setVisualizationStyle} />
      </div>
      <div className={cn(
        'grid gap-8',
        visualizationStyle === 'ring' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'
      )}>
        {metrics.map((metric, index) => (
          <MetricBlock 
            key={metric.metricKey} 
            {...metric} 
            delay={index * 100} 
            visualizationStyle={visualizationStyle}
          />
        ))}
      </div>
    </div>
  );
}
