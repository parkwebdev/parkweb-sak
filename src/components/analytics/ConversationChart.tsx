/**
 * ConversationChart Component
 * 
 * Area chart showing conversation trends over time.
 * Displays total, active, and closed conversation counts.
 * @module components/analytics/ConversationChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { format, parseISO } from 'date-fns';
import { ChartCardHeader } from './ChartCardHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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
  
  // Calculate totals for context summary
  const totalConversations = useMemo(() => {
    return data.reduce((sum, d) => sum + d.total, 0);
  }, [data]);

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Conversation Volume"
          trendValue={trendValue}
          trendLabel="Conversations"
          trendPeriod={trendPeriod}
        />
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
                isAnimationActive={!prefersReducedMotion}
                animationDuration={800}
                animationEasing="ease-out"
                dataKey="active"
                name="Active"
                stackId="1"
                type="monotone"
                stroke="hsl(220, 90%, 56%)"
                strokeWidth={2}
                fill="url(#gradientActive)"
                activeDot={{
                  r: 5,
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(220, 90%, 56%)',
                  strokeWidth: 2,
                }}
              />

              <Area
                isAnimationActive={!prefersReducedMotion}
                animationDuration={800}
                animationEasing="ease-out"
                dataKey="closed"
                name="Closed"
                stackId="1"
                type="monotone"
                stroke="hsl(210, 100%, 80%)"
                strokeWidth={2}
                fill="url(#gradientClosed)"
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

        {/* Legend section with context summary above chips */}
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Showing {totalConversations.toLocaleString()} conversations over {data.length} days
          </p>
          <div className="flex flex-wrap gap-2 justify-start">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: 'hsl(220, 90%, 56%)' }}
              />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: 'hsl(210, 100%, 80%)' }}
              />
              <span className="text-xs text-muted-foreground">Closed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
