/**
 * useTrafficAnalytics Hook
 * 
 * Hook for fetching website traffic analytics.
 * Analyzes conversation metadata to extract traffic sources, landing pages, and page visits.
 * Uses React Query for caching and Supabase real-time for automatic updates.
 * 
 * @module hooks/useTrafficAnalytics
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/utils/logger';
import { getCountryCoordinates } from '@/lib/country-coordinates';
import type { ConversationMetadata } from '@/types/metadata';

// =============================================================================
// TYPES
// =============================================================================

/** Traffic source data for pie/donut charts */
export interface TrafficSourceData {
  name: string;
  value: number;
  color: string;
}

/** Time-series data for traffic sources stacked area chart */
export interface TrafficSourceTimeSeriesData {
  date: Date;
  direct: number;
  organic: number;
  paid: number;
  social: number;
  email: number;
  referral: number;
}

/** Landing page performance data */
export interface LandingPageData {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
}

/** Page visit aggregation data */
export interface PageVisitData {
  url: string;
  totalVisits: number;
  totalDuration: number;
}

/** Location data with coordinates for map visualization */
export interface LocationData {
  country: string;
  city?: string;
  lat: number;
  lng: number;
  count: number;
}

/** Complete traffic analytics stats */
interface TrafficStats {
  trafficSources: TrafficSourceData[];
  trafficSourceTimeSeries: TrafficSourceTimeSeriesData[];
  landingPages: LandingPageData[];
  pageVisits: PageVisitData[];
  locationData: LocationData[];
}

