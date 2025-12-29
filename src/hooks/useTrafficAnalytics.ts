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
import { format, parseISO } from 'date-fns';
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

/** Daily traffic source data for time-series charts */
export interface DailySourceData {
  date: string;
  direct: number;
  organic: number;
  paid: number;
  social: number;
  email: number;
  referral: number;
  total: number;
}

/** Page depth distribution data */
export interface PageDepthData {
  depth: string;
  count: number;
  percentage: number;
}

/** Complete traffic analytics stats */
interface TrafficStats {
  trafficSources: TrafficSourceData[];
  landingPages: LandingPageData[];
  pageVisits: PageVisitData[];
  locationData: LocationData[];
  engagement: EngagementMetrics;
  sourcesByDate: DailySourceData[];
  pageDepthDistribution: PageDepthData[];
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
  sourcesByDate: [],
  pageDepthDistribution: [],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Process raw conversation data into traffic analytics.
 */
function processConversations(
  conversations: Array<{ id: string; metadata: unknown; created_at: string }> | null
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

  // Daily source breakdown for time-series
  const dailySourceMap: Record<string, Record<string, number>> = {};

  // Page depth tracking
  const pageDepthCounts: Record<number, number> = {};

  conversations.forEach(conv => {
    const metadata = conv.metadata as ConversationMetadata | null;
    if (!metadata) return;

    totalSessions++;

    // Get date for daily breakdown
    const dateKey = format(parseISO(conv.created_at), 'yyyy-MM-dd');
    if (!dailySourceMap[dateKey]) {
      dailySourceMap[dateKey] = { direct: 0, organic: 0, paid: 0, social: 0, email: 0, referral: 0 };
    }

    // Traffic sources
    const journey = metadata.referrer_journey;
    let entryType = 'direct';
    if (journey?.entry_type) {
      entryType = journey.entry_type.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(sourceCounts, entryType)) {
        sourceCounts[entryType]++;
        dailySourceMap[dateKey][entryType]++;
      }
    } else {
      sourceCounts.direct++;
      dailySourceMap[dateKey].direct++;
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
    
    // Track page depth distribution
    const depthBucket = pagesInSession === 0 ? 0 : pagesInSession >= 5 ? 5 : pagesInSession;
    pageDepthCounts[depthBucket] = (pageDepthCounts[depthBucket] || 0) + 1;
    
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

  // Build sourcesByDate array sorted by date
  const sourcesByDate: DailySourceData[] = Object.entries(dailySourceMap)
    .map(([date, sources]) => ({
      date,
      direct: sources.direct || 0,
      organic: sources.organic || 0,
      paid: sources.paid || 0,
      social: sources.social || 0,
      email: sources.email || 0,
      referral: sources.referral || 0,
      total: Object.values(sources).reduce((sum, v) => sum + v, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build page depth distribution
  const depthLabels: Record<number, string> = {
    0: '0 pages',
    1: '1 page',
    2: '2 pages',
    3: '3 pages',
    4: '4 pages',
    5: '5+ pages',
  };
  const pageDepthDistribution: PageDepthData[] = [0, 1, 2, 3, 4, 5]
    .map(depth => ({
      depth: depthLabels[depth],
      count: pageDepthCounts[depth] || 0,
      percentage: totalSessions > 0 ? ((pageDepthCounts[depth] || 0) / totalSessions) * 100 : 0,
    }))
    .filter(d => d.count > 0);

  return {
    trafficSources,
    landingPages,
    pageVisits,
    locationData,
    engagement,
    sourcesByDate,
    pageDepthDistribution,
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
        .select('id, metadata, created_at')
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
    sourcesByDate: stats.sourcesByDate,
    pageDepthDistribution: stats.pageDepthDistribution,
    loading: isLoading,
    agentId,
    refetch,
  };
};
