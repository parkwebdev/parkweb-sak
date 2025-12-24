/**
 * LeadConversionChart Component
 * 
 * Area chart showing lead conversion funnel over time.
 * Visualizes lead status progression through the pipeline.
 * @module components/analytics/LeadConversionChart
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartLegendContent, ChartTooltipContent } from '@/components/charts/charts-base';
import { useBreakpoint } from '@/hooks/use-breakpoint';

interface LeadConversionChartProps {
  data: Array<{
    date: string;
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  }>;
}

export const LeadConversionChart = React.memo(function LeadConversionChart({ data }: LeadConversionChartProps) {
  const isDesktop = useBreakpoint('lg');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Conversion Funnel</CardTitle>
        <CardDescription>Track leads through the conversion pipeline</CardDescription>
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
                <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillContacted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
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
                content={<ChartLegendContent className="-translate-y-2" reversed />}
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
                dataKey="new"
                name="New"
                stackId="1"
                type="monotone"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#fillNew)"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--chart-1))',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive={false}
                dataKey="contacted"
                name="Contacted"
                stackId="1"
                type="monotone"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="url(#fillContacted)"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--chart-2))',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive={false}
                dataKey="qualified"
                name="Qualified"
                stackId="1"
                type="monotone"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                fill="url(#fillQualified)"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--chart-3))',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive={false}
                dataKey="converted"
                name="Converted"
                stackId="1"
                type="monotone"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                fill="url(#fillConverted)"
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--chart-4))',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
