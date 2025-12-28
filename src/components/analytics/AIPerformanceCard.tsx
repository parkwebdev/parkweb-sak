/**
 * AIPerformanceCard Component
 * 
 * Displays AI performance metrics using stacked horizontal bar visualization
 * for containment rate and resolution rate, with summary stats below.
 * 
 * @module components/analytics/AIPerformanceCard
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { User03 } from '@untitledui/icons';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { cn } from '@/lib/utils';
import type { AIPerformanceCardProps } from '@/types/analytics';
import { ChartCardHeader } from './ChartCardHeader';

/**
 * Stacked bar visualization for a metric
 */
interface StackedBarProps {
  label: string;
  primaryValue: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor: string;
  secondaryColor: string;
  tooltip?: string;
}

function StackedBar({
  label,
  primaryValue,
  primaryLabel,
  secondaryLabel,
  primaryColor,
  secondaryColor,
  tooltip,
}: StackedBarProps) {
  const secondaryValue = 100 - primaryValue;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {primaryValue.toFixed(1)}%
        </span>
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted cursor-default">
            {/* Primary segment */}
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${primaryValue}%`,
                backgroundColor: primaryColor,
              }}
            />
            {/* Secondary segment */}
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${secondaryValue}%`,
                backgroundColor: secondaryColor,
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <div className="space-y-1.5">
            {tooltip && <p className="text-xs text-muted-foreground">{tooltip}</p>}
            <div className="flex items-center gap-2 text-xs">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: primaryColor }}
              />
              <span>{primaryLabel}: {primaryValue.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: secondaryColor }}
              />
              <span>{secondaryLabel}: {secondaryValue.toFixed(1)}%</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: primaryColor }}
          />
          <span>{primaryLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: secondaryColor }}
          />
          <span>{secondaryLabel}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders AI performance metrics with stacked bar visualization
 * for containment and resolution rates.
 */
export const AIPerformanceCard = React.memo(function AIPerformanceCard({
  containmentRate,
  resolutionRate,
  totalConversations,
  humanTakeover,
  trendValue = 0,
  trendPeriod = 'this month',
  loading = false,
  className,
}: AIPerformanceCardProps & { trendValue?: number; trendPeriod?: string }) {
  // Loading state
  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-6" role="status" aria-label="Loading Ari performance data">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
            <div className="pt-2 border-t space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (totalConversations === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Conversation Breakdown"
            trendValue={0}
            trendPeriod={trendPeriod}
            contextSummary="No conversations recorded yet"
          />
          <EmptyState
            icon={<ZapSolidIcon size={20} className="text-muted-foreground" />}
            title="No conversation data"
            description="Ari performance metrics will appear once conversations are recorded."
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate Ari handled count
  const ariHandled = totalConversations - humanTakeover;

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Conversation Breakdown"
          trendValue={trendValue}
          trendLabel="Containment"
          trendPeriod={trendPeriod}
        />
        <div className="space-y-6">
          {/* Containment Rate - Stacked Bar */}
          <StackedBar
            label="Containment Rate"
            primaryValue={containmentRate}
            primaryLabel="AI Handled"
            secondaryLabel="Human Takeover"
            primaryColor="hsl(220, 90%, 56%)"
            secondaryColor="hsl(var(--muted))"
            tooltip="Percentage of conversations handled entirely by Ari without human intervention."
          />

          {/* Resolution Rate - Stacked Bar */}
          <StackedBar
            label="Resolution Rate"
            primaryValue={resolutionRate}
            primaryLabel="Resolved"
            secondaryLabel="Open"
            primaryColor="hsl(142, 76%, 36%)"
            secondaryColor="hsl(var(--muted))"
            tooltip="Percentage of conversations successfully resolved and closed."
          />

          {/* Summary stats */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AriAgentsIcon size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Ari Handled</span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {ariHandled.toLocaleString()} of {totalConversations.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                  <User03 size={10} className="text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">Human Takeover</span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {humanTakeover.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
