/**
 * useAnalytics Hook
 * 
 * Core analytics hook for fetching conversation and lead statistics.
 * Provides daily aggregated data for conversations, leads by stage,
 * and now includes trend data for new KPI sparklines (bookings, satisfaction, containment).
 * 
 * @module hooks/useAnalytics
 * @see src/types/analytics.ts
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { format, eachDayOfInterval } from 'date-fns';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import type { SparklineDataPoint } from '@/types/analytics';

interface ConversationStats {
  date: string;
  total: number;
  active: number;
  closed: number;
  human_takeover: number;
}

/** 
 * Dynamic lead stats by stage.
 * Keys are lowercase stage names (e.g., 'new', 'contacted', 'qualified').
 */
export interface LeadStageStats {
  date: string;
  total: number;
  /** Dynamic stage counts - keys are lowercase stage names */
  [stageName: string]: number | string;
}

/** Stage metadata for chart rendering */
export interface StageInfo {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

/** Single-agent performance metrics */
interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  total_conversations: number;
  avg_response_time: number;
  satisfaction_score: number;
}

interface UsageMetrics {
  date: string;
  conversations: number;
  messages: number;
  api_calls: number;
}

interface AnalyticsFilters {
  leadStatus: string;
  conversationStatus: string;
}

/** Booking trend data for sparklines */
interface BookingTrendPoint {
  date: string;
  value: number;
}

/** Satisfaction trend data for sparklines */
interface SatisfactionTrendPoint {
  date: string;
  value: number;
}

/** Containment rate trend data for sparklines */
interface ContainmentTrendPoint {
  date: string;
  value: number;
}

/**
 * Hook for fetching analytics data with date range and filters.
 * Provides conversation stats, lead stats by stage, agent performance, and usage metrics.
 * Subscribes to real-time updates for conversations and leads.
 * 
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {AnalyticsFilters} filters - Filter by lead stage, conversation status
 * @returns {Object} Analytics data and state
 * @returns {ConversationStats[]} conversationStats - Daily conversation statistics
 * @returns {LeadStageStats[]} leadStats - Daily lead statistics by stage
 * @returns {StageInfo[]} stageInfo - Stage metadata for chart colors
 * @returns {AgentPerformance | null} agentPerformance - Ari performance metrics
 * @returns {UsageMetrics[]} usageMetrics - Daily usage metrics
 * @returns {SparklineDataPoint[]} bookingTrend - Daily booking totals for sparkline
 * @returns {SparklineDataPoint[]} satisfactionTrend - Daily avg satisfaction for sparkline
 * @returns {SparklineDataPoint[]} containmentTrend - Daily containment rate for sparkline
 * @returns {any[]} conversations - Raw conversation data for tables
 * @returns {any[]} leads - Raw lead data for tables
 * @returns {boolean} loading - Loading state
 * @returns {Function} refetch - Manually refresh all analytics
 */
