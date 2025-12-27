/**
 * SatisfactionSection Component
 * 
 * Customer satisfaction analytics with rating distribution.
 */

import React from 'react';
import { SatisfactionScoreCard } from '@/components/analytics/SatisfactionScoreCard';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import type { SatisfactionStats } from '@/types/analytics';

interface SatisfactionSectionProps {
  satisfactionStats: SatisfactionStats | null;
  avgSatisfaction: number;
  satisfactionTrend: { value: number }[];
  calculatePointChange: (trend: number[]) => number;
  loading?: boolean;
}

export function SatisfactionSection({
  satisfactionStats,
  avgSatisfaction,
  satisfactionTrend,
  calculatePointChange,
  loading = false,
}: SatisfactionSectionProps) {
  const trendValues = satisfactionTrend.map(d => d.value);
  const totalRatings = satisfactionStats?.totalRatings ?? 0;
  
  // Calculate positive rating percentage (4-5 stars)
  const positiveRatings = satisfactionStats?.distribution
    ?.filter(d => d.rating >= 4)
    ?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const positiveRate = totalRatings > 0 ? ((positiveRatings / totalRatings) * 100).toFixed(0) : '0';

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading satisfaction data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <MetricCardWithChart
          title={avgSatisfaction.toFixed(1)}
          subtitle="Avg Satisfaction"
          description="User ratings out of 5 stars"
          change={calculatePointChange(trendValues)}
          changeType="points"
          changeLabel="vs last period"
          chartData={satisfactionTrend}
          animationDelay={0}
        />
        <MetricCardWithChart
          title={totalRatings.toLocaleString()}
          subtitle="Total Ratings"
          description="Feedback responses collected"
          change={0}
          changeType="percentage"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.05}
        />
        <MetricCardWithChart
          title={`${positiveRate}%`}
          subtitle="Positive Rate"
          description="Ratings of 4 or 5 stars"
          change={0}
          changeType="points"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.1}
        />
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Rating Distribution
        </h3>
        <AnimatedList staggerDelay={0.1}>
          <AnimatedItem>
            <SatisfactionScoreCard 
              averageRating={satisfactionStats?.averageRating ?? 0}
              totalRatings={satisfactionStats?.totalRatings ?? 0}
              distribution={satisfactionStats?.distribution ?? []}
              loading={loading}
            />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
