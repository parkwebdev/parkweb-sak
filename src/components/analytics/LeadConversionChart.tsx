/**
 * LeadConversionChart Component
 * 
 * Stacked area chart showing lead conversion funnel over time.
 * Dynamically renders areas based on user's lead stages.
 * @module components/analytics/LeadConversionChart
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { useLeadStages } from '@/hooks/useLeadStages';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { format, parseISO } from 'date-fns';
import { ChartCardHeader } from './ChartCardHeader';
import { cn } from '@/lib/utils';

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
  const { stages } = useLeadStages();
  const prefersReducedMotion = useReducedMotion();
  const [hiddenStages, setHiddenStages] = useState<Set<string>>(new Set());

  const toggleStage = (stageKey: string) => {
    setHiddenStages(prev => {
      const next = new Set(prev);
      if (next.has(stageKey)) {
        next.delete(stageKey);
      } else {
        next.add(stageKey);
      }
      return next;
    });
  };

  // Generate gradient definitions and areas based on actual stages with their custom colors
  const stageConfig = useMemo(() => {
    return stages.map((stage) => ({
      key: stage.name.toLowerCase(),
      name: stage.name,
      color: stage.color,
      gradientId: `gradient-lead-${stage.name.toLowerCase().replace(/\s+/g, '-')}`,
    }));
  }, [stages]);

  // Calculate totals for context summary
  const totalLeads = useMemo(() => {
    if (data.length === 0) return 0;
    const lastDay = data[data.length - 1];
    return lastDay?.total ?? 0;
  }, [data]);

  // Format data for chart
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: (() => {
        try {
          return format(parseISO(d.date), 'MMM d');
        } catch {
          return d.date;
        }
      })(),
    }));
  }, [data]);

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Lead Conversion Funnel"
          trendValue={trendValue}
          trendLabel="Leads"
          trendPeriod={trendPeriod}
        />

        {/* Clickable legend chips above chart */}
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {stageConfig.map((stage) => (
            <button
              key={stage.key}
              onClick={() => toggleStage(stage.key)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                hiddenStages.has(stage.key)
                  ? "opacity-40 bg-muted"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span>{stage.name}</span>
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
                {stageConfig.map((stage) => (
                  <linearGradient key={stage.gradientId} id={stage.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stage.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={stage.color} stopOpacity={0.05} />
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

              {stageConfig.map((stage) => (
                <Area
                  key={stage.key}
                  dataKey={stage.key}
                  name={stage.name}
                  stackId="1"
                  type="monotone"
                  stroke={stage.color}
                  strokeWidth={2}
                  fill={`url(#${stage.gradientId})`}
                  hide={hiddenStages.has(stage.key)}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                  activeDot={{
                    r: 5,
                    fill: 'hsl(var(--background))',
                    stroke: stage.color,
                    strokeWidth: 2,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Context summary footer */}
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {totalLeads.toLocaleString()} leads across {stages.length} stages
        </p>
      </CardContent>
    </Card>
  );
});
