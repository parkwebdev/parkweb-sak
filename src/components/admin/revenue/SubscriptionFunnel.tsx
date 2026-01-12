/**
 * SubscriptionFunnel Component
 * 
 * Visualization of trial to paid conversion funnel.
 * Follows ConversationFunnelCard pattern with tooltips and animations.
 * 
 * @module components/admin/revenue/SubscriptionFunnel
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartCardHeader } from '@/components/analytics/ChartCardHeader';
import { TrendDown01 } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface FunnelData {
  trials: number;
  active: number;
  churned: number;
  conversionRate: number;
}

interface SubscriptionFunnelProps {
  /** Funnel data */
  data: FunnelData | null;
  /** Loading state */
  loading: boolean;
}

interface FunnelStage {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

/**
 * Subscription funnel visualization with tooltips and animations.
 */
export function SubscriptionFunnel({ data, loading }: SubscriptionFunnelProps) {
  const prefersReducedMotion = useReducedMotion();

  const stages = useMemo((): FunnelStage[] => {
    const funnel = data || { trials: 0, active: 0, churned: 0, conversionRate: 0 };
    const total = funnel.trials || 1;
    
    return [
      {
        name: 'Trials',
        count: funnel.trials,
        color: 'hsl(var(--primary))',
        percentage: 100,
      },
      {
        name: 'Active',
        count: funnel.active,
        color: 'hsl(var(--status-active))',
        percentage: (funnel.active / total) * 100,
      },
      {
        name: 'Churned',
        count: funnel.churned,
        color: 'hsl(var(--destructive))',
        percentage: (funnel.churned / total) * 100,
      },
    ];
  }, [data]);

  const contextSummary = useMemo(() => {
    if (!data || data.trials === 0) return 'No funnel data available';
    return `${data.conversionRate.toFixed(1)}% conversion rate`;
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = stages[0]?.count || 1;

  return (
    <Card>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Subscription Funnel"
          contextSummary={contextSummary}
        />
        
        {!data || data.trials === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Funnel analysis will appear once trials are recorded
          </div>
        ) : (
          <TooltipProvider>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const widthPercentage = (stage.count / maxCount) * 100;
                const animationDelay = index * 100;
                
                // Calculate drop-off from previous stage
                const previousStage = stages[index - 1];
                const dropOff = previousStage 
                  ? ((previousStage.count - stage.count) / previousStage.count) * 100
                  : 0;
                const showDropOff = index > 0 && dropOff > 0 && stage.name !== 'Churned';

                return (
                  <div 
                    key={stage.name}
                    className="flex items-center gap-3 group"
                  >
                    {/* Stage name */}
                    <span className="text-sm text-muted-foreground w-16 shrink-0">
                      {stage.name}
                    </span>
                    
                    {/* Bar with tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1 h-8 relative overflow-hidden rounded-md bg-muted/50">
                          <div
                            className={cn(
                              "h-full rounded-md transition-all duration-300",
                              "group-hover:opacity-90"
                            )}
                            style={{
                              width: `${Math.max(widthPercentage, 2)}%`,
                              backgroundColor: stage.color,
                              animation: prefersReducedMotion 
                                ? 'none' 
                                : `growWidth 600ms ease-out ${animationDelay}ms both`,
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{stage.name}</p>
                        <p className="text-muted-foreground">
                          {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Count and percentage */}
                    <div className="flex items-center gap-2 w-24 shrink-0 justify-end">
                      <span className="text-sm font-medium tabular-nums">
                        {stage.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ({stage.percentage.toFixed(0)}%)
                      </span>
                      {showDropOff && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center text-destructive">
                              <TrendDown01 size={12} aria-hidden="true" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {dropOff.toFixed(1)}% drop-off
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Conversion rate footer */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-sm font-semibold text-status-active">
                  {data.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
