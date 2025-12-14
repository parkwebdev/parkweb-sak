import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

/**
 * Hook for fetching website traffic analytics.
 * Analyzes conversation metadata to extract traffic sources, landing pages, and page visits.
 * 
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Object} Traffic analytics data
 * @returns {TrafficSourceData[]} trafficSources - Traffic by referrer source
 * @returns {LandingPageData[]} landingPages - Landing page performance
 * @returns {PageVisitData[]} pageVisits - All page visit data
 * @returns {boolean} loading - Loading state
 */

interface TrafficSourceData {
  name: string;
  value: number;
  color: string;
}

interface LandingPageData {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
  agentName?: string;
}

interface PageVisitData {
  url: string;
  totalVisits: number;
  totalDuration: number;
  agentName?: string;
}

interface TrafficStats {
  trafficSources: TrafficSourceData[];
  landingPages: LandingPageData[];
  pageVisits: PageVisitData[];
}

interface ReferrerJourney {
  referrer_url?: string | null;
  landing_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  entry_type?: string;
}

interface PageVisit {
  url: string;
  entered_at: string;
  duration_ms: number;
}

interface ConversationMetadata {
  referrer_journey?: ReferrerJourney;
  visited_pages?: PageVisit[];
  lead_id?: string;
}

export const useTrafficAnalytics = (
  startDate: Date,
  endDate: Date
) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TrafficStats>({
    trafficSources: [],
    landingPages: [],
    pageVisits: [],
  });
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch agents first
      const { data: agentsData } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', user.id);
      
      setAgents(agentsData || []);
      const agentMap: Record<string, string> = {};
      (agentsData || []).forEach(a => { agentMap[a.id] = a.name; });

      // Fetch conversations with metadata
      let query = supabase
        .from('conversations')
        .select('id, agent_id, metadata, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: conversations, error } = await query;

      if (error) {
        logger.error('Error fetching conversations for traffic analytics:', error);
        return;
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
        agentId?: string;
      }> = {};

      // Aggregate page visits
      const pageVisitMap: Record<string, { 
        totalVisits: number; 
        totalDuration: number;
        agentId?: string;
      }> = {};

      (conversations || []).forEach(conv => {
        const metadata = conv.metadata as ConversationMetadata | null;
        if (!metadata) return;

        // Traffic sources
        const journey = metadata.referrer_journey;
        if (journey?.entry_type) {
          const entryType = journey.entry_type.toLowerCase();
          if (sourceCounts.hasOwnProperty(entryType)) {
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
              agentId: conv.agent_id,
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
                agentId: conv.agent_id,
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
          agentName: data.agentId ? agentMap[data.agentId] : undefined,
        }))
        .sort((a, b) => b.visits - a.visits);

      const pageVisits: PageVisitData[] = Object.entries(pageVisitMap)
        .map(([url, data]) => ({
          url,
          totalVisits: data.totalVisits,
          totalDuration: data.totalDuration,
          agentName: data.agentId ? agentMap[data.agentId] : undefined,
        }))
        .sort((a, b) => b.totalVisits - a.totalVisits);

      setStats({
        trafficSources,
        landingPages,
        pageVisits,
      });
    } catch (error) {
      logger.error('Error in traffic analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, startDate.toISOString(), endDate.toISOString()]);

  const agentNames = useMemo(() => {
    const map: Record<string, string> = {};
    agents.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [agents]);

  return {
    ...stats,
    loading,
    agents,
    agentNames,
    refetch: fetchData,
  };
};
