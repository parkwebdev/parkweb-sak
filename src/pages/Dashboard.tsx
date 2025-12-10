import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Cube01 as Bot } from '@untitledui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { ConversationsDataTable, ConversationRow } from '@/components/dashboard/ConversationsDataTable';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/utils/logger';

interface ConversationWithAgent {
  id: string;
  status: 'active' | 'human_takeover' | 'closed';
  created_at: string;
  updated_at: string;
  agent_id: string;
  agents: { name: string } | null;
  leads: { name: string | null } | null;
  messages: { id: string }[];
}

interface TabConfig {
  id: string;
  label: string;
  count?: number;
}

const baseTabs: TabConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'human_takeover', label: 'Human' },
  { id: 'closed', label: 'Closed' },
];

// Generate chart data from daily counts
const generateChartData = (dailyCounts: number[]): { value: number }[] => {
  return dailyCounts.map((count) => ({ value: count }));
};

// Format duration from created_at
const formatDuration = (createdAt: string): string => {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
};

export const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const [conversations, setConversations] = useState<ConversationWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    avgMessages: 0,
    conversionRate: 0,
    conversationTrend: [] as number[],
    activeTrend: [] as number[],
    messageTrend: [] as number[],
    conversionTrend: [] as number[],
  });

  const fetchData = useCallback(async (showLoading = true) => {
    if (!user) return;

    if (showLoading) setLoading(true);
    try {
      // Calculate date range for last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Fetch all conversations (for current stats) and historical (for trends)
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          agent_id,
          agents!inner(name),
          messages(id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      // Fetch leads separately to get names
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, status, conversation_id, created_at')
        .eq('user_id', user.id);

      // Map leads to conversations
      const leadsMap = new Map(
        (leadsData || []).map((lead) => [lead.conversation_id, lead])
      );

      const conversationsWithLeads = (conversationsData || []).map((conv) => ({
        ...conv,
        leads: leadsMap.get(conv.id) || null,
      })) as ConversationWithAgent[];

      setConversations(conversationsWithLeads);

      // Calculate current stats
      const total = conversationsWithLeads.length;
      const active = conversationsWithLeads.filter((c) => c.status === 'active').length;
      const totalMessages = conversationsWithLeads.reduce(
        (sum, c) => sum + (c.messages?.length || 0),
        0
      );
      const avgMsgs = total > 0 ? Math.round(totalMessages / total) : 0;

      const totalLeads = leadsData?.length || 0;
      const convertedLeads = leadsData?.filter((l) => l.status === 'converted').length || 0;
      const convRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Calculate real 7-day trends
      const convTrend: number[] = [];
      const activeTrend: number[] = [];
      const msgTrend: number[] = [];
      const rateTrend: number[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Filter conversations created on or before this date
        const convsUpToDate = conversationsWithLeads.filter((c) => {
          const convDate = new Date(c.created_at).toISOString().split('T')[0];
          return convDate <= dateStr;
        });

        // Conversations created on this specific date (for daily count)
        const convsOnDate = conversationsWithLeads.filter((c) => {
          const convDate = new Date(c.created_at).toISOString().split('T')[0];
          return convDate === dateStr;
        });

        // Daily conversation count
        convTrend.push(convsOnDate.length);

        // Active conversations on this date (created before and still active OR created that day)
        const activeOnDate = convsUpToDate.filter((c) => c.status === 'active').length;
        activeTrend.push(activeOnDate);

        // Average messages for conversations up to this date
        const msgsUpToDate = convsUpToDate.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
        const avgMsgsOnDate = convsUpToDate.length > 0 ? Math.round(msgsUpToDate / convsUpToDate.length) : 0;
        msgTrend.push(avgMsgsOnDate);

        // Conversion rate up to this date
        const leadsUpToDate = (leadsData || []).filter((l) => {
          const leadDate = new Date(l.created_at).toISOString().split('T')[0];
          return leadDate <= dateStr;
        });
        const convertedUpToDate = leadsUpToDate.filter((l) => l.status === 'converted').length;
        const rateOnDate = leadsUpToDate.length > 0 ? Math.round((convertedUpToDate / leadsUpToDate.length) * 100) : 0;
        rateTrend.push(rateOnDate);
      }

      setStats({
        totalConversations: total,
        activeConversations: active,
        avgMessages: avgMsgs,
        conversionRate: convRate,
        conversationTrend: convTrend,
        activeTrend: activeTrend,
        messageTrend: msgTrend,
        conversionTrend: rateTrend,
      });
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading, fetchData]);

  // Debounced refetch to prevent rapid-fire updates on dashboard
  const debouncedFetchRef = useRef<NodeJS.Timeout>();
  
  const debouncedFetch = useCallback(() => {
    if (debouncedFetchRef.current) {
      clearTimeout(debouncedFetchRef.current);
    }
    debouncedFetchRef.current = setTimeout(() => {
      fetchData(false);
    }, 300); // 300ms debounce to batch rapid updates
  }, [fetchData]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, []);

  // Real-time subscription for conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        debouncedFetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, debouncedFetch]);

  // Filter conversations based on selected tab
  const filteredConversations = useMemo(() => {
    if (selectedTab === 'all') return conversations;
    return conversations.filter((c) => c.status === selectedTab);
  }, [conversations, selectedTab]);

  // Transform to table rows
  const tableData: ConversationRow[] = useMemo(() => {
    const total = filteredConversations.length;
    return filteredConversations.map((conv) => ({
      id: conv.id,
      agentName: conv.agents?.name || 'Unknown Agent',
      leadName: conv.leads?.name || undefined,
      messageCount: conv.messages?.length || 0,
      duration: formatDuration(conv.created_at),
      percentageOfTotal: total > 0 ? ((conv.messages?.length || 0) / Math.max(1, conversations.reduce((s, c) => s + (c.messages?.length || 0), 0))) * 100 : 0,
      status: conv.status,
      createdAt: conv.created_at,
    }));
  }, [filteredConversations, conversations]);

  // Update tab counts
  const tabsWithCounts: TabConfig[] = useMemo(() => {
    return baseTabs.map((tab) => ({
      ...tab,
      count:
        tab.id === 'all'
          ? conversations.length
          : conversations.filter((c) => c.status === tab.id).length,
    }));
  }, [conversations]);

  // Calculate trend changes
  const calculateChange = (trend: number[]): number => {
    if (trend.length < 2) return 0;
    const current = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (authLoading) {
    return <LoadingState size="xl" fullPage />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-base font-bold mb-2">Not Authenticated</h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 min-h-0 h-full overflow-y-auto bg-muted/30">
      <div className="flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-8">
        {/* Header */}
        <div className="px-4 lg:px-8">
          <DashboardHeader
            title="Dashboard"
            onExport={() => logger.info('Export report triggered')}
          />
        </div>

        {/* Metrics */}
        {loading ? (
          <div className="px-4 lg:px-8">
            <LoadingState size="lg" className="py-16" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:px-8">
              <MetricCardWithChart
                title={stats.totalConversations.toLocaleString()}
                subtitle="Total Conversations"
                change={calculateChange(stats.conversationTrend)}
                changeLabel="vs last period"
                chartData={generateChartData(stats.conversationTrend)}
              />
              <MetricCardWithChart
                title={stats.activeConversations.toLocaleString()}
                subtitle="Active Sessions"
                change={calculateChange(stats.activeTrend)}
                changeLabel="vs last period"
                chartData={generateChartData(stats.activeTrend)}
              />
              <MetricCardWithChart
                title={stats.avgMessages.toLocaleString()}
                subtitle="Avg Messages"
                change={calculateChange(stats.messageTrend)}
                changeLabel="vs last period"
                chartData={generateChartData(stats.messageTrend)}
              />
              <MetricCardWithChart
                title={`${stats.conversionRate}%`}
                subtitle="Conversion Rate"
                change={calculateChange(stats.conversionTrend)}
                changeLabel="vs last period"
                chartData={generateChartData(stats.conversionTrend)}
              />
            </div>

            {/* Data Table with Tabs Inside */}
            <div className="px-4 lg:px-8">
              <ConversationsDataTable
                data={tableData}
                tabs={tabsWithCounts}
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
                onDelete={async (ids: string[]) => {
                  const { error } = await supabase
                    .from('conversations')
                    .delete()
                    .in('id', ids);
                  if (error) throw error;
                }}
                title="Conversations"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
};
