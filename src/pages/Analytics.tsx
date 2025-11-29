import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCcw01, Menu01 as Menu } from '@untitledui/icons';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { AgentPerformanceChart } from '@/components/analytics/AgentPerformanceChart';
import { UsageMetricsChart } from '@/components/analytics/UsageMetricsChart';
import { AnalyticsKPIs } from '@/components/analytics/AnalyticsKPIs';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { ReportFiltersPanel, ReportFilters } from '@/components/analytics/ReportFilters';
import { ReportBuilder, ReportConfig } from '@/components/analytics/ReportBuilder';
import { DataTables } from '@/components/analytics/DataTables';
import { ExportButtons } from '@/components/analytics/ExportButtons';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AnalyticsProps {
  onMenuClick?: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onMenuClick }) => {
  const { currentOrg } = useOrganization();
  const [activeTab, setActiveTab] = useState('overview');
  const [dataTableTab, setDataTableTab] = useState<'conversations' | 'leads' | 'agents' | 'usage'>('conversations');
  
  // Date range state
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Filters state
  const [filters, setFilters] = useState<ReportFilters>({
    agentId: 'all',
    leadStatus: 'all',
    conversationStatus: 'all',
  });

  // Report config state
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'detailed',
    includeConversations: true,
    includeLeads: true,
    includeAgentPerformance: true,
    includeUsageMetrics: true,
    grouping: 'day',
    includeKPIs: true,
    includeCharts: true,
    includeTables: true,
  });

  const { 
    conversationStats, 
    leadStats, 
    agentPerformance, 
    usageMetrics,
    conversations,
    leads,
    loading,
    refetch 
  } = useAnalytics(startDate, endDate, filters);

  // Calculate KPIs
  const totalConversations = conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  const totalLeads = leadStats.reduce((sum, stat) => sum + stat.total, 0);
  const convertedLeads = leadStats.reduce((sum, stat) => sum + stat.converted, 0);
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  const totalMessages = usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);

  const kpis = [
    {
      title: 'Total Conversations',
      value: totalConversations.toString(),
      change: 12.5,
      changeLabel: 'vs last period',
    },
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      change: 8.3,
      changeLabel: 'vs last period',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: 5.2,
      changeLabel: 'vs last period',
    },
    {
      title: 'Total Messages',
      value: totalMessages.toString(),
      change: 15.7,
      changeLabel: 'vs last period',
    },
  ];

  const analyticsData = {
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    conversations,
    leads,
    totalConversations,
    totalLeads,
    conversationsChange: 12.5,
    leadsChange: 8.3,
    conversionRate,
    conversionChange: 5.2,
    totalMessages,
    messagesChange: 15.7,
  };

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time insights and custom reports for {currentOrg?.name || 'your organization'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
              <RefreshCcw01 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          {/* Filters */}
          <ReportFiltersPanel filters={filters} onFiltersChange={setFilters} />
        </div>
      </header>

      <div className="px-4 lg:px-8 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
            <ExportButtons 
              data={analyticsData}
              startDate={startDate}
              endDate={endDate}
              orgName={currentOrg?.name || 'Organization'}
              config={reportConfig}
            />
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <AnalyticsKPIs kpis={kpis} />

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading analytics data...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ConversationChart data={conversationStats} />
                  <LeadConversionChart data={leadStats} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AgentPerformanceChart data={agentPerformance} />
                  <UsageMetricsChart data={usageMetrics} />
                </div>
              </div>
            )}

            {!loading && conversationStats.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No data available for the selected time range
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportBuilder 
              config={reportConfig}
              onConfigChange={setReportConfig}
            />
          </TabsContent>

          {/* Scheduled Reports Tab */}
          <TabsContent value="scheduled">
            <ScheduledReportsManager />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <Tabs value={dataTableTab} onValueChange={(v) => setDataTableTab(v as any)}>
              <TabsList>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <DataTables activeTab={dataTableTab} data={analyticsData} />
              </div>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Analytics;
