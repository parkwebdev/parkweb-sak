/**
 * TrafficSourceChart Component
 * 
 * Radar chart showing traffic distribution by referrer source.
 * Displays organic, direct, social, and referral traffic.
 * @module components/analytics/TrafficSourceChart
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface TrafficSourceData {
  name: string;
  value: number;
  color?: string;
}

interface TrafficSourceChartProps {
  data: TrafficSourceData[];
  loading?: boolean;
}

export const TrafficSourceChart = React.memo(function TrafficSourceChart({ data, loading }: TrafficSourceChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || total === 0) {
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                className="capitalize"
              />
              <Radar
                name="Visitors"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
                dot={{
                  r: 4,
                  fill: 'hsl(var(--primary))',
                  fillOpacity: 1,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-lg">
                        <p className="font-medium capitalize">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.value} conversations ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
