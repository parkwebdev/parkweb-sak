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
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  const [animationId, setAnimationId] = useState(0);
  const prefersReducedMotion = useReducedMotion();
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
    setAnimationId(v => v + 1);
  };

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

  // Format data for chart
  const chartData = data.map(d => ({
    ...d,
    formattedDate: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Traffic Trend by Source"
          trendValue={trendPercentage}
          trendLabel="Traffic"
          trendPeriod="this period"
        />

        {/* Clickable legend chips above chart */}
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {activeSources.map(source => (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                hiddenSources.has(source)
                  ? "opacity-40 bg-muted"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: SOURCE_COLORS[source] }}
              />
              <span>{SOURCE_LABELS[source]}</span>
            </button>
          ))}
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              className="text-muted-foreground [&_.recharts-text]:text-xs"
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            >
              <defs>
                {activeSources.map(source => (
                  <linearGradient key={source} id={`gradient-traffic-${source}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SOURCE_COLORS[source]} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SOURCE_COLORS[source]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />

              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                padding={{ left: 10, right: 10 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => Number(value).toLocaleString()}
                width={40}
              />

              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(value) => Number(value).toLocaleString()}
                labelFormatter={(label) => String(label)}
                cursor={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />

              {activeSources.map(source => (
                <Area
                  key={`${source}-${animationId}`}
                  dataKey={source}
                  name={SOURCE_LABELS[source]}
                  stackId="1"
                  type="monotone"
                  stroke={SOURCE_COLORS[source]}
                  strokeWidth={2}
                  fill={`url(#gradient-traffic-${source})`}
                  hide={hiddenSources.has(source)}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                  activeDot={{
                    r: 5,
                    fill: 'hsl(var(--background))',
                    stroke: SOURCE_COLORS[source],
                    strokeWidth: 2,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Context summary footer */}
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {totalSessions.toLocaleString()} sessions across {activeSources.length} sources
        </p>
      </CardContent>
    </Card>
  );
});
