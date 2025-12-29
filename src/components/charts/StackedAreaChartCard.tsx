/**
 * StackedAreaChartCard Component
 * 
 * Reusable stacked area chart with toggle chips, grid, tooltip, and animation defaults.
 * Based on TrafficSourceTrendChart as the flagship model.
 * @module components/charts/StackedAreaChartCard
 */

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

export interface StackedAreaChartCardProps<T extends Record<string, unknown>> {
  /** Chart data array */
  data: T[];
  /** Key in data for x-axis labels (default: 'formattedDate') */
  dateKey?: string;
  /** Series configuration array */
  series: SeriesConfig[];
  /** Prefix for gradient IDs to avoid conflicts */
  gradientIdPrefix: string;
  /** Whether to show toggle chips (default: true) */
  showChips?: boolean;
  /** Optional className for the chart container */
  className?: string;
}

export const StackedAreaChartCard = React.memo(function StackedAreaChartCard<
  T extends Record<string, unknown>
>({
  data,
  dateKey = 'formattedDate',
  series,
  gradientIdPrefix,
  showChips = true,
  className,
}: StackedAreaChartCardProps<T>) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [animationId, setAnimationId] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const toggleSeries = (key: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setAnimationId(v => v + 1);
  };

  return (
    <>
      {/* Clickable legend chips above chart */}
      {showChips && (
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {series.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
      )}

      <div className={cn("h-[350px] w-full", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            className="text-muted-foreground [&_.recharts-text]:text-xs"
            margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
          >
            <defs>
              {series.map(({ key, color }) => (
                <linearGradient
                  key={key}
                  id={`gradient-${gradientIdPrefix}-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />

            <XAxis
              dataKey={dateKey}
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

            {series.map(({ key, label, color }) => (
              <Area
                key={`${key}-${animationId}`}
                dataKey={key}
                name={label}
                stackId="1"
                type="monotone"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${gradientIdPrefix}-${key})`}
                hide={hiddenSeries.has(key)}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={800}
                animationEasing="ease-out"
                activeDot={{
                  r: 5,
                  fill: 'hsl(var(--background))',
                  stroke: color,
                  strokeWidth: 2,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}) as <T extends Record<string, unknown>>(
  props: StackedAreaChartCardProps<T>
) => React.ReactElement;