export const useAnalytics = (
  startDate: Date,
  endDate: Date,
  filters: AnalyticsFilters,
  enabled: boolean = true
) => {
  const [conversationStats, setConversationStats] = useState<ConversationStats[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStageStats[]>([]);
  const [stageInfo, setStageInfo] = useState<StageInfo[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics[]>([]);
  const [bookingTrendData, setBookingTrendData] = useState<BookingTrendPoint[]>([]);
  const [satisfactionTrendData, setSatisfactionTrendData] = useState<SatisfactionTrendPoint[]>([]);
  const [containmentTrendData, setContainmentTrendData] = useState<ContainmentTrendPoint[]>([]);
  const [conversations, setConversations] = useState<unknown[]>([]);
  const [leads, setLeads] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { agentId } = useAgent();

  const fetchConversationStats = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('conversations')
        .select('created_at, status, agent_id, metadata')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filters.conversationStatus !== 'all') {
        query = query.eq('status', filters.conversationStatus as 'active' | 'closed' | 'human_takeover');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Set raw conversations for data table
      setConversations(data || []);

      // Group by date with human_takeover tracking
      const statsByDate: { [key: string]: ConversationStats } = {};
      
      data?.forEach((conv) => {
        const date = format(new Date(conv.created_at), 'yyyy-MM-dd');
        if (!statsByDate[date]) {
          statsByDate[date] = { date, total: 0, active: 0, closed: 0, human_takeover: 0 };
        }
        statsByDate[date].total++;
        if (conv.status === 'active') statsByDate[date].active++;
        if (conv.status === 'closed') statsByDate[date].closed++;
        if (conv.status === 'human_takeover') statsByDate[date].human_takeover++;
      });

      setConversationStats(Object.values(statsByDate).sort((a, b) => 
        a.date.localeCompare(b.date)
      ));
    } catch (error: unknown) {
      logger.error('Error fetching conversation stats:', error);
    }
  };

  const fetchLeadStats = async () => {
    if (!user) return;

    try {
      // First, fetch the user's lead stages
      const { data: stages, error: stagesError } = await supabase
        .from('lead_stages')
        .select('id, name, color, order_index')
        .order('order_index', { ascending: true });

      if (stagesError) throw stagesError;

      // Store stage info for chart rendering
      setStageInfo(stages || []);

      // Build the query with stage info
      let query = supabase
        .from('leads')
        .select('created_at, stage_id, name, email, company')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Filter by stage if specified
      if (filters.leadStatus !== 'all') {
        // Find stage ID by name
        const targetStage = stages?.find(s => 
          s.name.toLowerCase() === filters.leadStatus.toLowerCase()
        );
        if (targetStage) {
          query = query.eq('stage_id', targetStage.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Set raw leads for data table
      setLeads(data || []);

      // Create a map of stage_id to stage name
      const stageNameMap = new Map<string, string>();
      stages?.forEach(stage => {
        stageNameMap.set(stage.id, stage.name);
      });

      // Group by date with dynamic stage keys
      const statsByDate: { [key: string]: LeadStageStats } = {};
      
      data?.forEach((lead) => {
        const date = format(new Date(lead.created_at), 'yyyy-MM-dd');
        if (!statsByDate[date]) {
          const baseStats: LeadStageStats = { date, total: 0 };
          // Initialize all stage counts to 0
          stages?.forEach(stage => {
            baseStats[stage.name.toLowerCase()] = 0;
          });
          statsByDate[date] = baseStats;
        }
        statsByDate[date].total++;
        
        // Increment the appropriate stage count
        if (lead.stage_id) {
          const stageName = stageNameMap.get(lead.stage_id);
          if (stageName) {
            const key = stageName.toLowerCase();
            statsByDate[date][key] = (statsByDate[date][key] as number || 0) + 1;
          }
        }
      });

      setLeadStats(Object.values(statsByDate).sort((a, b) => 
        a.date.localeCompare(b.date)
      ));
    } catch (error: unknown) {
      logger.error('Error fetching lead stats:', error);
    }
  };

  const fetchAgentPerformance = async () => {
    if (!user) return;

    try {
      // Single agent model: fetch only the user's Ari agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (agentError) {
        // No agent found is okay
        if (agentError.code !== 'PGRST116') throw agentError;
        setAgentPerformance([]);
        return;
      }

      if (!agent) {
        setAgentPerformance([]);
        return;
      }

      // Get conversation count
      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get conversations with messages to calculate response time
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', agent.id)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      let avgResponseTime = 0;
      if (convos && convos.length > 0) {
        // Fetch messages for these conversations to calculate response times
        const { data: messages } = await supabase
          .from('messages')
          .select('conversation_id, role, created_at')
          .in('conversation_id', convos.map(c => c.id))
          .order('created_at', { ascending: true });

        if (messages && messages.length > 0) {
          // Group messages by conversation
          const msgsByConvo = new Map<string, { role: string; created_at: string }[]>();
          messages.forEach((msg) => {
            if (!msgsByConvo.has(msg.conversation_id)) {
              msgsByConvo.set(msg.conversation_id, []);
            }
            msgsByConvo.get(msg.conversation_id)!.push(msg);
          });

          // Calculate response times (time between user message and next assistant message)
          let totalResponseTime = 0;
          let responseCount = 0;

          msgsByConvo.forEach((msgs) => {
            for (let i = 0; i < msgs.length - 1; i++) {
              if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
                const userTime = new Date(msgs[i].created_at).getTime();
                const assistantTime = new Date(msgs[i + 1].created_at).getTime();
                const diffSeconds = (assistantTime - userTime) / 1000;
                // Only count reasonable response times (under 5 minutes)
                if (diffSeconds > 0 && diffSeconds < 300) {
                  totalResponseTime += diffSeconds;
                  responseCount++;
                }
              }
            }
          });

          avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
        }
      }

      // Get satisfaction scores from conversation_ratings
      const { data: ratings } = await supabase
        .from('conversation_ratings')
        .select('rating, conversation_id')
        .in('conversation_id', (convos || []).map(c => c.id));

      let satisfactionScore = 0;
      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        satisfactionScore = Math.round(avgRating * 10) / 10; // Round to 1 decimal
      }

      // Return single agent as array for backwards compatibility
      setAgentPerformance([{
        agent_id: agent.id,
        agent_name: agent.name,
        total_conversations: count || 0,
        avg_response_time: avgResponseTime,
        satisfaction_score: satisfactionScore,
      }]);
    } catch (error: unknown) {
      logger.error('Error fetching agent performance:', error);
    }
  };

  const fetchUsageMetrics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_start', startDate.toISOString())
        .lte('period_end', endDate.toISOString())
        .order('period_start', { ascending: true });

      if (error) throw error;

      const metrics = data?.map((metric) => ({
        date: format(new Date(metric.period_start), 'yyyy-MM-dd'),
        conversations: metric.conversations_count || 0,
        messages: metric.messages_count || 0,
        api_calls: metric.api_calls_count || 0,
      })) || [];

      setUsageMetrics(metrics);
    } catch (error: unknown) {
      logger.error('Error fetching usage metrics:', error);
    }
  };

  /**
   * Fetch booking trend data for sparkline KPI card.
   * Groups calendar_events by date and counts totals.
   */
  const fetchBookingTrend = async () => {
    if (!user || !agentId) {
      setBookingTrendData([]);
      return;
    }

    try {
      // Get connected account IDs for the agent
      const { data: accounts, error: accountsError } = await supabase
        .from('connected_accounts')
        .select('id')
        .eq('agent_id', agentId)
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      if (!accounts || accounts.length === 0) {
        setBookingTrendData([]);
        return;
      }

      const accountIds = accounts.map((a) => a.id);

      // Fetch calendar events
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('start_time')
        .in('connected_account_id', accountIds)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (eventsError) throw eventsError;

      // Initialize all days in range
      const trendMap = new Map<string, number>();
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      allDays.forEach((day) => {
        trendMap.set(format(day, 'yyyy-MM-dd'), 0);
      });

      // Count bookings per day
      (events || []).forEach((event) => {
        const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd');
        trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setBookingTrendData(trend);
    } catch (error: unknown) {
      logger.error('Error fetching booking trend:', error);
      setBookingTrendData([]);
    }
  };

  /**
   * Fetch satisfaction trend data for sparkline KPI card.
   * Groups conversation_ratings by date and calculates daily average.
   */
  const fetchSatisfactionTrend = async () => {
    if (!user) {
      setSatisfactionTrendData([]);
      return;
    }

    try {
      // Get conversation IDs for the user in date range
      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (convosError) throw convosError;

      if (!convos || convos.length === 0) {
        setSatisfactionTrendData([]);
        return;
      }

      const convoIds = convos.map((c) => c.id);

      // Fetch ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('conversation_ratings')
        .select('rating, created_at')
        .in('conversation_id', convoIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ratingsError) throw ratingsError;

      // Initialize all days in range
      const trendMap = new Map<string, { sum: number; count: number }>();
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      allDays.forEach((day) => {
        trendMap.set(format(day, 'yyyy-MM-dd'), { sum: 0, count: 0 });
      });

      // Aggregate ratings per day
      (ratings || []).forEach((r) => {
        const dateKey = format(new Date(r.created_at), 'yyyy-MM-dd');
        const dayData = trendMap.get(dateKey);
        if (dayData) {
          dayData.sum += r.rating;
          dayData.count++;
        }
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, { sum, count }]) => ({
          date,
          value: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setSatisfactionTrendData(trend);
    } catch (error: unknown) {
      logger.error('Error fetching satisfaction trend:', error);
      setSatisfactionTrendData([]);
    }
  };

  /**
   * Fetch containment rate trend data for sparkline KPI card.
   * Groups conversations by date and calculates daily containment rate.
   */
  const fetchContainmentTrend = async () => {
    if (!user) {
      setContainmentTrendData([]);
      return;
    }

    try {
      // Fetch conversations with status
      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (convosError) throw convosError;

      if (!convos || convos.length === 0) {
        setContainmentTrendData([]);
        return;
      }

      // Initialize all days in range
      const trendMap = new Map<string, { total: number; humanTakeover: number }>();
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      allDays.forEach((day) => {
        trendMap.set(format(day, 'yyyy-MM-dd'), { total: 0, humanTakeover: 0 });
      });

      // Count conversations per day
      convos.forEach((c) => {
        const dateKey = format(new Date(c.created_at), 'yyyy-MM-dd');
        const dayData = trendMap.get(dateKey);
        if (dayData) {
          dayData.total++;
          if (c.status === 'human_takeover') {
            dayData.humanTakeover++;
          }
        }
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, { total, humanTakeover }]) => ({
          date,
          value: total > 0 ? Math.round(((total - humanTakeover) / total) * 100) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setContainmentTrendData(trend);
    } catch (error: unknown) {
      logger.error('Error fetching containment trend:', error);
      setContainmentTrendData([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchConversationStats(),
        fetchLeadStats(),
        fetchAgentPerformance(),
        fetchUsageMetrics(),
        fetchBookingTrend(),
        fetchSatisfactionTrend(),
        fetchContainmentTrend(),
      ]);
    } catch (error: unknown) {
      toast.error('Error fetching analytics', {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip all fetching when disabled or no user (prevents channel leaks)
    if (!enabled || !user?.id) {
      setLoading(false);
      return;
    }

    fetchAllData();

    // Subscribe to real-time updates with user-scoped channel names
    const conversationsChannel = supabase
      .channel(`analytics-conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchConversationStats();
          fetchContainmentTrend();
        }
      )
      .subscribe();

    const leadsChannel = supabase
      .channel(`analytics-leads-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchLeadStats();
        }
      )
      .subscribe();

    // Note: conversation_ratings doesn't have direct user_id column
    // Using user-scoped channel name to prevent cross-user channel collisions
    const ratingsChannel = supabase
      .channel(`analytics-ratings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_ratings',
        },
        () => {
          fetchSatisfactionTrend();
        }
      )
      .subscribe();

    // Note: calendar_events uses connected_account_id, not user_id directly
    // Using user-scoped channel name to prevent cross-user channel collisions
    const eventsChannel = supabase
      .channel(`analytics-calendar-events-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        () => {
          fetchBookingTrend();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(ratingsChannel);
      supabase.removeChannel(eventsChannel);
    };
  // IMPORTANT: Use primitive filter values as dependencies, NOT the filters object.
  // Passing the object directly causes infinite re-renders when callers pass inline object literals.
  }, [enabled, user?.id, agentId, startDate, endDate, filters.leadStatus, filters.conversationStatus]);

  // Transform trend data to SparklineDataPoint format for compatibility
  const bookingTrend: SparklineDataPoint[] = useMemo(() => 
    bookingTrendData.map((d) => ({ date: d.date, value: d.value })),
    [bookingTrendData]
  );

  const satisfactionTrend: SparklineDataPoint[] = useMemo(() => 
    satisfactionTrendData.map((d) => ({ date: d.date, value: d.value })),
    [satisfactionTrendData]
  );

  const containmentTrend: SparklineDataPoint[] = useMemo(() => 
    containmentTrendData.map((d) => ({ date: d.date, value: d.value })),
    [containmentTrendData]
  );

  return {
    // Existing data
    conversationStats,
    leadStats,
    stageInfo,
    agentPerformance,
    usageMetrics,
    conversations,
    leads,
    loading,
    refetch: fetchAllData,
    
    // New trend data for sparkline KPIs
    bookingTrend,
    satisfactionTrend,
    containmentTrend,
  };
};
