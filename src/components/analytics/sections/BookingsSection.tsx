/**
 * BookingsSection Component
 * 
 * Booking analytics with location and status breakdowns.
 */

import React from 'react';
import { BookingsByLocationChart } from '@/components/analytics/BookingsByLocationChart';
import { BookingStatusChart } from '@/components/analytics/BookingStatusChart';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import type { BookingStats, BookingStatusData } from '@/types/analytics';

interface BookingsSectionProps {
  bookingStats: BookingStats | null;
  totalBookings: number;
  bookingTrend: { value: number }[];
  calculatePeriodChange: (trend: number[]) => number;
  loading?: boolean;
}

export function BookingsSection({
  bookingStats,
  totalBookings,
  bookingTrend,
  calculatePeriodChange,
  loading = false,
}: BookingsSectionProps) {
  const trendValues = bookingTrend.map(d => d.value);
  const showRate = bookingStats?.showRate ?? 0;
  const completedCount = bookingStats?.byStatus?.find(s => s.status === 'completed')?.count ?? 0;

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading booking data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <MetricCardWithChart
          title={totalBookings.toLocaleString()}
          subtitle="Total Bookings"
          description="Appointments scheduled via Ari"
          change={calculatePeriodChange(trendValues)}
          changeType="percentage"
          changeLabel="vs last period"
          chartData={bookingTrend}
          animationDelay={0}
        />
        <MetricCardWithChart
          title={completedCount.toLocaleString()}
          subtitle="Completed"
          description="Successfully attended appointments"
          change={0}
          changeType="percentage"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.05}
        />
        <MetricCardWithChart
          title={`${showRate.toFixed(0)}%`}
          subtitle="Show Rate"
          description="Appointments actually attended"
          change={0}
          changeType="points"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.1}
        />
      </div>

      {/* Charts Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Booking Breakdown
        </h3>
        <AnimatedList className="grid grid-cols-1 lg:grid-cols-2 gap-6" staggerDelay={0.1}>
          <AnimatedItem>
            <BookingsByLocationChart 
              data={bookingStats?.byLocation ?? []} 
              loading={loading}
            />
          </AnimatedItem>
          <AnimatedItem>
            <BookingStatusChart 
              data={bookingStats?.byStatus ?? []} 
              showRate={showRate}
              loading={loading}
            />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
