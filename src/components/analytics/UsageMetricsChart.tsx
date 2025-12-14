/**
 * UsageMetricsChart Component
 * 
 * Area chart displaying usage metrics over time.
 * Shows conversations, messages, and API calls trends.
 * @module components/analytics/UsageMetricsChart
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartLegendContent, ChartTooltipContent } from '@/components/charts/charts-base';
import { useBreakpoint } from '@/hooks/use-breakpoint';

interface UsageMetricsChartProps {
  data: Array<{
    date: string;
    conversations: number;
    messages: number;
    api_calls: number;
  }>;
}

export const UsageMetricsChart = ({ data }: UsageMetricsChartProps) => {
  const isDesktop = useBreakpoint('lg');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends</CardTitle>
        <CardDescription>Monitor platform usage over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              className="text-muted-foreground [&_.recharts-text]:text-xs"
              margin={{
                top: isDesktop ? 12 : 6,
                bottom: isDesktop ? 16 : 0,
                left: 0,
                right: 0,
              }}
            >
              <defs>
                <linearGradient id="gradientConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                vertical={false} 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.5}
              />

              <Legend
                align="right"
                verticalAlign="top"
                layout={isDesktop ? "vertical" : "horizontal"}
                content={<ChartLegendContent className="-translate-y-2" />}
              />

              <XAxis
                dataKey="date"
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
              />

              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(value) => Number(value).toLocaleString()}
                cursor={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  strokeDasharray: '4 4',
                }}
              />

              <Area
                isAnimationActive={false}
                dataKey="conversations"
                name="Conversations"
                type="monotone"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gradientConversations)"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive={false}
                dataKey="messages"
                name="Messages"
                type="monotone"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="none"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--chart-2))',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive={false}
                dataKey="api_calls"
                name="API Calls"
                type="monotone"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                fill="none"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--chart-3))',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
