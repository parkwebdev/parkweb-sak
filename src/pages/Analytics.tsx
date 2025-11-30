import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { AnalyticsKPIs } from '@/components/analytics/AnalyticsKPIs';
import { ComparisonView } from '@/components/analytics/ComparisonView';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { AgentPerformanceChart } from '@/components/analytics/AgentPerformanceChart';
import { UsageMetricsChart } from '@/components/analytics/UsageMetricsChart';
import { ReportBuilder, ReportConfig } from '@/components/analytics/ReportBuilder';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { toast } from 'sonner';
import { subDays } from 'date-fns';

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
    conversations,
    leads,
    loading,
    refetch,
  } = useAnalytics(startDate, endDate, filters);

  // Comparison data
  const comparisonData = useAnalytics(
    comparisonStartDate,
    comparisonEndDate,
    filters
  );

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
    conversations,
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
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(analyticsData, reportConfig, startDate, endDate, user?.email || 'User');
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="space-y-6 p-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConversationChart data={conversationStats} />
              <LeadConversionChart data={leadStats} />
              <AgentPerformanceChart data={agentPerformance} />
              <UsageMetricsChart data={usageMetrics} />
            </div>
          )}
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
  );
};

export default Analytics;
