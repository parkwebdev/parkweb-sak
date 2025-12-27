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

  // Calculate totals for context summary and per-stage counts
  const { totalLeads, stageCounts } = useMemo(() => {
    if (data.length === 0) return { totalLeads: 0, stageCounts: {} as Record<string, number> };
    const lastDay = data[data.length - 1];
    const counts: Record<string, number> = {};
    
    stageConfig.forEach((stage) => {
      const value = lastDay?.[stage.key];
      counts[stage.key] = typeof value === 'number' ? value : 0;
    });
    
    return { 
      totalLeads: lastDay?.total ?? 0,
      stageCounts: counts,
    };
  }, [data, stageConfig]);

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Lead Conversion Funnel"
          trendValue={trendValue}
          trendPeriod={trendPeriod}
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
                    return format(date, 'MMM d');
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
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: stageConfig.find(s => s.name === name)?.color }}
                        />
                        <span>{name}</span>
                        <span className="font-medium ml-auto">{Number(value).toLocaleString()}</span>
                      </div>
                    )}
                  />
                }
                labelFormatter={(label) => {
                  try {
                    const date = parseISO(String(label));
                    return format(date, 'MMM d, yyyy');
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
        
        {/* Custom legend as chips below chart */}
        <div className="flex flex-col items-start gap-2 pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {totalLeads.toLocaleString()} leads across {stages.length} stages
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {stageConfig.map((stage) => (
              <div
                key={stage.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground border border-border"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                  aria-hidden="true"
                />
                {stage.name} ({stageCounts[stage.key]?.toLocaleString() ?? 0})
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});