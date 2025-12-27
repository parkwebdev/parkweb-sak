/**
 * TrafficSourceChart Component
 * 
 * Stacked area chart showing traffic distribution by referrer source over time.
 * Displays organic, direct, social, paid, email, and referral traffic.
 * @module components/analytics/TrafficSourceChart
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartLegendContent, ChartTooltipContent } from '@/components/charts/charts-base';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrafficSourceTimeSeriesData } from '@/hooks/useTrafficAnalytics';

interface TrafficSourceChartProps {
  data: TrafficSourceTimeSeriesData[];
  loading?: boolean;
}

// Traffic source configuration with colors and labels
const TRAFFIC_SOURCES = [
  { key: 'direct', label: 'Direct', color: 'hsl(var(--chart-1))' },
  { key: 'organic', label: 'Organic', color: 'hsl(var(--chart-2))' },
  { key: 'paid', label: 'Paid', color: 'hsl(var(--chart-3))' },
  { key: 'social', label: 'Social', color: 'hsl(var(--chart-4))' },
  { key: 'email', label: 'Email', color: 'hsl(var(--chart-5))' },
  { key: 'referral', label: 'Referral', color: 'hsl(var(--primary))' },
] as const;

export const TrafficSourceChart = React.memo(function TrafficSourceChart({ 
  data, 
  loading 
}: TrafficSourceChartProps) {
  const hasData = data.length > 0 && data.some(d => 
    d.direct > 0 || d.organic > 0 || d.paid > 0 || d.social > 0 || d.email > 0 || d.referral > 0
  );

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No traffic data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
        <p className="text-sm text-muted-foreground">Where your visitors come from</p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {TRAFFIC_SOURCES.map(source => (
                  <linearGradient key={source.key} id={`gradient-${source.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={source.color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={source.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.5}
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={(value: Date) => value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                padding={{ left: 10, right: 10 }}
              />

              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => value.toLocaleString()}
                width={40}
              />

              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(value: Date) => value.toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                cursor={{
                  stroke: 'hsl(var(--muted-foreground))',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />

              <Legend
                content={<ChartLegendContent align="center" />}
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 16 }}
              />

              {TRAFFIC_SOURCES.map(source => (
                <Area
                  key={source.key}
                  type="monotone"
                  dataKey={source.key}
                  name={source.label}
                  stackId="traffic"
                  stroke={source.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${source.key})`}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
