/**
 * TrafficSourceTrendChart Component
 * 
 * Stacked area chart showing traffic sources over time.
 * Visualizes daily breakdown by source type.
 * @module components/analytics/TrafficSourceTrendChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from './ChartCardHeader';
import { StackedAreaChartCard, SeriesConfig } from '@/components/charts/StackedAreaChartCard';
import { format, parseISO } from 'date-fns';
import type { DailySourceData } from '@/hooks/useTrafficAnalytics';

interface TrafficSourceTrendChartProps {
  data: DailySourceData[];
  loading?: boolean;
}

// Color palette for sources
const SOURCE_COLORS: Record<string, string> = {
  direct: 'hsl(210, 100%, 70%)',
  organic: 'hsl(142, 76%, 46%)',
  paid: 'hsl(280, 85%, 65%)',
  social: 'hsl(340, 82%, 60%)',
  email: 'hsl(38, 92%, 55%)',
  referral: 'hsl(190, 90%, 50%)',
};

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct',
  organic: 'Organic',
  paid: 'Paid',
  social: 'Social',
  email: 'Email',
  referral: 'Referral',
};

export const TrafficSourceTrendChart = React.memo(function TrafficSourceTrendChart({
  data,
  loading,
}: TrafficSourceTrendChartProps) {
  // Calculate totals and trend
  const { totalSessions, trendPercentage, activeSources } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.total, 0);
    
    if (data.length < 2) {
      return { totalSessions: total, trendPercentage: 0, activeSources: [] };
    }
    
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((s, d) => s + d.total, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length;
    
    const trend = firstAvg === 0 ? (secondAvg > 0 ? 100 : 0) : ((secondAvg - firstAvg) / firstAvg) * 100;
    
    // Find which sources have data
    const sources = ['direct', 'organic', 'paid', 'social', 'email', 'referral'].filter(source =>
      data.some(d => d[source as keyof DailySourceData] as number > 0)
    );
    
    return { totalSessions: total, trendPercentage: trend, activeSources: sources };
  }, [data]);

  // Build series config from active sources
  const seriesConfig: SeriesConfig[] = useMemo(() => {
    return activeSources.map(source => ({
      key: source,
      label: SOURCE_LABELS[source],
      color: SOURCE_COLORS[source],
    }));
  }, [activeSources]);

  // Format data for chart
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: format(parseISO(d.date), 'MMM d'),
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Traffic Trend"
            contextSummary="No traffic data available for the selected period"
          />
          <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
            Traffic trend data will appear once conversations are recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Traffic Trend by Source"
          trendValue={trendPercentage}
          trendLabel="Traffic"
          trendPeriod="this period"
        />

        <StackedAreaChartCard
          data={chartData}
          series={seriesConfig}
          gradientIdPrefix="traffic"
        />

        {/* Context summary footer */}
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {totalSessions.toLocaleString()} sessions across {activeSources.length} sources
        </p>
      </CardContent>
    </Card>
  );
});
