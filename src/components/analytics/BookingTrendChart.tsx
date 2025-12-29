/**
 * BookingTrendChart Component
 * 
 * Stacked area chart showing daily booking trends by status.
 * Displays total, completed, cancelled, and no-show bookings over time.
 * Supports switching between stacked (all statuses) and total only views.
 * 
 * @module components/analytics/BookingTrendChart
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
import { StackedAreaChartCard, SeriesConfig } from '@/components/charts/StackedAreaChartCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type ViewMode = 'all-statuses' | 'total-only';

/** Color configuration for booking statuses */
const STATUS_COLORS: Record<string, string> = {
  completed: 'hsl(220, 90%, 56%)',
  confirmed: 'hsl(210, 100%, 80%)',
  cancelled: 'hsl(220, 70%, 70%)',
  noShow: 'hsl(210, 60%, 88%)',
  total: 'hsl(220, 90%, 56%)',
};

/** Status configuration for series */
const STATUS_CONFIG: SeriesConfig[] = [
  { key: 'completed', label: 'Completed', color: STATUS_COLORS.completed },
  { key: 'confirmed', label: 'Confirmed', color: STATUS_COLORS.confirmed },
  { key: 'cancelled', label: 'Cancelled', color: STATUS_COLORS.cancelled },
  { key: 'noShow', label: 'No-show', color: STATUS_COLORS.noShow },
];

export const BookingTrendChart = React.memo(function BookingTrendChart({
  data,
  loading = false,
  trendValue = 0,
  trendPeriod = 'this month',
  className,
}: BookingTrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all-statuses');
  const prefersReducedMotion = useReducedMotion();

  // Calculate totals for context summary
  const totalBookings = useMemo(() => {
    return data.reduce((sum, d) => sum + d.total, 0);
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
          rightSlot={
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">All Statuses</SelectItem>
                <SelectItem value="total-only">Total Only</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {viewMode === 'all-statuses' ? (
          <StackedAreaChartCard
            data={chartData}
            series={STATUS_CONFIG}
            gradientIdPrefix="booking"
          />
        ) : (
          // Total-only view: simple single area (no chips)
          <div className="h-[350px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                className="text-muted-foreground [&_.recharts-text]:text-xs"
                margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="gradient-booking-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={STATUS_COLORS.total} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={STATUS_COLORS.total} stopOpacity={0.05} />
                  </linearGradient>
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

                <Area
                  dataKey="total"
                  name="Total"
                  type="monotone"
                  stroke={STATUS_COLORS.total}
                  strokeWidth={2}
                  fill="url(#gradient-booking-total)"
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                  activeDot={{
                    r: 5,
                    fill: 'hsl(var(--background))',
                    stroke: STATUS_COLORS.total,
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Context summary footer */}
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {totalBookings.toLocaleString()} bookings over {data.length} days
        </p>
      </CardContent>
    </Card>
  );
});
