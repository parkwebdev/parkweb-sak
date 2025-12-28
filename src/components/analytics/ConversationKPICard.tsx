/**
 * ConversationKPICard Component
 * 
 * Displays a big KPI metric with sparkline chart for conversations.
 * Shows total conversations, average per day, and trend indicator.
 * 
 * @module components/analytics/ConversationKPICard
 */

import React, { useId, useMemo } from 'react';
import { TrendUp01, TrendDown01 } from '@untitledui/icons';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { Skeleton } from '@/components/ui/skeleton';

export interface ConversationKPICardProps {
  /** Total conversation count */
  total: number;
  /** Average conversations per day */
  avgPerDay: number;
  /** Trend percentage value (positive = up, negative = down) */
  trendValue: number;
  /** Period for trend comparison */
  trendPeriod?: string;
  /** Sparkline chart data */
  chartData: { date: string; value: number }[];
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * KPI card with sparkline for conversation metrics.
 * Styled to match MetricCardWithChart pattern.
 */
export const ConversationKPICard = React.memo(function ConversationKPICard({
  total,
  avgPerDay,
  trendValue,
  trendPeriod = 'vs last period',
  chartData,
  loading = false,
  className,
}: ConversationKPICardProps) {
  const id = useId();
  const prefersReducedMotion = useReducedMotion();
  const isPositive = trendValue >= 0;

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springs.smooth,
    },
  }), []);

  const reducedVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  }), []);

  const strokeColor = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  // Transform data for recharts
  const formattedChartData = useMemo(() => 
    chartData.map(d => ({ value: d.value })),
    [chartData]
  );

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-muted/50 border border-border p-4', className)}>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  return (
    <motion.div 
      className={cn(
        'flex flex-col justify-between overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border',
        className
      )}
      variants={prefersReducedMotion ? reducedVariants : cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Subtitle + Description in outer wrapper */}
      <div className="px-4 pt-3 pb-2 md:px-5">
        <h3 className="text-sm font-semibold text-foreground">Total Conversations</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Avg {avgPerDay.toFixed(1)} per day
        </p>
      </div>

      {/* Inner card with metric, trend, chart */}
      <div className="relative flex flex-col gap-4 rounded-t-xl bg-card px-4 py-5 shadow-sm border-t border-border md:gap-5 md:px-5">
        {/* Metric Value + Trend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {total.toLocaleString()}
            </p>
            <motion.div 
              className="flex flex-col gap-0.5"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, ...springs.smooth }}
            >
              <div className={cn(
                'flex items-center gap-0.5',
                isPositive ? 'text-success' : 'text-destructive'
              )}>
                {isPositive ? (
                  <TrendUp01 className="h-4 w-4" />
                ) : (
                  <TrendDown01 className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(trendValue).toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{trendPeriod}</span>
            </motion.div>
          </div>
        </div>

        {/* Sparkline Chart */}
        <ResponsiveContainer width="100%" height={56}>
          <AreaChart
            data={formattedChartData}
            margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.5} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              isAnimationActive={!prefersReducedMotion}
              animationDuration={800}
              animationEasing="ease-out"
              dataKey="value"
              type="monotone"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#gradient-${id})`}
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});
