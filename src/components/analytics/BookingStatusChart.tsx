/**
 * BookingStatusChart Component
 * 
 * Donut chart showing booking status distribution (completed, cancelled, no-show, etc.)
 * with a center label displaying the show rate percentage.
 * 
 * @module components/analytics/BookingStatusChart
 * @see docs/ANALYTICS_REDESIGN_PLAN.md - Phase 5b
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarCheck01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { BookingStatusChartProps, BookingStatus } from '@/types/analytics';

/**
 * Status-specific colors using design system tokens.
 */
const STATUS_COLORS: Record<BookingStatus, string> = {
  completed: 'hsl(var(--success))',
  confirmed: 'hsl(var(--primary))',
  cancelled: 'hsl(var(--destructive))',
  no_show: 'hsl(var(--muted-foreground))',
};

/**
 * Human-readable labels for booking statuses.
 */
const STATUS_LABELS: Record<BookingStatus, string> = {
  completed: 'Completed',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

/**
 * Renders a donut chart of booking status distribution.
 * Center displays the show rate (completed / total excluding pending).
 */
export const BookingStatusChart = React.memo(function BookingStatusChart({
  data,
  showRate,
  loading = false,
  className,
}: BookingStatusChartProps) {
  // Transform data for chart with colors
  const chartData = data.map(item => ({
    name: STATUS_LABELS[item.status],
    value: item.count,
    status: item.status,
    percentage: item.percentage,
    color: STATUS_COLORS[item.status],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Loading state
  if (loading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-base">Booking Status</CardTitle>
          <p className="text-xs text-muted-foreground">Appointment outcomes and show rate</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="relative" role="status" aria-label="Loading booking status">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
            <Skeleton className="absolute inset-[30%] rounded-full bg-card" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (chartData.length === 0 || total === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-base">Booking Status</CardTitle>
          <p className="text-xs text-muted-foreground">Appointment outcomes and show rate</p>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<CalendarCheck01 size={20} className="text-muted-foreground" />}
            title="No booking status data"
            description="Status breakdown will appear once bookings are recorded."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">Booking Status</CardTitle>
        <p className="text-xs text-muted-foreground">Appointment outcomes and show rate</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.value} bookings ({item.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label - Show Rate */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ top: '-10%' }}
            aria-label={`Show rate: ${showRate.toFixed(1)} percent`}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {showRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Show Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
