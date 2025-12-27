/**
 * AIPerformanceSection Component
 * 
 * AI performance analytics with containment and resolution metrics.
 */

import React from 'react';
import { AIPerformanceCard } from '@/components/analytics/AIPerformanceCard';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface AIPerformanceStats {
  containmentRate: number;
  resolutionRate: number;
  aiHandled: number;
  humanTakeover: number;
  totalConversations: number;
}

interface AIPerformanceSectionProps {
  aiPerformanceStats: AIPerformanceStats | null;
  containmentRate: number;
  containmentTrend: { value: number }[];
  calculatePointChange: (trend: number[]) => number;
  loading?: boolean;
}

export function AIPerformanceSection({
  aiPerformanceStats,
  containmentRate,
  containmentTrend,
  calculatePointChange,
  loading = false,
}: AIPerformanceSectionProps) {
  const trendValues = containmentTrend.map(d => d.value);
  const aiHandled = aiPerformanceStats?.aiHandled ?? 0;
  const humanTakeover = aiPerformanceStats?.humanTakeover ?? 0;
  const resolutionRate = aiPerformanceStats?.resolutionRate ?? 0;

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading AI performance data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <MetricCardWithChart
          title={`${containmentRate.toFixed(0)}%`}
          subtitle="AI Containment"
          description="Chats resolved without human help"
          change={calculatePointChange(trendValues)}
          changeType="points"
          changeLabel="vs last period"
          chartData={containmentTrend}
          animationDelay={0}
        />
        <MetricCardWithChart
          title={aiHandled.toLocaleString()}
          subtitle="AI Handled"
          description="Conversations fully resolved by AI"
          change={0}
          changeType="percentage"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.05}
        />
        <MetricCardWithChart
          title={humanTakeover.toLocaleString()}
          subtitle="Human Takeover"
          description="Escalated to human agents"
          change={0}
          changeType="percentage"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.1}
        />
      </div>

      {/* Performance Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Performance Details
        </h3>
        <AnimatedList className="space-y-6" staggerDelay={0.1}>
          <AnimatedItem>
            <AIPerformanceCard 
              containmentRate={aiPerformanceStats?.containmentRate ?? 0}
              resolutionRate={aiPerformanceStats?.resolutionRate ?? 0}
              totalConversations={aiPerformanceStats?.totalConversations ?? 0}
              humanTakeover={aiPerformanceStats?.humanTakeover ?? 0}
              loading={loading}
            />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
