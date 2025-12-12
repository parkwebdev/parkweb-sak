/**
 * Analytics Page
 * 
 * Comprehensive analytics dashboard providing insights into conversations,
 * leads, agent performance, traffic sources, and usage metrics.
 * Features include:
 * - KPI overview with trend indicators
 * - Date range and filter controls
 * - Comparison mode for period-over-period analysis
 * - Multiple chart visualizations
 * - Report generation (CSV/PDF export)
 * - Scheduled report management
 * - Real-time data tables
 * 
 * @page
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { AnalyticsKPIs } from '@/components/analytics/AnalyticsKPIs';
import { ComparisonView } from '@/components/analytics/ComparisonView';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { AgentPerformanceChart } from '@/components/analytics/AgentPerformanceChart';
import { UsageMetricsChart } from '@/components/analytics/UsageMetricsChart';
import { TrafficSourceChart } from '@/components/analytics/TrafficSourceChart';
import { LandingPagesTable } from '@/components/analytics/LandingPagesTable';
import { PageVisitHeatmap } from '@/components/analytics/PageVisitHeatmap';
import { ActiveVisitorsCard } from '@/components/analytics/ActiveVisitorsCard';
import { ReportBuilder, ReportConfig } from '@/components/analytics/ReportBuilder';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { ConversationsDataTable, ConversationRow } from '@/components/dashboard/ConversationsDataTable';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { toast } from '@/lib/toast';
import { subDays, formatDistanceToNow } from 'date-fns';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

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

// Format duration from created_at
const formatDuration = (createdAt: string): string => {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
};

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Date state
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());

  // Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState(subDays(new Date(), 60));
  const [comparisonEndDate, setComparisonEndDate] = useState(subDays(new Date(), 30));

  // Filters state
  const [filters, setFilters] = useState({
    agentId: 'all',
    leadStatus: 'all',
    conversationStatus: 'all',
  });

  // Conversations table state
  const [selectedConversationTab, setSelectedConversationTab] = useState('all');
  const [conversations, setConversations] = useState<ConversationWithAgent[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // Report config
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'summary',
    includeConversations: true,
    includeLeads: true,
    includeAgentPerformance: true,
    includeUsageMetrics: true,
    grouping: 'day',
    includeKPIs: true,
    includeCharts: true,
    includeTables: true,
  });

  // Fetch analytics data
  const {
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    conversations: analyticsConversations,
    leads,
    loading,
    refetch,
  } = useAnalytics(startDate, endDate, filters);

  // Fetch traffic analytics
  const {
    trafficSources,
    landingPages,
    pageVisits,
    agents,
    agentNames,
    loading: trafficLoading,
  } = useTrafficAnalytics(startDate, endDate, filters.agentId);

  // Comparison data
  const comparisonData = useAnalytics(
    comparisonStartDate,
    comparisonEndDate,
    filters
  );

  // Fetch conversations for table
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (!user) return;

    if (showLoading) setConversationsLoading(true);
    try {
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
    } catch (error) {
      logger.error('Error fetching conversations:', error);
    } finally {
      if (showLoading) setConversationsLoading(false);
    }
  }, [user]);

  // Initial conversations fetch
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Debounced refetch for conversations
  const debouncedFetchRef = useRef<NodeJS.Timeout>();
  
  const debouncedFetchConversations = useCallback(() => {
    if (debouncedFetchRef.current) {
      clearTimeout(debouncedFetchRef.current);
    }
    debouncedFetchRef.current = setTimeout(() => {
      fetchConversations(false);
    }, 300);
  }, [fetchConversations]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, []);

  // Real-time subscription for conversations table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('analytics-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        debouncedFetchConversations
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        debouncedFetchConversations
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        debouncedFetchConversations
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, debouncedFetchConversations]);

  // Filter conversations based on selected tab
  const filteredConversations = useMemo(() => {
    if (selectedConversationTab === 'all') return conversations;
    return conversations.filter((c) => c.status === selectedConversationTab);
  }, [conversations, selectedConversationTab]);

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

  // Calculate KPIs
  const totalConversations = conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  const totalLeads = leadStats.reduce((sum, stat) => sum + stat.total, 0);
  const convertedLeads = leadStats.reduce((sum, stat) => sum + stat.converted, 0);
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  const totalMessages = usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);

  const comparisonTotalConversations = comparisonData.conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  const comparisonTotalLeads = comparisonData.leadStats.reduce((sum, stat) => sum + stat.total, 0);
  const comparisonConvertedLeads = comparisonData.leadStats.reduce((sum, stat) => sum + stat.converted, 0);
  const comparisonConversionRate = comparisonTotalLeads > 0 ? ((comparisonConvertedLeads / comparisonTotalLeads) * 100).toFixed(1) : '0';

  const kpis = [
    {
      title: 'Total Conversations',
      value: totalConversations.toString(),
      change: comparisonMode && comparisonTotalConversations > 0
        ? ((totalConversations - comparisonTotalConversations) / comparisonTotalConversations * 100)
        : 0,
      changeLabel: 'vs previous period',
    },
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      change: comparisonMode && comparisonTotalLeads > 0
        ? ((totalLeads - comparisonTotalLeads) / comparisonTotalLeads * 100)
        : 0,
      changeLabel: 'vs previous period',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: comparisonMode
        ? (parseFloat(conversionRate) - parseFloat(comparisonConversionRate))
        : 0,
      changeLabel: 'vs previous period',
    },
    {
      title: 'Total Messages',
      value: totalMessages.toString(),
      change: 0,
      changeLabel: 'vs previous period',
    },
  ];

  // Comparison metrics
  const comparisonMetrics = [
    {
      label: 'Conversations',
      currentValue: totalConversations,
      previousValue: comparisonTotalConversations,
      format: 'number' as const,
    },
    {
      label: 'Leads',
      currentValue: totalLeads,
      previousValue: comparisonTotalLeads,
      format: 'number' as const,
    },
    {
      label: 'Conversion Rate',
      currentValue: parseFloat(conversionRate),
      previousValue: parseFloat(comparisonConversionRate),
      format: 'percentage' as const,
    },
  ];

  // Analytics data for export
  const analyticsData = {
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    conversations: analyticsConversations,
    leads,
    kpis,
  };

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleComparisonDateChange = (start: Date, end: Date) => {
    setComparisonStartDate(start);
    setComparisonEndDate(end);
  };

  const handleExportCSV = async () => {
    try {
      await generateCSVReport(analyticsData, reportConfig, startDate, endDate, user?.email || 'User');
      toast.success('CSV exported successfully');
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(analyticsData, reportConfig, startDate, endDate, user?.email || 'User');
      toast.success('PDF exported successfully');
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleDeleteConversations = async (ids: string[]) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .in('id', ids);
    if (error) throw error;
  };

  return (
    <main className="flex-1 bg-muted/30 h-screen overflow-auto">
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance and insights across your organization
          </p>
        </div>

      {/* Unified Toolbar */}
      <AnalyticsToolbar
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        comparisonMode={comparisonMode}
        onComparisonModeChange={setComparisonMode}
        comparisonStartDate={comparisonStartDate}
        comparisonEndDate={comparisonEndDate}
        onComparisonDateChange={handleComparisonDateChange}
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {comparisonMode ? (
            <ComparisonView 
              currentPeriod={{ start: startDate, end: endDate }}
              previousPeriod={{ start: comparisonStartDate, end: comparisonEndDate }}
              metrics={comparisonMetrics} 
            />
          ) : (
            <AnalyticsKPIs kpis={kpis} />
          )}

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading analytics data...
            </div>
          ) : (
            <AnimatedList className="grid grid-cols-1 lg:grid-cols-2 gap-6" staggerDelay={0.1}>
              <AnimatedItem>
                <ConversationChart data={conversationStats} />
              </AnimatedItem>
              <AnimatedItem>
                <LeadConversionChart data={leadStats} />
              </AnimatedItem>
              <AnimatedItem>
                <AgentPerformanceChart data={agentPerformance} />
              </AnimatedItem>
              <AnimatedItem>
                <UsageMetricsChart data={usageMetrics} />
              </AnimatedItem>
            </AnimatedList>
          )}

          {/* Conversations Data Table */}
          <ConversationsDataTable
            data={tableData}
            tabs={tabsWithCounts}
            selectedTab={selectedConversationTab}
            onTabChange={setSelectedConversationTab}
            onDelete={handleDeleteConversations}
            title="Conversations"
          />
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6 mt-6">
          {/* Active Visitors */}
          <ActiveVisitorsCard 
            agentIds={agents.map(a => a.id)} 
            agentNames={agentNames}
          />
          
          {/* Traffic Charts */}
          <AnimatedList className="grid grid-cols-1 lg:grid-cols-2 gap-6" staggerDelay={0.1}>
            <AnimatedItem>
              <TrafficSourceChart data={trafficSources} loading={trafficLoading} />
            </AnimatedItem>
            <AnimatedItem>
              <PageVisitHeatmap data={pageVisits} loading={trafficLoading} />
            </AnimatedItem>
          </AnimatedList>
          
          {/* Landing Pages Table - Full Width */}
          <LandingPagesTable data={landingPages} loading={trafficLoading} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <ReportBuilder config={reportConfig} onConfigChange={setReportConfig} />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <ScheduledReportsManager />
        </TabsContent>
      </Tabs>
      </div>
    </main>
  );
};

export default Analytics;
