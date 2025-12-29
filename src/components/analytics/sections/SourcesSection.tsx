/**
 * SourcesSection Component
 * 
 * Analytics section displaying traffic source metrics including:
 * - Traffic source distribution chart
 * - Lead source breakdown card
 * - Traffic source trend chart
 * 
 * @module components/analytics/sections/SourcesSection
 */

import { TrafficSourceChart } from '@/components/analytics/TrafficSourceChart';
import { TrafficSourceTrendChart } from '@/components/analytics/TrafficSourceTrendChart';
import { LeadSourceBreakdownCard } from '@/components/analytics/LeadSourceBreakdownCard';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { TrafficSourceData, LeadSourceData } from '@/types/analytics';
import type { EngagementMetrics, DailySourceData } from '@/hooks/useTrafficAnalytics';

interface SourcesSectionProps {
  /** Traffic source data */
  trafficSources: TrafficSourceData[];
  /** Comparison traffic source data (when comparison mode enabled) */
  comparisonTrafficSources?: TrafficSourceData[];
  /** Engagement metrics */
  engagement: EngagementMetrics;
  /** Lead source breakdown data */
  leadsBySource: LeadSourceData[];
  /** Traffic source trend data by date */
  sourcesByDate: DailySourceData[];
  /** Whether comparison mode is enabled */
  comparisonMode: boolean;
  /** Loading state for traffic data */
  trafficLoading: boolean;
  /** Loading state for comparison traffic data */
  comparisonTrafficLoading: boolean;
}

export function SourcesSection({
  trafficSources,
  comparisonTrafficSources,
  engagement,
  leadsBySource,
  sourcesByDate,
  comparisonMode,
  trafficLoading,
  comparisonTrafficLoading,
}: SourcesSectionProps) {
  return (
    <div className="space-y-6">
      <AnimatedList className="space-y-6" staggerDelay={0.1}>
        <AnimatedItem>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficSourceChart 
              data={trafficSources} 
              loading={trafficLoading || (comparisonMode && comparisonTrafficLoading)}
              comparisonData={comparisonMode ? comparisonTrafficSources : undefined}
              engagement={engagement}
            />
            <LeadSourceBreakdownCard
              data={leadsBySource}
              loading={trafficLoading}
            />
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <ErrorBoundary
            fallback={(error) => (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Traffic source trend chart failed to load</p>
                <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}
          >
            <TrafficSourceTrendChart 
              data={sourcesByDate} 
              loading={trafficLoading}
            />
          </ErrorBoundary>
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
