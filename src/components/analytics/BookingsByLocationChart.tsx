/**
 * BookingsByLocationChart Component
 * 
 * Horizontal bar chart displaying booking counts grouped by location.
 * Shows total bookings per location with hover tooltips for details.
 * 
 * @module components/analytics/BookingsByLocationChart
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkerPin01, Calendar } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { ChartCardHeader } from './ChartCardHeader';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { BookingsByLocationChartProps } from '@/types/analytics';

/**
 * Renders a horizontal bar chart of bookings grouped by location.
 * Includes loading skeleton, empty state, and accessible tooltips.
 */
export const BookingsByLocationChart = React.memo(function BookingsByLocationChart({
  data,
  loading = false,
  className,
  trendValue = 0,
  trendPeriod = 'this month',
}: BookingsByLocationChartProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.locationName,
    bookings: item.bookings,
    completed: item.completed,
    cancelled: item.cancelled,
    noShow: item.noShow,
  }));

  const total = chartData.reduce((sum, item) => sum + item.bookings, 0);

  // Context summary
  const locationCount = chartData.length;

  // Loading state
  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="space-y-4" role="status" aria-label="Loading bookings by location">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
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
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground mb-6">Bookings by Location</h3>
          <EmptyState
            icon={<MarkerPin01 size={20} className="text-muted-foreground" />}
            title="No booking locations connected"
            description="Connect a calendar to track bookings by location."
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
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Bookings by Location"
          trendValue={trendValue}
          trendLabel="Bookings"
          trendPeriod={trendPeriod}
          contextSummary={`Showing ${total.toLocaleString()} bookings across ${locationCount} location${locationCount !== 1 ? 's' : ''}`}
        />
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
                isAnimationActive={!prefersReducedMotion}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill="hsl(220, 90%, 56%)" 
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
