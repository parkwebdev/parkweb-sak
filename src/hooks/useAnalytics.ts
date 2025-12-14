import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

interface ConversationStats {
  date: string;
  total: number;
  active: number;
  closed: number;
}

interface LeadStats {
  date: string;
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
}

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

/**
 * Hook for fetching analytics data with date range and filters.
 * Provides conversation stats, lead stats, agent performance, and usage metrics.
 * Subscribes to real-time updates for conversations and leads.
 * 
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {AnalyticsFilters} filters - Filter by agent, lead status, conversation status
 * @returns {Object} Analytics data and state
 * @returns {ConversationStats[]} conversationStats - Daily conversation statistics
 * @returns {LeadStats[]} leadStats - Daily lead statistics by status
 * @returns {AgentPerformance[]} agentPerformance - Per-agent performance metrics
 * @returns {UsageMetrics[]} usageMetrics - Daily usage metrics
 * @returns {any[]} conversations - Raw conversation data for tables
 * @returns {any[]} leads - Raw lead data for tables
 * @returns {boolean} loading - Loading state
 * @returns {Function} refetch - Manually refresh all analytics
 */
export const useAnalytics = (
  startDate: Date,
  endDate: Date,
  filters: AnalyticsFilters
) => {
  const [conversationStats, setConversationStats] = useState<ConversationStats[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics[]>([]);
  const [conversations, setConversations] = useState<unknown[]>([]);
  const [leads, setLeads] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

      // Group by date
      const statsByDate: { [key: string]: ConversationStats } = {};
      
      data?.forEach((conv) => {
        const date = format(new Date(conv.created_at), 'yyyy-MM-dd');
        if (!statsByDate[date]) {
          statsByDate[date] = { date, total: 0, active: 0, closed: 0 };
        }
        statsByDate[date].total++;
        if (conv.status === 'active') statsByDate[date].active++;
        if (conv.status === 'closed') statsByDate[date].closed++;
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
      let query = supabase
        .from('leads')
        .select('created_at, status, name, email, company')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filters.leadStatus !== 'all') {
        query = query.eq('status', filters.leadStatus as 'new' | 'contacted' | 'qualified' | 'converted');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Set raw leads for data table
      setLeads(data || []);

      // Group by date
      const statsByDate: { [key: string]: LeadStats } = {};
      
      data?.forEach((lead) => {
        const date = format(new Date(lead.created_at), 'yyyy-MM-dd');
        if (!statsByDate[date]) {
          statsByDate[date] = { 
            date, 
            total: 0, 
            new: 0, 
            contacted: 0, 
            qualified: 0, 
            converted: 0 
          };
        }
        statsByDate[date].total++;
        if (lead.status === 'new') statsByDate[date].new++;
        if (lead.status === 'contacted') statsByDate[date].contacted++;
        if (lead.status === 'qualified') statsByDate[date].qualified++;
        if (lead.status === 'converted') statsByDate[date].converted++;
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
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', user.id);

      if (agentsError) throw agentsError;

      const performance: AgentPerformance[] = [];

      for (const agent of agents || []) {

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

        performance.push({
          agent_id: agent.id,
          agent_name: agent.name,
          total_conversations: count || 0,
          avg_response_time: avgResponseTime,
          satisfaction_score: satisfactionScore,
        });
      }

      setAgentPerformance(performance);
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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchConversationStats(),
        fetchLeadStats(),
        fetchAgentPerformance(),
        fetchUsageMetrics(),
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
    fetchAllData();

    // Subscribe to real-time updates
    const conversationsChannel = supabase
      .channel('analytics-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchConversationStats();
        }
      )
      .subscribe();

    const leadsChannel = supabase
      .channel('analytics-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchLeadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [user?.id, startDate, endDate, filters]);

  return {
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    conversations,
    leads,
    loading,
    refetch: fetchAllData,
  };
};
