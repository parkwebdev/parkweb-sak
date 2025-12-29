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

/** Engagement metrics */
export interface EngagementMetrics {
  bounceRate: number;
  avgPagesPerSession: number;
  avgSessionDuration: number;
  totalSessions: number;
  totalLeads: number;
  overallCVR: number;
}

/** Complete traffic analytics stats */
interface TrafficStats {
  trafficSources: TrafficSourceData[];
  landingPages: LandingPageData[];
  pageVisits: PageVisitData[];
  locationData: LocationData[];
  engagement: EngagementMetrics;
}

/** Default empty stats */
const DEFAULT_STATS: TrafficStats = {
  trafficSources: [],
  landingPages: [],
  pageVisits: [],
  locationData: [],
  engagement: {
    bounceRate: 0,
    avgPagesPerSession: 0,
    avgSessionDuration: 0,
    totalSessions: 0,
    totalLeads: 0,
    overallCVR: 0,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Process raw conversation data into traffic analytics.
 */
function processConversations(
  conversations: Array<{ id: string; metadata: unknown }> | null
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

  // Track session-level metrics for engagement
  let totalSessions = 0;
  let bounceSessions = 0;
  let totalPagesViewed = 0;
  let totalSessionDuration = 0;
  let totalLeads = 0;

  conversations.forEach(conv => {
    const metadata = conv.metadata as ConversationMetadata | null;
    if (!metadata) return;

    totalSessions++;

    // Traffic sources
    const journey = metadata.referrer_journey;
    if (journey?.entry_type) {
      const entryType = journey.entry_type.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(sourceCounts, entryType)) {
        sourceCounts[entryType]++;
      }
    } else {
      sourceCounts.direct++;
    }

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

    // Page visits & session metrics
    const visitedPages = metadata.visited_pages;
    const pagesInSession = visitedPages && Array.isArray(visitedPages) ? visitedPages.length : 0;
    
    // Bounce = only 1 page visited
    if (pagesInSession <= 1) {
      bounceSessions++;
    }
    
    totalPagesViewed += pagesInSession;

    if (visitedPages && Array.isArray(visitedPages)) {
      let sessionDuration = 0;
      visitedPages.forEach(visit => {
        if (!pageVisitMap[visit.url]) {
          pageVisitMap[visit.url] = { 
            totalVisits: 0, 
            totalDuration: 0,
          };
        }
        pageVisitMap[visit.url].totalVisits++;
        pageVisitMap[visit.url].totalDuration += visit.duration_ms || 0;
        sessionDuration += visit.duration_ms || 0;
        
        // Also add to landing page duration if it matches
        if (landingPageMap[visit.url]) {
          landingPageMap[visit.url].totalDuration += visit.duration_ms || 0;
        }
      });
      totalSessionDuration += sessionDuration;
    }

    // Count leads
    if (metadata.lead_id) {
      totalLeads++;
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

  // Calculate engagement metrics
  const engagement: EngagementMetrics = {
    bounceRate: totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0,
    avgPagesPerSession: totalSessions > 0 ? totalPagesViewed / totalSessions : 0,
    avgSessionDuration: totalSessions > 0 ? totalSessionDuration / totalSessions : 0,
    totalSessions,
    totalLeads,
    overallCVR: totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0,
  };

  return {
    trafficSources,
    landingPages,
    pageVisits,
    locationData,
    engagement,
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
        .select('id, metadata')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

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
    trafficSources: stats.trafficSources,
    landingPages: stats.landingPages,
    pageVisits: stats.pageVisits,
    locationData: stats.locationData,
    engagement: stats.engagement,
    loading: isLoading,
    agentId,
    refetch,
  };
};
