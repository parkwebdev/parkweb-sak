/**
 * AIPerformanceCard Component
 * 
 * Displays AI performance metrics including containment rate (conversations
 * handled without human intervention) and resolution rate.
 * 
 * @module components/analytics/AIPerformanceCard
 * @see docs/ANALYTICS_REDESIGN_PLAN.md - Phase 5d
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageChatCircle, Users01 } from '@untitledui/icons';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import { cn } from '@/lib/utils';
import type { AIPerformanceCardProps } from '@/types/analytics';

/**
 * Individual metric row with label, value, and optional progress bar.
 */
interface MetricRowProps {
  label: string;
  value: number;
  suffix?: string;
  showProgress?: boolean;
  progressVariant?: 'default' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
}

function MetricRow({ 
  label, 
  value, 
  suffix = '%', 
  showProgress = true,
  progressVariant = 'default',
  icon,
}: MetricRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {value.toFixed(1)}{suffix}
        </span>
      </div>
      {showProgress && (
        <Progress 
          value={value} 
          variant={progressVariant}
          className="h-2"
          aria-label={`${label}: ${value.toFixed(1)} percent`}
        />
      )}
    </div>
  );
}

/**
 * Renders AI performance metrics with containment and resolution rates.
 * Excludes response time per user request.
 */
export const AIPerformanceCard = React.memo(function AIPerformanceCard({
  containmentRate,
  resolutionRate,
  totalConversations,
  humanTakeover,
  loading = false,
  className,
}: AIPerformanceCardProps) {
  // Loading state
  if (loading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">AI Performance</CardTitle>
          <p className="text-xs text-muted-foreground">How well Ari handles conversations</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" role="status" aria-label="Loading AI performance data">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
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
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">AI Performance</CardTitle>
          <p className="text-xs text-muted-foreground">How well Ari handles conversations</p>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<ZapSolidIcon size={20} className="text-muted-foreground" />}
            title="No conversation data"
            description="AI performance metrics will appear once conversations are recorded."
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate AI handled count
  const aiHandled = totalConversations - humanTakeover;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">AI Performance</CardTitle>
        <p className="text-xs text-muted-foreground">How well Ari handles conversations</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Containment Rate */}
          <MetricRow
            label="Containment Rate"
            value={containmentRate}
            progressVariant={containmentRate >= 80 ? 'success' : containmentRate >= 60 ? 'warning' : 'destructive'}
            icon={<ZapSolidIcon size={16} className="text-primary" aria-hidden="true" />}
          />

          {/* Resolution Rate */}
          <MetricRow
            label="Resolution Rate"
            value={resolutionRate}
            progressVariant={resolutionRate >= 70 ? 'success' : resolutionRate >= 50 ? 'warning' : 'destructive'}
            icon={<Users01 size={16} className="text-success" aria-hidden="true" />}
          />

          {/* Summary stats */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AI Handled</span>
              <span className="font-medium text-foreground tabular-nums">
                {aiHandled.toLocaleString()} of {totalConversations.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Human Takeover</span>
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
