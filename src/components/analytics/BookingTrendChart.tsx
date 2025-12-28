/**
 * BookingTrendChart Component
 * 
 * Stacked area chart showing daily booking trends by status.
 * Displays total, completed, cancelled, and no-show bookings over time.
 * Supports switching between stacked (all statuses) and total only views.
 * 
 * @module components/analytics/BookingTrendChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { format, parseISO } from 'date-fns';
import { ChartCardHeader } from './ChartCardHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { BookingTrendData } from '@/types/analytics';

interface BookingTrendChartProps {
  /** Daily booking trend data */
  data: BookingTrendData[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Trend percentage value */
  trendValue?: number;
  /** Period for trend comparison */
  trendPeriod?: string;
  /** Optional CSS class name */
  className?: string;
}



/** Color configuration matching ConversationChart blue palette */
const TREND_COLORS = {
  completed: 'hsl(220, 90%, 56%)',      // Primary blue (same as Active in ConversationChart)
  confirmed: 'hsl(210, 100%, 80%)',     // Light blue (same as Closed in ConversationChart)
  cancelled: 'hsl(220, 70%, 70%)',      // Medium blue
  noShow: 'hsl(210, 60%, 88%)',         // Pale blue
  total: 'hsl(220, 90%, 56%)',          // Primary blue for total view
};

/**
 * Renders a stacked area chart of booking trends over time.
 * Includes loading skeleton, empty state, and accessible tooltips.
 */
export const BookingTrendChart = React.memo(function BookingTrendChart({
  data,
  loading = false,
  trendValue = 0,
  trendPeriod = 'this month',
  className,
}: BookingTrendChartProps) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate totals for context summary
  const totalBookings = useMemo(() => {
    return data.reduce((sum, d) => sum + d.total, 0);
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="pt-6">
          <div className="space-y-4" role="status" aria-label="Loading booking trends">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-[350px] w-full" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (data.length === 0 || totalBookings === 0) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground mb-6">Booking Trends</h3>
          <EmptyState
            icon={<Calendar size={20} className="text-muted-foreground" />}
            title="No booking data yet"
            description="Connect a calendar to start tracking booking trends."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/ari?section=locations">
                  <Calendar size={16} className="mr-2" />
                  Connect Calendar
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Booking Trends"
          trendValue={trendValue}
          trendLabel="Bookings"
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
                <linearGradient id="gradientConfirmed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_COLORS.confirmed} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={TREND_COLORS.confirmed} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_COLORS.completed} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={TREND_COLORS.completed} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradientCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_COLORS.cancelled} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TREND_COLORS.cancelled} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradientNoShow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_COLORS.noShow} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TREND_COLORS.noShow} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_COLORS.total} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={TREND_COLORS.total} stopOpacity={0.05} />
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
                    dataKey="completed"
                    name="Completed"
                    stackId="1"
                    type="monotone"
                    stroke={TREND_COLORS.completed}
                    strokeWidth={2}
                    fill="url(#gradientCompleted)"
                    activeDot={{
                      r: 5,
                      fill: 'hsl(var(--background))',
                      stroke: TREND_COLORS.completed,
                      strokeWidth: 2,
                    }}
                  />

                  <Area
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                    animationEasing="ease-out"
                    dataKey="confirmed"
                    name="Confirmed"
                    stackId="1"
                    type="monotone"
                    stroke={TREND_COLORS.confirmed}
                    strokeWidth={2}
                    fill="url(#gradientConfirmed)"
                    activeDot={{
                      r: 5,
                      fill: 'hsl(var(--background))',
                      stroke: TREND_COLORS.confirmed,
                      strokeWidth: 2,
                    }}
                  />

                  <Area
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                    animationEasing="ease-out"
                    dataKey="cancelled"
                    name="Cancelled"
                    stackId="1"
                    type="monotone"
                    stroke={TREND_COLORS.cancelled}
                    strokeWidth={2}
                    fill="url(#gradientCancelled)"
                    activeDot={{
                      r: 5,
                      fill: 'hsl(var(--background))',
                      stroke: TREND_COLORS.cancelled,
                      strokeWidth: 2,
                    }}
                  />

                  <Area
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                    animationEasing="ease-out"
                    dataKey="noShow"
                    name="No-show"
                    stackId="1"
                    type="monotone"
                    stroke={TREND_COLORS.noShow}
                    strokeWidth={2}
                    fill="url(#gradientNoShow)"
                    activeDot={{
                      r: 5,
                      fill: 'hsl(var(--background))',
                      stroke: TREND_COLORS.noShow,
                      strokeWidth: 2,
                    }}
                  />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend section with context summary */}
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Showing {totalBookings.toLocaleString()} bookings over {data.length} days
          </p>
          <div className="flex flex-wrap gap-2 justify-start">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: TREND_COLORS.completed }}
              />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: TREND_COLORS.confirmed }}
              />
              <span className="text-xs text-muted-foreground">Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: TREND_COLORS.cancelled }}
              />
              <span className="text-xs text-muted-foreground">Cancelled</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span 
                className="h-2 w-2 rounded-full shrink-0" 
                style={{ backgroundColor: TREND_COLORS.noShow }}
              />
              <span className="text-xs text-muted-foreground">No-show</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});