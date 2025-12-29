/**
 * ConversationsSection Component
 * 
 * Analytics section displaying conversation metrics including:
 * - Peak activity heatmap
 * - Conversation volume chart
 * - Conversation funnel visualization
 * 
 * @module components/analytics/sections/ConversationsSection
 */

import { PeakActivityChart } from '@/components/analytics/PeakActivityChart';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { ConversationFunnelCard } from '@/components/analytics/ConversationFunnelCard';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { FunnelStage } from '@/types/analytics';

interface ConversationsSectionProps {
  /** Conversation stats for peak activity chart */
  conversationStats: Array<{ date: string; total: number; active: number; closed: number }>;
  /** Funnel stages data */
  funnelStages: FunnelStage[];
  /** Trend value for conversation chart header */
  conversationTrendValue: number;
  /** Loading state for main data */
  loading: boolean;
  /** Loading state for funnel data */
  funnelLoading: boolean;
}

export function ConversationsSection({
  conversationStats,
  funnelStages,
  conversationTrendValue,
  loading,
  funnelLoading,
}: ConversationsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Peak Activity Heatmap - full width */}
      <ErrorBoundary
        fallback={(error) => (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Peak activity chart failed to load</p>
            <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
          </div>
        )}
      >
        <PeakActivityChart
          conversationStats={conversationStats.map(s => ({ date: s.date, total: s.total }))}
          loading={loading}
        />
      </ErrorBoundary>
      
      {/* Full-width conversation volume chart */}
      <AnimatedList className="space-y-6" staggerDelay={0.1}>
        <AnimatedItem>
          <ErrorBoundary
            fallback={(error) => (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Conversation chart failed to load</p>
                <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}
          >
            <ConversationChart 
              data={conversationStats.map(s => ({ date: s.date, total: s.total, active: s.active, closed: s.closed }))} 
              trendValue={conversationTrendValue} 
              trendPeriod="this month" 
            />
          </ErrorBoundary>
        </AnimatedItem>
        <AnimatedItem>
          <ConversationFunnelCard 
            stages={funnelStages} 
            loading={funnelLoading} 
          />
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
