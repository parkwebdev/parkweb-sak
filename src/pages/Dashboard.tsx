import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Cube01 as Bot } from '@untitledui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs, DashboardTab } from '@/components/dashboard/DashboardTabs';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { ConversationsDataTable, ConversationRow } from '@/components/dashboard/ConversationsDataTable';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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

const tabs: DashboardTab[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'human_takeover', label: 'Human Takeover' },
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
      // Fetch conversations with agent and lead info
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
        .select('id, name, conversation_id')
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

      // Calculate stats
      const total = conversationsWithLeads.length;
      const active = conversationsWithLeads.filter((c) => c.status === 'active').length;
      const totalMessages = conversationsWithLeads.reduce(
        (sum, c) => sum + (c.messages?.length || 0),
        0
      );
      const avgMsgs = total > 0 ? Math.round(totalMessages / total) : 0;

      // Get leads for conversion rate
      const { data: allLeads } = await supabase
        .from('leads')
        .select('id, status')
        .eq('user_id', user.id);

      const totalLeads = allLeads?.length || 0;
      const convertedLeads = allLeads?.filter((l) => l.status === 'converted').length || 0;
      const convRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Generate trend data (last 7 days simulated for now)
      const convTrend = [12, 15, 18, 14, 22, 19, total];
      const activeTrend = [3, 5, 4, 6, 8, 5, active];
      const msgTrend = [45, 52, 48, 60, 55, 62, avgMsgs];
      const rateTrend = [18, 22, 20, 25, 28, 24, convRate];

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
      console.error('Error fetching dashboard data:', error);
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
        () => {
          // Refetch data without showing loading state
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refetch when messages change (affects message counts)
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        () => {
          // Refetch when leads change (affects conversion rate)
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

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
  const tabsWithCounts: DashboardTab[] = useMemo(() => {
    return tabs.map((tab) => ({
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
    <main className="flex-1 min-h-0 h-full overflow-y-auto">
      <div className="flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-8">
        {/* Header */}
        <div className="flex flex-col gap-5 px-4 lg:px-8">
          <DashboardHeader
            title="Dashboard"
            onExport={() => console.log('Export report')}
          />
          <DashboardTabs
            tabs={tabsWithCounts}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
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

            {/* Data Table */}
            <div className="px-4 lg:px-8">
              <ConversationsDataTable
                data={tableData}
                title="Conversations"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
};
