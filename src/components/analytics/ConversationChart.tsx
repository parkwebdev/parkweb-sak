/**
 * ConversationChart Component
 * 
 * Area chart showing conversation trends over time.
 * Displays total, active, and closed conversation counts.
 * @module components/analytics/ConversationChart
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { format, parseISO } from 'date-fns';
import { ChartCardHeader } from './ChartCardHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface ConversationChartProps {
  data: Array<{
    date: string;
    total: number;
    active: number;
    closed: number;
  }>;
  trendValue?: number;
  trendPeriod?: string;
}

export const ConversationChart = React.memo(function ConversationChart({ 
  data,
  trendValue = 0,
  trendPeriod = 'this month',
}: ConversationChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  
  // Calculate totals for context summary
  const totalConversations = useMemo(() => {
    return data.reduce((sum, d) => sum + d.total, 0);
  }, [data]);

  const toggleSeries = (series: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(series)) {
        next.delete(series);
      } else {
        next.add(series);
      }
      return next;
    });
  };

  const seriesConfig = [
    { key: 'active', label: 'Active', color: 'hsl(220, 90%, 56%)' },
    { key: 'closed', label: 'Closed', color: 'hsl(210, 100%, 80%)' },
  ];

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Conversation Volume"
          trendValue={trendValue}
          trendLabel="Conversations"
          trendPeriod={trendPeriod}
        />

        {/* Clickable legend chips above chart */}
        <div className="flex flex-wrap gap-2 mb-4">
          {seriesConfig.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all",
                hiddenSeries.has(key)
                  ? "opacity-40 bg-muted"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              className="text-muted-foreground [&_.recharts-text]:text-xs"
              margin={{
                top: 10,
                bottom: 10,
                left: -10,
                right: 10,
              }}
            >
              <defs>
                <linearGradient id="gradientActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220, 90%, 56%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(220, 90%, 56%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradientClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 100%, 80%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(210, 100%, 80%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>

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
                width={40}
              />

              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(value) => Number(value).toLocaleString()}
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
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />

              <Area
                isAnimationActive
                animationDuration={300}
                animationEasing="ease-out"
                dataKey="active"
                name="Active"
                stackId="1"
                type="monotone"
                stroke="hsl(220, 90%, 56%)"
                strokeWidth={2}
                fill="url(#gradientActive)"
                hide={hiddenSeries.has('active')}
                activeDot={{
                  r: 5,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(220, 90%, 56%)',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive
                animationDuration={300}
                animationEasing="ease-out"
                dataKey="closed"
                name="Closed"
                stackId="1"
                type="monotone"
                stroke="hsl(210, 100%, 80%)"
                strokeWidth={2}
                fill="url(#gradientClosed)"
                hide={hiddenSeries.has('closed')}
                activeDot={{
                  r: 5,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(210, 100%, 80%)',
                  strokeWidth: 2,
                }}
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Context summary footer */}
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {totalConversations.toLocaleString()} conversations over {data.length} days
        </p>
      </CardContent>
    </Card>
  );
});
