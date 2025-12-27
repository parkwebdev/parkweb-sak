/**
 * useBookingAnalytics Hook
 * 
 * Hook for fetching booking/appointment analytics from calendar_events table.
 * Provides total bookings, show rate, breakdowns by location and status, and trend data.
 * Uses React Query for caching and Supabase real-time for automatic updates.
 * 
 * @module hooks/useBookingAnalytics
 * @see src/types/analytics.ts
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { logger } from '@/utils/logger';
import { format, eachDayOfInterval } from 'date-fns';
import type {
  BookingStats,
  BookingStatus,
  LocationBookingData,
  BookingStatusData,
  BookingTrendData,
} from '@/types/analytics';

/** Raw calendar event from database query */
export interface RawCalendarEvent {
  id: string;
  title: string;
  status: BookingStatus | null;
  start_time: string;
  location_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  locations: {
    id: string;
    name: string;
  } | null;
}

/** Query key for booking analytics */
const BOOKING_ANALYTICS_KEY = ['analytics', 'bookings'] as const;

/**
 * Build query key for booking analytics with date range
 */
const buildQueryKey = (startDate: Date, endDate: Date, agentId: string | null) => [
  ...BOOKING_ANALYTICS_KEY,
  {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    agentId,
  },
] as const;

/**
 * Hook for fetching booking analytics data.
 * 
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns BookingStats data, loading state, and refetch function
 * 
 * @example
 * ```tsx
 * const { stats, loading, refetch } = useBookingAnalytics(startDate, endDate);
 * 
 * if (loading) return <Skeleton />;
 * 
 * return (
 *   <>
 *     <p>Total Bookings: {stats?.totalBookings}</p>
 *     <p>Show Rate: {stats?.showRate}%</p>
 *   </>
 * );
 * ```
 */
export const useBookingAnalytics = (startDate: Date, endDate: Date, enabled: boolean = true) => {
  const { user } = useAuth();
  const { agentId } = useAgent();
  const queryClient = useQueryClient();

  // Fetch connected account IDs for the user's agent
  const { data: connectedAccountIds = [] } = useSupabaseQuery<string[]>({
    queryKey: ['connected-accounts', 'ids', agentId],
    queryFn: async () => {
      if (!agentId || !user?.id) return [];

      const { data, error } = await supabase
        .from('connected_accounts')
        .select('id')
        .eq('agent_id', agentId)
        .eq('is_active', true);

      if (error) {
        logger.error('Error fetching connected accounts for analytics:', error);
        return [];
      }

      return (data || []).map((account) => account.id);
    },
    enabled: enabled && !!agentId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Main booking analytics query
  const {
    data: rawEvents = [],
    isLoading,
    refetch,
  } = useSupabaseQuery<RawCalendarEvent[]>({
    queryKey: buildQueryKey(startDate, endDate, agentId),
    queryFn: async () => {
      if (!agentId || !user?.id || connectedAccountIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          id,
          title,
          status,
          start_time,
          location_id,
          visitor_name,
          visitor_email,
          locations!fk_events_location (
            id,
            name
          )
        `)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .in('connected_account_id', connectedAccountIds);

      if (error) {
        logger.error('Error fetching booking analytics:', error);
        throw error;
      }

      return (data || []) as RawCalendarEvent[];
    },
    realtime: enabled && connectedAccountIds.length > 0 ? {
      table: 'calendar_events',
      // Realtime will update on any calendar event change
    } : undefined,
    enabled: enabled && !!agentId && !!user?.id && connectedAccountIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Compute derived statistics from raw events
  const stats: BookingStats | null = useMemo(() => {
    if (!rawEvents || rawEvents.length === 0) {
      // Return empty stats structure instead of null for consistent rendering
      return {
        totalBookings: 0,
        showRate: 0,
        byLocation: [],
        byStatus: [],
        trend: [],
      };
    }

    // Calculate totals by status
    const statusCounts: Record<BookingStatus, number> = {
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };

    const locationMap = new Map<string, LocationBookingData>();
    const trendMap = new Map<string, BookingTrendData>();

    // Initialize trend data for all days in range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    allDays.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      trendMap.set(dateKey, {
        date: dateKey,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        total: 0,
      });
    });

    // Process each event
    rawEvents.forEach((event) => {
      const status = event.status || 'confirmed';
      const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd');
      const locationId = event.location_id || 'unassigned';
      const locationName = event.locations?.name || 'Unassigned';

      // Update status counts
      if (status in statusCounts) {
        statusCounts[status]++;
      }

      // Update location data
      if (!locationMap.has(locationId)) {
        locationMap.set(locationId, {
          locationId,
          locationName,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
        });
      }
      const locationData = locationMap.get(locationId)!;
      locationData.bookings++;
      if (status === 'completed') locationData.completed++;
      if (status === 'cancelled') locationData.cancelled++;
      if (status === 'no_show') locationData.noShow++;

      // Update trend data
      const trendData = trendMap.get(dateKey);
      if (trendData) {
        trendData.total++;
        if (status === 'confirmed') trendData.confirmed++;
        if (status === 'completed') trendData.completed++;
        if (status === 'cancelled') trendData.cancelled++;
        if (status === 'no_show') trendData.noShow++;
      }
    });

    // Calculate totals
    const totalBookings = rawEvents.length;
    const completedOutcomes = statusCounts.completed + statusCounts.cancelled + statusCounts.no_show;
    const showRate = completedOutcomes > 0
      ? Math.round((statusCounts.completed / completedOutcomes) * 100)
      : 0;

    // Build status breakdown with percentages
    const byStatus: BookingStatusData[] = (Object.entries(statusCounts) as [BookingStatus, number][])
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0,
      }))
      .filter((item) => item.count > 0);

    // Sort locations by booking count descending
    const byLocation = Array.from(locationMap.values())
      .sort((a, b) => b.bookings - a.bookings);

    // Sort trend data by date ascending
    const trend = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalBookings,
      showRate,
      byLocation,
      byStatus,
      trend,
    };
  }, [rawEvents, startDate, endDate]);

  return {
    /** Computed booking statistics */
    stats,
    /** Whether data is currently loading */
    loading: isLoading,
    /** Manually trigger a refetch */
    refetch,
    /** Invalidate the cache (useful after mutations) */
    invalidate: () => queryClient.invalidateQueries({ queryKey: BOOKING_ANALYTICS_KEY }),
  };
};