/** Default empty stats */
const DEFAULT_STATS: TrafficStats = {
  trafficSources: [],
  trafficSourceTimeSeries: [],
  landingPages: [],
  pageVisits: [],
  locationData: [],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Process raw conversation data into traffic analytics.
 */
function processConversations(
  conversations: Array<{ id: string; created_at: string; metadata: unknown }> | null
): TrafficStats {
  if (!conversations || conversations.length === 0) {
    return DEFAULT_STATS;
  }

  // Aggregate traffic sources
  const sourceCounts: Record<string, number> = {
    direct: 0,
    organic: 0,
    paid: 0,
    social: 0,
    email: 0,
    referral: 0,
  };

  // Time-series aggregation by date
  const timeSeriesMap: Record<string, Record<string, number>> = {};

  // Aggregate landing pages
  const landingPageMap: Record<string, { 
    visits: number; 
    totalDuration: number; 
    conversions: number;
  }> = {};

  // Aggregate page visits
  const pageVisitMap: Record<string, { 
    totalVisits: number; 
    totalDuration: number;
  }> = {};

  // Aggregate locations by country
  const locationMap: Record<string, { count: number; city?: string }> = {};

  conversations.forEach(conv => {
    const metadata = conv.metadata as ConversationMetadata | null;
    if (!metadata) return;

    // Get date key for time series (YYYY-MM-DD)
    const dateKey = conv.created_at.split('T')[0];

    // Initialize time series entry for this date
    if (!timeSeriesMap[dateKey]) {
      timeSeriesMap[dateKey] = {
        direct: 0,
        organic: 0,
        paid: 0,
        social: 0,
        email: 0,
        referral: 0,
      };
    }

    // Traffic sources
    const journey = metadata.referrer_journey;
    let entryType = 'direct';
    if (journey?.entry_type) {
      entryType = journey.entry_type.toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(sourceCounts, entryType)) {
        entryType = 'direct';
      }
    }
    sourceCounts[entryType]++;
    timeSeriesMap[dateKey][entryType]++;

    // Landing pages
    const landingPage = journey?.landing_page;
    if (landingPage) {
      if (!landingPageMap[landingPage]) {
        landingPageMap[landingPage] = { 
          visits: 0, 
          totalDuration: 0, 
          conversions: 0,
        };
      }
      landingPageMap[landingPage].visits++;
      if (metadata.lead_id) {
        landingPageMap[landingPage].conversions++;
      }
    }

    // Page visits
    const visitedPages = metadata.visited_pages;
    if (visitedPages && Array.isArray(visitedPages)) {
      visitedPages.forEach(visit => {
        if (!pageVisitMap[visit.url]) {
          pageVisitMap[visit.url] = { 
            totalVisits: 0, 
            totalDuration: 0,
          };
        }
        pageVisitMap[visit.url].totalVisits++;
        pageVisitMap[visit.url].totalDuration += visit.duration_ms || 0;
        
        // Also add to landing page duration if it matches
        if (landingPageMap[visit.url]) {
          landingPageMap[visit.url].totalDuration += visit.duration_ms || 0;
        }
      });
    }

    // Location data
    const country = metadata.country;
    if (country) {
      if (!locationMap[country]) {
        locationMap[country] = { count: 0, city: metadata.city };
      }
      locationMap[country].count++;
    }
  });

  // Convert to arrays
  const trafficSources: TrafficSourceData[] = Object.entries(sourceCounts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value, color: '' }));

  // Convert time series map to sorted array
  const trafficSourceTimeSeries: TrafficSourceTimeSeriesData[] = Object.entries(timeSeriesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, counts]) => ({
      date: new Date(dateStr),
      direct: counts.direct,
      organic: counts.organic,
      paid: counts.paid,
      social: counts.social,
      email: counts.email,
      referral: counts.referral,
    }));

  const landingPages: LandingPageData[] = Object.entries(landingPageMap)
    .map(([url, data]) => ({
      url,
      visits: data.visits,
      avgDuration: data.visits > 0 ? Math.round(data.totalDuration / data.visits) : 0,
      conversions: data.conversions,
    }))
    .sort((a, b) => b.visits - a.visits);

  const pageVisits: PageVisitData[] = Object.entries(pageVisitMap)
    .map(([url, data]) => ({
      url,
      totalVisits: data.totalVisits,
      totalDuration: data.totalDuration,
    }))
    .sort((a, b) => b.totalVisits - a.totalVisits);

  // Convert location map to array with coordinates
  const locationData: LocationData[] = Object.entries(locationMap)
    .map(([country, data]): LocationData | null => {
      const coords = getCountryCoordinates(country);
      if (!coords) return null;
      return {
        country,
        city: data.city,
        lat: coords.lat,
        lng: coords.lng,
        count: data.count,
      };
    })
    .filter((loc): loc is LocationData => loc !== null)
    .sort((a, b) => b.count - a.count);

  return {
    trafficSources,
    trafficSourceTimeSeries,
    landingPages,
    pageVisits,
    locationData,
  };
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching website traffic analytics.
 * 
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param enabled - Whether to fetch data (default: true)
 * @returns Traffic analytics data, loading state, and refetch function
 * 
 * @example
 * ```tsx
 * const { trafficSources, landingPages, loading } = useTrafficAnalytics(
 *   startDate,
 *   endDate
 * );
 * ```
 */
export const useTrafficAnalytics = (
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
) => {
  const { user } = useAuth();
  const { agentId } = useAgent();
  const queryClient = useQueryClient();

  // Fetch conversations with metadata
  const { data: conversations, isLoading, refetch } = useSupabaseQuery({
    queryKey: queryKeys.trafficAnalytics.data({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('conversations')
        .select('id, created_at, metadata')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching conversations for traffic analytics:', error);
        throw error;
      }

      return data;
    },
    realtime: user ? {
      table: 'conversations',
      filter: `user_id=eq.${user.id}`,
    } : undefined,
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process conversations into traffic stats
  const stats = useMemo(() => {
    if (!conversations) return DEFAULT_STATS;
    return processConversations(conversations);
  }, [conversations]);

  return {
    ...stats,
    loading: isLoading,
    agentId,
    refetch,
  };
};
