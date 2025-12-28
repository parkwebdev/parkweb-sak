/**
 * ConversationStatsCard Component
 * 
 * Displays conversation overview metrics including total conversations,
 * average per day, busiest day, and active/closed/human takeover breakdown.
 * 
 * @module components/analytics/ConversationStatsCard
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageChatSquare, Calendar, TrendUp01, CheckCircle, User03 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { ChartCardHeader } from './ChartCardHeader';
import { format } from 'date-fns';

export interface ConversationStatsCardProps {
  /** Array of daily conversation stats */
  conversationStats: Array<{
    date: string;
    total: number;
    active: number;
    closed: number;
    human_takeover: number;
  }>;
  /** Trend percentage value for the header */
  trendValue?: number;
  /** Period label for trend (e.g., "this month") */
  trendPeriod?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Individual stat row component
 */
interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

function StatRow({ icon, label, value, className }: StatRowProps) {
  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Renders conversation overview metrics with stats and breakdown.
 */
export const ConversationStatsCard = React.memo(function ConversationStatsCard({
  conversationStats,
  trendValue = 0,
  trendPeriod = 'this month',
  loading = false,
  className,
}: ConversationStatsCardProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    if (!conversationStats || conversationStats.length === 0) {
      return {
        totalConversations: 0,
        avgPerDay: 0,
        busiestDay: 'N/A',
        totalActive: 0,
        totalClosed: 0,
        totalHumanTakeover: 0,
      };
    }

    const totalConversations = conversationStats.reduce((sum, s) => sum + s.total, 0);
    const avgPerDay = totalConversations / conversationStats.length;

    // Find busiest day of week
    const dayTotals = conversationStats.reduce((acc, s) => {
      const dayName = format(new Date(s.date), 'EEEE');
      acc[dayName] = (acc[dayName] || 0) + s.total;
      return acc;
    }, {} as Record<string, number>);

    const busiestDay = Object.entries(dayTotals)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    const totalActive = conversationStats.reduce((sum, s) => sum + s.active, 0);
    const totalClosed = conversationStats.reduce((sum, s) => sum + s.closed, 0);
    const totalHumanTakeover = conversationStats.reduce((sum, s) => sum + s.human_takeover, 0);

    return {
      totalConversations,
      avgPerDay,
      busiestDay,
      totalActive,
      totalClosed,
      totalHumanTakeover,
    };
  }, [conversationStats]);

  // Loading state
  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-4" role="status" aria-label="Loading conversation stats">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <div className="pt-4 border-t border-border space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (metrics.totalConversations === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Conversation Overview"
            trendValue={0}
            trendPeriod={trendPeriod}
            contextSummary="No conversations recorded yet"
          />
          <EmptyState
            icon={<MessageChatSquare size={20} className="text-muted-foreground" />}
            title="No conversation data"
            description="Conversation metrics will appear once conversations are recorded."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Conversation Overview"
          trendValue={trendValue}
          trendLabel="Conversations"
          trendPeriod={trendPeriod}
          contextSummary={`${metrics.totalConversations.toLocaleString()} conversations over ${conversationStats.length} days`}
        />
        
        <div className="space-y-4">
          {/* Key stats */}
          <StatRow
            icon={<MessageChatSquare size={16} className="text-muted-foreground" />}
            label="Total Conversations"
            value={metrics.totalConversations.toLocaleString()}
          />
          <StatRow
            icon={<TrendUp01 size={16} className="text-muted-foreground" />}
            label="Average per Day"
            value={metrics.avgPerDay.toFixed(1)}
          />
          <StatRow
            icon={<Calendar size={16} className="text-muted-foreground" />}
            label="Busiest Day"
            value={metrics.busiestDay}
          />

          {/* Status breakdown */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-status-active" />
                <span className="text-muted-foreground">Active</span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {metrics.totalActive.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Closed</span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {metrics.totalClosed.toLocaleString()}
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
                {metrics.totalHumanTakeover.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
