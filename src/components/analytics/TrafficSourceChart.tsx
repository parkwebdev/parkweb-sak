/**
 * TrafficSourceChart Component
 * 
 * Pie chart showing traffic distribution by referrer source.
 * Displays organic, direct, social, and referral traffic.
 * @module components/analytics/TrafficSourceChart
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TrafficSourceData {
  name: string;
  value: number;
  color: string;
}

interface TrafficSourceChartProps {
  data: TrafficSourceData[];
  loading?: boolean;
}

const TRAFFIC_COLORS: Record<string, string> = {
  direct: 'hsl(var(--muted-foreground))',
  organic: 'hsl(var(--success))',
  paid: 'hsl(var(--warning))',
  social: 'hsl(var(--info))',
  email: 'hsl(var(--primary))',
  referral: 'hsl(var(--accent-foreground))',
};

export const TrafficSourceChart = React.memo(function TrafficSourceChart({ data, loading }: TrafficSourceChartProps) {
  const chartData = data.map(item => ({
    ...item,
    color: TRAFFIC_COLORS[item.name.toLowerCase()] || 'hsl(var(--muted-foreground))',
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <span 
            className="text-muted-foreground text-sm"
            role="status"
            aria-live="polite"
          >
            Loading...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No traffic data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
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
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-sm capitalize">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
