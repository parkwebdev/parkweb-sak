/**
 * LeadConversionChart Component
 * 
 * Area chart showing lead conversion funnel over time.
 * Dynamically renders areas based on user's lead stages.
 * @module components/analytics/LeadConversionChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartLegendContent, ChartTooltipContent } from '@/components/charts/charts-base';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useLeadStages } from '@/hooks/useLeadStages';
import { format, parseISO } from 'date-fns';
import { ChartCardHeader } from './ChartCardHeader';

interface LeadStageStats {
  date: string;
  total: number;
  [stageName: string]: number | string;
}

interface LeadConversionChartProps {
  data: LeadStageStats[];
  trendValue?: number;
  trendPeriod?: string;
}

export const LeadConversionChart = React.memo(function LeadConversionChart({ 
  data,
  trendValue = 0,
  trendPeriod = 'this month',
}: LeadConversionChartProps) {
  const isDesktop = useBreakpoint('lg');
  const { stages } = useLeadStages();

  // Generate gradient definitions and areas based on actual stages with their custom colors
  const stageConfig = useMemo(() => {
    return stages.map((stage) => ({
      key: stage.name.toLowerCase(),
      name: stage.name,
      color: stage.color,
      gradientId: `fill${stage.name.replace(/\s+/g, '')}`,
    }));
  }, [stages]);

  // Calculate totals for context summary
  const totalLeads = useMemo(() => {
    if (data.length === 0) return 0;
    const lastDay = data[data.length - 1];
    return lastDay?.total ?? 0;
  }, [data]);

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Lead Conversion Funnel"
          trendValue={trendValue}
          trendPeriod={trendPeriod}
          contextSummary={`Showing ${totalLeads.toLocaleString()} leads across ${stages.length} stages`}
        />
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
                tickFormatter={(value) => {
                  try {
                    const date = parseISO(value);
                    return format(date, 'MMM d'); // e.g., "Jan 15"
                  } catch {
                    return value;
                  }
                }}
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
                labelFormatter={(label) => {
                  try {
                    const date = parseISO(String(label));
                    return format(date, 'MMM d, yyyy'); // e.g., "Jan 15, 2025"
                  } catch {
                    return String(label);
                  }
                }}
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
