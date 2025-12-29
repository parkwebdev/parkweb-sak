/**
 * PageEngagementCard Component
 * 
 * Displays key engagement metrics: bounce rate, avg pages per session,
 * avg session duration, and overall conversion rate.
 * @module components/analytics/PageEngagementCard
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartCardHeader } from './ChartCardHeader';
import { cn } from '@/lib/utils';
import type { EngagementMetrics } from '@/hooks/useTrafficAnalytics';

interface PageEngagementCardProps {
  engagement: EngagementMetrics;
  loading?: boolean;
}

/** Format milliseconds to readable duration */
function formatDuration(ms: number): string {
  if (ms < 1000) return '< 1s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/** Get color class based on bounce rate (lower is better) */
function getBounceRateColor(rate: number): string {
  if (rate <= 30) return 'text-success';
  if (rate <= 50) return 'text-warning';
  return 'text-destructive';
}

/** Get color class based on CVR (higher is better) */
function getCVRColor(rate: number): string {
  if (rate >= 5) return 'text-success';
  if (rate >= 2) return 'text-warning';
  return 'text-muted-foreground';
}

export const PageEngagementCard = React.memo(function PageEngagementCard({
  engagement,
  loading,
}: PageEngagementCardProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Bounce Rate',
      value: `${engagement.bounceRate.toFixed(1)}%`,
      tooltip: 'Percentage of sessions with only one page view. Lower is better.',
      colorClass: getBounceRateColor(engagement.bounceRate),
    },
    {
      label: 'Pages / Session',
      value: engagement.avgPagesPerSession.toFixed(1),
      tooltip: 'Average number of pages viewed per session.',
      colorClass: 'text-foreground',
    },
    {
      label: 'Avg Duration',
      value: formatDuration(engagement.avgSessionDuration),
      tooltip: 'Average time visitors spend on your site per session.',
      colorClass: 'text-foreground',
    },
    {
      label: 'Conversion Rate',
      value: `${engagement.overallCVR.toFixed(1)}%`,
      tooltip: 'Percentage of sessions that resulted in a lead capture.',
      colorClass: getCVRColor(engagement.overallCVR),
    },
  ];

  const hasData = engagement.totalSessions > 0;

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Page Engagement"
          contextSummary={hasData 
            ? `${engagement.totalSessions.toLocaleString()} sessions, ${engagement.totalLeads.toLocaleString()} leads captured`
            : 'No session data available yet'
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <Tooltip key={metric.label}>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className={cn("text-2xl font-semibold tabular-nums", metric.colorClass)}>
                    {hasData ? metric.value : '—'}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs max-w-48">{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
