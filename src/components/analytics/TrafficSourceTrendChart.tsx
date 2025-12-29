/**
 * TrafficSourceTrendChart Component
 * 
 * Stacked area chart showing traffic sources over time.
 * Visualizes daily breakdown by source type.
 * @module components/analytics/TrafficSourceTrendChart
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from './ChartCardHeader';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());

  // Calculate totals and trend
  const { totalSessions, trendPercentage, activeSources } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.total, 0);
    
    // Calculate trend from first half vs second half
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

  const toggleSource = (source: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-[280px] w-full" />
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
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            Traffic trend data will appear once conversations are recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map(d => ({
    ...d,
    date: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Traffic Trend by Source"
          trendValue={trendPercentage}
          trendLabel="Traffic"
          trendPeriod="this period"
          contextSummary={`${totalSessions.toLocaleString()} total sessions across ${activeSources.length} sources`}
        />

        {/* Legend with toggle */}
        <div className="flex flex-wrap gap-3 mb-4">
          {activeSources.map(source => (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all",
                hiddenSources.has(source)
                  ? "opacity-40 bg-muted"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: SOURCE_COLORS[source] }}
              />
              <span className="capitalize">{SOURCE_LABELS[source]}</span>
            </button>
          ))}
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {activeSources.map(source => (
                  <linearGradient key={source} id={`gradient-${source}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SOURCE_COLORS[source]} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SOURCE_COLORS[source]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              />
              {activeSources.map(source => (
                <Area
                  key={source}
                  type="monotone"
                  dataKey={source}
                  name={SOURCE_LABELS[source]}
                  stackId="1"
                  stroke={SOURCE_COLORS[source]}
                  fill={`url(#gradient-${source})`}
                  strokeWidth={2}
                  hide={hiddenSources.has(source)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
