/**
 * ConversationsSection Component
 * 
 * Detailed conversation analytics with trends chart.
 */

import React from 'react';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface ConversationStat {
  date: string;
  total: number;
  active: number;
  resolved: number;
}

interface ConversationsSectionProps {
  conversationStats: ConversationStat[];
  totalConversations: number;
  conversationTrend: { value: number }[];
  calculatePeriodChange: (trend: number[]) => number;
  loading?: boolean;
}

export function ConversationsSection({
  conversationStats,
  totalConversations,
  conversationTrend,
  calculatePeriodChange,
  loading = false,
}: ConversationsSectionProps) {
  const trendValues = conversationTrend.map(d => d.value);
  
  // Calculate additional metrics
  const totalActive = conversationStats.reduce((sum, stat) => sum + stat.active, 0);
  const totalResolved = conversationStats.reduce((sum, stat) => sum + stat.resolved, 0);
  const resolutionRate = totalConversations > 0 
    ? ((totalResolved / totalConversations) * 100).toFixed(1) 
    : '0';

  // Transform data for ConversationChart (expects 'closed' not 'resolved')
  const chartData = conversationStats.map(stat => ({
    date: stat.date,
    total: stat.total,
    active: stat.active,
    closed: stat.resolved,
  }));

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading conversation data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <MetricCardWithChart
          title={totalConversations.toLocaleString()}
          subtitle="Total Conversations"
          description="All chat sessions in period"
          change={calculatePeriodChange(trendValues)}
          changeType="percentage"
          changeLabel="vs last period"
          chartData={conversationTrend}
          animationDelay={0}
        />
        <MetricCardWithChart
          title={totalActive.toLocaleString()}
          subtitle="Active"
          description="Currently ongoing chats"
          change={0}
          changeType="percentage"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.05}
        />
        <MetricCardWithChart
          title={`${resolutionRate}%`}
          subtitle="Resolution Rate"
          description="Conversations marked resolved"
          change={0}
          changeType="points"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.1}
        />
      </div>

      {/* Trends Chart */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Conversation Trends
        </h3>
        <AnimatedList staggerDelay={0.1}>
          <AnimatedItem>
            <ConversationChart data={chartData} />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
