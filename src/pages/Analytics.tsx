import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCcw01 } from '@untitledui/icons';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { AgentPerformanceChart } from '@/components/analytics/AgentPerformanceChart';
import { UsageMetricsChart } from '@/components/analytics/UsageMetricsChart';
import { AnalyticsKPIs } from '@/components/analytics/AnalyticsKPIs';
import { useOrganization } from '@/contexts/OrganizationContext';

const Analytics = () => {
  const { currentOrg } = useOrganization();
  const [timeRange, setTimeRange] = useState<number>(30);
  const { 
    conversationStats, 
    leadStats, 
    agentPerformance, 
    usageMetrics,
    loading,
    refetch 
  } = useAnalytics(timeRange);

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Real-time insights for {currentOrg?.name || 'your organization'}
            </p>
          </div>
          <div className="flex gap-2">
            <Tabs value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
              <TabsList>
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="30">30 days</TabsTrigger>
                <TabsTrigger value="90">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
              <RefreshCcw01 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <AnalyticsKPIs kpis={kpis} />

        {/* Charts Grid */}
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
      </div>
    </div>
  );
};

export default Analytics;
