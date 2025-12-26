/**
 * LeadConversionChart Component
 * 
 * Area chart showing lead conversion funnel over time.
 * Dynamically renders areas based on user's lead stages.
 * @module components/analytics/LeadConversionChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartLegendContent, ChartTooltipContent } from '@/components/charts/charts-base';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useLeadStages } from '@/hooks/useLeadStages';

interface LeadStageStats {
  date: string;
  total: number;
  [stageName: string]: number | string;
}

interface LeadConversionChartProps {
  data: LeadStageStats[];
}

// Chart colors for stages (maps to CSS variables)
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const LeadConversionChart = React.memo(function LeadConversionChart({ data }: LeadConversionChartProps) {
  const isDesktop = useBreakpoint('lg');
  const { stages } = useLeadStages();

  // Generate gradient definitions and areas based on actual stages
  const stageConfig = useMemo(() => {
    return stages.map((stage, index) => ({
      key: stage.name.toLowerCase(),
      name: stage.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
      gradientId: `fill${stage.name.replace(/\s+/g, '')}`,
    }));
  }, [stages]);

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
                {stageConfig.map((stage) => (
                  <linearGradient key={stage.gradientId} id={stage.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stage.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={stage.color} stopOpacity={0} />
                  </linearGradient>
                ))}
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

              {stageConfig.map((stage) => (
                <Area
                  key={stage.key}
                  isAnimationActive={false}
                  dataKey={stage.key}
                  name={stage.name}
                  stackId="1"
                  type="monotone"
                  stroke={stage.color}
                  strokeWidth={2}
                  fill={`url(#${stage.gradientId})`}
                  activeDot={{
                    r: 6,
                    fill: 'hsl(var(--background))',
                    stroke: stage.color,
                    strokeWidth: 2,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
