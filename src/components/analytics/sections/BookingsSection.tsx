/**
 * BookingsSection Component
 * 
 * Analytics section displaying booking metrics including:
 * - Total bookings KPI card with sparkline
 * - Bookings by location chart
 * - Booking trend chart
 * 
 * @module components/analytics/sections/BookingsSection
 */

import { MetricCardWithChart } from '@/components/analytics/MetricCardWithChart';
import { BookingsByLocationChart } from '@/components/analytics/BookingsByLocationChart';
import { BookingTrendChart } from '@/components/analytics/BookingTrendChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { LocationBookingData, BookingTrendData } from '@/types/analytics';

interface BookingsSectionProps {
  /** Total number of bookings */
  totalBookings: number;
  /** Booking trend data for sparkline */
  bookingChartData: { value: number }[];
  /** Change value for bookings KPI */
  bookingChange: number;
  /** Bookings by location data */
  bookingsByLocation: LocationBookingData[];
  /** Booking trend data for trend chart */
  bookingTrendData: BookingTrendData[];
  /** Trend value for booking trend chart */
  bookingTrendValue: number;
  /** Loading state */
  bookingLoading: boolean;
}

export function BookingsSection({
  totalBookings,
  bookingChartData,
  bookingChange,
  bookingsByLocation,
  bookingTrendData,
  bookingTrendValue,
  bookingLoading,
}: BookingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards - 2 column grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        <MetricCardWithChart 
          title={totalBookings.toLocaleString()} 
          subtitle="Total Bookings" 
          description="Appointments scheduled via Ari" 
          change={bookingChange} 
          changeType="percentage" 
          changeLabel="vs last period" 
          chartData={bookingChartData} 
          animationDelay={0} 
        />
        <BookingsByLocationChart 
          data={bookingsByLocation} 
          loading={bookingLoading}
          animationDelay={0.05}
        />
      </div>
      
      {/* Trend chart - full width */}
      <AnimatedList staggerDelay={0.1}>
        <AnimatedItem>
          <ErrorBoundary
            fallback={(error) => (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Booking trend chart failed to load</p>
                <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}
          >
            <BookingTrendChart 
              data={bookingTrendData} 
              loading={bookingLoading}
              trendValue={bookingTrendValue}
              trendPeriod="this month"
            />
          </ErrorBoundary>
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
