import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

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

export const useAnalytics = (days: number = 30) => {
  const [conversationStats, setConversationStats] = useState<ConversationStats[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const fetchConversationStats = async () => {
    if (!currentOrg) return;

    try {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('created_at, status')
        .eq('org_id', currentOrg.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

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
    } catch (error: any) {
      console.error('Error fetching conversation stats:', error);
    }
  };

  const fetchLeadStats = async () => {
    if (!currentOrg) return;

    try {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('leads')
        .select('created_at, status')
        .eq('org_id', currentOrg.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

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
    } catch (error: any) {
      console.error('Error fetching lead stats:', error);
    }
  };

  const fetchAgentPerformance = async () => {
    if (!currentOrg) return;

    try {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name')
        .eq('org_id', currentOrg.id);

      if (agentsError) throw agentsError;

      const performance: AgentPerformance[] = [];

      for (const agent of agents || []) {
        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id)
          .eq('org_id', currentOrg.id);

        performance.push({
          agent_id: agent.id,
          agent_name: agent.name,
          total_conversations: count || 0,
          avg_response_time: Math.random() * 60, // Placeholder
          satisfaction_score: 4 + Math.random(), // Placeholder
        });
      }

      setAgentPerformance(performance);
    } catch (error: any) {
      console.error('Error fetching agent performance:', error);
    }
  };

  const fetchUsageMetrics = async () => {
    if (!currentOrg) return;

    try {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('org_id', currentOrg.id)
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: true });

      if (error) throw error;

      const metrics = data?.map((metric) => ({
        date: format(new Date(metric.period_start), 'yyyy-MM-dd'),
        conversations: metric.conversations_count || 0,
        messages: metric.messages_count || 0,
        api_calls: metric.api_calls_count || 0,
      })) || [];

      setUsageMetrics(metrics);
    } catch (error: any) {
      console.error('Error fetching usage metrics:', error);
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
    } catch (error: any) {
      toast({
        title: 'Error fetching analytics',
        description: error.message,
        variant: 'destructive',
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
          filter: `org_id=eq.${currentOrg?.id}`,
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
          filter: `org_id=eq.${currentOrg?.id}`,
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
  }, [currentOrg?.id, days]);

  return {
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    loading,
    refetch: fetchAllData,
  };
};
