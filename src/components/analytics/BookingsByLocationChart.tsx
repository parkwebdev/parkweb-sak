/**
 * BookingsByLocationChart Component
 * 
 * Horizontal bar chart displaying booking counts grouped by location.
 * Shows total bookings per location with hover tooltips for details.
 * 
 * @module components/analytics/BookingsByLocationChart
 * @see docs/ANALYTICS_REDESIGN_PLAN.md - Phase 5a
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkerPin01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { BookingsByLocationChartProps } from '@/types/analytics';

/**
 * Renders a horizontal bar chart of bookings grouped by location.
 * Includes loading skeleton, empty state, and accessible tooltips.
 */
export const BookingsByLocationChart = React.memo(function BookingsByLocationChart({
  data,
  loading = false,
  className,
}: BookingsByLocationChartProps) {
  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.locationName,
    bookings: item.bookings,
    completed: item.completed,
    cancelled: item.cancelled,
    noShow: item.noShow,
  }));

  const total = chartData.reduce((sum, item) => sum + item.bookings, 0);

  // Loading state
  if (loading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Bookings by Location</CardTitle>
          <p className="text-xs text-muted-foreground">Appointments scheduled per location</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" role="status" aria-label="Loading bookings by location">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 flex-1" />
              </div>
            ))}
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
          <CardTitle className="text-sm font-semibold">Bookings by Location</CardTitle>
          <p className="text-xs text-muted-foreground">Appointments scheduled per location</p>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MarkerPin01 size={20} className="text-muted-foreground" />}
            title="No booking data available"
            description="Bookings will appear here once appointments are scheduled."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Bookings by Location</CardTitle>
          <p className="text-xs text-muted-foreground">Appointments scheduled per location</p>
        </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          <p>Total: <span className="font-medium text-foreground">{item.bookings}</span></p>
                          <p>Completed: <span className="text-success">{item.completed}</span></p>
                          <p>Cancelled: <span className="text-destructive">{item.cancelled}</span></p>
                          <p>No-show: <span className="text-muted-foreground">{item.noShow}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="bookings" 
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill="hsl(var(--primary))" 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
