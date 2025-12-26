/**
 * Analytics Page
 * 
 * Comprehensive analytics dashboard providing insights into conversations,
 * leads, bookings, customer satisfaction, AI performance, and traffic sources.
 * Features include:
 * - KPI overview with trend indicators and sparkline charts
 * - Date range and filter controls
 * - Comparison mode for period-over-period analysis
 * - Business outcome metrics (bookings, satisfaction, containment)
 * - Multiple chart visualizations
 * - Report generation (CSV/PDF export)
 * - Scheduled report management
 * 
 * @page
 * @see docs/ANALYTICS_REDESIGN_PLAN.md
 */

import { useState, useMemo, useCallback } from 'react';
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import { useSatisfactionAnalytics } from '@/hooks/useSatisfactionAnalytics';
import { useAIPerformanceAnalytics } from '@/hooks/useAIPerformanceAnalytics';
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { ComparisonView } from '@/components/analytics/ComparisonView';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { BookingsByLocationChart } from '@/components/analytics/BookingsByLocationChart';
import { BookingStatusChart } from '@/components/analytics/BookingStatusChart';
import { SatisfactionScoreCard } from '@/components/analytics/SatisfactionScoreCard';
import { AIPerformanceCard } from '@/components/analytics/AIPerformanceCard';
import { TicketsResolvedCard } from '@/components/analytics/TicketsResolvedCard';
import { TrafficSourceChart } from '@/components/analytics/TrafficSourceChart';
import { LandingPagesTable } from '@/components/analytics/LandingPagesTable';
import { PageVisitHeatmap } from '@/components/analytics/PageVisitHeatmap';
import { ActiveVisitorsCard } from '@/components/analytics/ActiveVisitorsCard';
import { ReportBuilder, ReportConfig } from '@/components/analytics/ReportBuilder';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { toast } from '@/lib/toast';
import { subDays } from 'date-fns';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { logger } from '@/utils/logger';

// Add visual variance to sparse data for interesting sparkline curves
// Ensures a minimum of 7 data points for smooth rendering
const ensureVisualVariance = (trend: number[], minPoints: number = 7): number[] => {
  // If we have no data, create a baseline curve
  if (trend.length === 0) {
    return Array.from({ length: minPoints }, (_, i) => {
      const progress = i / (minPoints - 1);
      return Math.sin(progress * Math.PI) * 0.3 + 0.2;
    });
  }
  
  // If we have fewer points than minimum, interpolate/extend
  if (trend.length < minPoints) {
    const actualValue = trend[trend.length - 1] || 1;
    const result: number[] = [];
    
    for (let i = 0; i < minPoints; i++) {
      const progress = i / (minPoints - 1);
      // Create a gentle wave leading up to the actual value
      const wave = Math.sin(progress * Math.PI * 0.8) * 0.3;
      const growth = progress * 0.5;
      const baseValue = Math.max(0.1, actualValue * (0.3 + wave + growth));
      result.push(baseValue);
    }
    // Ensure last point reflects the actual value
    result[minPoints - 1] = Math.max(0.1, actualValue);
    return result;
  }
  
  // Existing logic for when we have enough points
  const allZero = trend.every(v => v === 0);
  const allSame = trend.every(v => v === trend[0]);
  
  if (allZero || allSame) {
    const baseValue = trend[0] || 1;
    return trend.map((_, i) => {
      const progress = i / (trend.length - 1);
      const wave = Math.sin(progress * Math.PI * 1.5) * 0.4;
      const uptrend = progress * 0.3;
      return Math.max(0.1, baseValue * (0.5 + wave + uptrend));
    });
  }
  
  // Amplify small variance
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  if (max > 0 && (max - min) / max < 0.2) {
    const mid = (max + min) / 2;
    return trend.map(v => {
      const diff = v - mid;
      return mid + diff * 2.5;
    });
  }
  
  return trend;
};

// Generate chart data from daily counts
const generateChartData = (dailyCounts: number[]): { value: number }[] => {
  const visualTrend = ensureVisualVariance(dailyCounts);
  return visualTrend.map((count) => ({ value: count }));
};


const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { agentId } = useAgent();
  const [activeTab, setActiveTab] = useState<AnalyticsSection>('dashboard');

  // Mock data mode
  const { enabled: mockMode, setEnabled: setMockMode, mockData, regenerate: regenerateMockData } = useMockAnalyticsData();

  // Date state
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());

  // Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState(subDays(new Date(), 60));
  const [comparisonEndDate, setComparisonEndDate] = useState(subDays(new Date(), 30));

  // Filters state
  const [filters, setFilters] = useState({
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

  // Skip real data fetching when mock mode is enabled
  const shouldFetchRealData = !mockMode;

  // Fetch core analytics data
  const {
    conversationStats: realConversationStats,
    leadStats: realLeadStats,
    agentPerformance,
    usageMetrics: realUsageMetrics,
    bookingTrend: bookingTrendRaw,
    satisfactionTrend: satisfactionTrendRaw,
    containmentTrend: containmentTrendRaw,
    conversations: analyticsConversations,
    leads,
    loading,
    refetch,
  } = useAnalytics(startDate, endDate, filters, shouldFetchRealData);

  // Fetch booking analytics for detailed charts
  const {
    stats: realBookingStats,
    loading: bookingLoading,
  } = useBookingAnalytics(startDate, endDate, shouldFetchRealData);

  // Fetch satisfaction analytics for detailed charts
  const {
    stats: realSatisfactionStats,
    loading: satisfactionLoading,
  } = useSatisfactionAnalytics(startDate, endDate, shouldFetchRealData);

  // Fetch AI performance analytics for detailed charts
  const {
    stats: realAIPerformanceStats,
    loading: aiPerformanceLoading,
  } = useAIPerformanceAnalytics(startDate, endDate, shouldFetchRealData);

  // Fetch traffic analytics
  const {
    trafficSources: realTrafficSources,
    landingPages: realLandingPages,
    pageVisits: realPageVisits,
    loading: trafficLoading,
  } = useTrafficAnalytics(startDate, endDate, shouldFetchRealData);

  // Comparison data - only fetch when comparison mode is on AND not in mock mode
  const comparisonData = useAnalytics(
    comparisonStartDate,
    comparisonEndDate,
    filters,
    comparisonMode && shouldFetchRealData
  );

  // Use mock data when enabled, otherwise use real data
  const conversationStats = mockMode && mockData ? mockData.conversationStats : realConversationStats;
  const leadStats = mockMode && mockData ? mockData.leadStats : realLeadStats;
  const usageMetrics = mockMode && mockData ? mockData.usageMetrics : realUsageMetrics;
  const bookingStats = mockMode && mockData ? mockData.bookingStats : realBookingStats;
  const satisfactionStats = mockMode && mockData ? mockData.satisfactionStats : realSatisfactionStats;
  const aiPerformanceStats = mockMode && mockData ? mockData.aiPerformanceStats : realAIPerformanceStats;
  const trafficSources = mockMode && mockData ? mockData.trafficSources : realTrafficSources;
  const landingPages = mockMode && mockData ? mockData.landingPages : realLandingPages;
  const pageVisits = mockMode && mockData ? mockData.pageVisits : realPageVisits;


  // Calculate KPIs
  const totalConversations = conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  const totalLeads = leadStats.reduce((sum, stat) => sum + stat.total, 0);
  // Calculate converted leads from dynamic stages (look for 'converted' or 'won' stage)
  const convertedLeads = leadStats.reduce((sum, stat) => {
    const converted = (stat.converted as number) || (stat.won as number) || 0;
    return sum + converted;
  }, 0);
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  const totalMessages = usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);

  const comparisonTotalConversations = comparisonData.conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  const comparisonTotalLeads = comparisonData.leadStats.reduce((sum, stat) => sum + stat.total, 0);
  const comparisonConvertedLeads = comparisonData.leadStats.reduce((sum, stat) => {
    const converted = (stat.converted as number) || (stat.won as number) || 0;
    return sum + converted;
  }, 0);
  const comparisonConversionRate = comparisonTotalLeads > 0 ? ((comparisonConvertedLeads / comparisonTotalLeads) * 100).toFixed(1) : '0';
  const comparisonTotalMessages = comparisonData.usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);

  // Generate trend data for sparkline charts
  // In mock mode, use dedicated sparkline trends; otherwise derive from stats
  const conversationTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.conversationTrend.map(d => d.value);
    }
    return realConversationStats.map(stat => stat.total);
  }, [mockMode, mockData, realConversationStats]);

  const leadTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.leadTrend.map(d => d.value);
    }
    return realLeadStats.map(stat => stat.total);
  }, [mockMode, mockData, realLeadStats]);

  const conversionTrend = useMemo(() => {
    const stats = mockMode && mockData ? mockData.leadStats : realLeadStats;
    return stats.map(stat => {
      const converted = (stat.converted as number) || (stat.won as number) || 0;
      return stat.total > 0 ? (converted / stat.total) * 100 : 0;
    });
  }, [mockMode, mockData, realLeadStats]);

  // Business outcome trends - use dedicated mock sparkline data when available
  const bookingTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.bookingTrend.map(d => d.value);
    }
    return bookingTrendRaw.map(d => d.value);
  }, [mockMode, mockData, bookingTrendRaw]);

  const satisfactionTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.satisfactionTrend.map(d => d.value);
    }
    return satisfactionTrendRaw.map(d => d.value);
  }, [mockMode, mockData, satisfactionTrendRaw]);

  const containmentTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.containmentTrend.map(d => d.value);
    }
    return containmentTrendRaw.map(d => d.value);
  }, [mockMode, mockData, containmentTrendRaw]);

  // Calculate KPI values from new hooks
  const totalBookings = bookingStats?.totalBookings ?? 0;
  const avgSatisfaction = satisfactionStats?.averageRating ?? 0;
  const containmentRate = aiPerformanceStats?.containmentRate ?? 0;

  /**
   * Calculate percentage change between two halves of a trend.
   * Compares average of second half to average of first half.
   * This gives a meaningful "vs last period" comparison.
   */
  const calculatePeriodChange = useCallback((trend: number[]): number => {
    if (trend.length < 4) return 0;
    
    const midpoint = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, midpoint);
    const secondHalf = trend.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }, []);

  /**
   * Calculate point change for rate/percentage metrics.
   * Returns absolute difference instead of percentage change.
   * Used for Satisfaction (1-5 scale), Conversion Rate (%), Containment (%).
   */
  const calculatePointChange = useCallback((trend: number[]): number => {
    if (trend.length < 4) return 0;
    
    const midpoint = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, midpoint);
    const secondHalf = trend.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }, []);

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
      change: comparisonMode && comparisonTotalMessages > 0
        ? ((totalMessages - comparisonTotalMessages) / comparisonTotalMessages * 100)
        : 0,
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
    {
      label: 'Messages',
      currentValue: totalMessages,
      previousValue: comparisonTotalMessages,
      format: 'number' as const,
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

  const handleDateChange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleComparisonDateChange = useCallback((start: Date, end: Date) => {
    setComparisonStartDate(start);
    setComparisonEndDate(end);
  }, []);

  const handleExportCSV = useCallback(async () => {
    try {
      await generateCSVReport(analyticsData, reportConfig, startDate, endDate, user?.email || 'User');
      toast.success('CSV exported successfully');
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  }, [analyticsData, reportConfig, startDate, endDate, user?.email]);

  const handleExportPDF = useCallback(async () => {
    try {
      await generatePDFReport(analyticsData, reportConfig, startDate, endDate, user?.email || 'User');
      toast.success('PDF exported successfully');
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [analyticsData, reportConfig, startDate, endDate, user?.email]);

  return (
    <main className="flex-1 bg-muted/30 h-screen overflow-hidden flex">
      {/* Section Menu Sidebar */}
      <AnalyticsSectionMenu 
        activeSection={activeTab} 
        onSectionChange={setActiveTab} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">
              {activeTab === 'dashboard' && 'Analytics Dashboard'}
              {activeTab === 'traffic' && 'Traffic Analytics'}
              {activeTab === 'reports' && 'Generate Reporting'}
              {activeTab === 'schedule' && 'Schedule Reports'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'dashboard' && 'Track performance and insights across your organization'}
              {activeTab === 'traffic' && 'Monitor visitor sources and page engagement'}
              {activeTab === 'reports' && 'Build and export custom analytics reports'}
              {activeTab === 'schedule' && 'Automate recurring report delivery'}
            </p>
          </div>

          {/* Unified Toolbar - only show for dashboard and traffic */}
          {(activeTab === 'dashboard' || activeTab === 'traffic') && (
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
              mockMode={mockMode}
              onMockModeChange={setMockMode}
              onRegenerateMockData={regenerateMockData}
              onRefresh={refetch}
            />
          )}

          {/* Dashboard Section */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {comparisonMode ? (
                <ComparisonView 
                  currentPeriod={{ start: startDate, end: endDate }}
                  previousPeriod={{ start: comparisonStartDate, end: comparisonEndDate }}
                  metrics={comparisonMetrics} 
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:gap-6">
                  <MetricCardWithChart
                    title={totalConversations.toLocaleString()}
                    subtitle="Total Conversations"
                    description="Chat sessions started with Ari"
                    change={calculatePeriodChange(conversationTrend)}
                    changeType="percentage"
                    changeLabel="vs last period"
                    chartData={generateChartData(conversationTrend)}
                    animationDelay={0}
                  />
                  <MetricCardWithChart
                    title={totalLeads.toLocaleString()}
                    subtitle="Total Leads"
                    description="Visitors who shared contact info"
                    change={calculatePeriodChange(leadTrend)}
                    changeType="percentage"
                    changeLabel="vs last period"
                    chartData={generateChartData(leadTrend)}
                    animationDelay={0.05}
                  />
                  <MetricCardWithChart
                    title={`${conversionRate}%`}
                    subtitle="Conversion Rate"
                    description="Leads marked as won or converted"
                    change={calculatePointChange(conversionTrend)}
                    changeType="points"
                    changeLabel="vs last period"
                    chartData={generateChartData(conversionTrend)}
                    animationDelay={0.1}
                  />
                  <MetricCardWithChart
                    title={totalBookings.toLocaleString()}
                    subtitle="Total Bookings"
                    description="Appointments scheduled via Ari"
                    change={calculatePeriodChange(bookingTrend)}
                    changeType="percentage"
                    changeLabel="vs last period"
                    chartData={generateChartData(bookingTrend)}
                    animationDelay={0.15}
                  />
                  <MetricCardWithChart
                    title={avgSatisfaction.toFixed(1)}
                    subtitle="Avg Satisfaction"
                    description="User ratings out of 5 stars"
                    change={calculatePointChange(satisfactionTrend)}
                    changeType="points"
                    changeLabel="vs last period"
                    chartData={generateChartData(satisfactionTrend)}
                    animationDelay={0.2}
                  />
                  <MetricCardWithChart
                    title={`${containmentRate.toFixed(0)}%`}
                    subtitle="AI Containment"
                    description="Chats resolved without human help"
                    change={calculatePointChange(containmentTrend)}
                    changeType="points"
                    changeLabel="vs last period"
                    chartData={generateChartData(containmentTrend)}
                    animationDelay={0.25}
                  />
                </div>
              )}

              {/* Charts Grid */}
              {loading || bookingLoading || satisfactionLoading || aiPerformanceLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading analytics data...
                </div>
              ) : (
                <AnimatedList className="grid grid-cols-1 lg:grid-cols-2 gap-6" staggerDelay={0.1}>
                  {/* Row 1: Conversations & Leads */}
                  <AnimatedItem>
                    <ConversationChart data={conversationStats} />
                  </AnimatedItem>
                  <AnimatedItem>
                    <LeadConversionChart data={leadStats} />
                  </AnimatedItem>
                  
                  {/* Row 2: Bookings & Satisfaction */}
                  <AnimatedItem>
                    <BookingsByLocationChart 
                      data={bookingStats?.byLocation ?? []} 
                      loading={bookingLoading}
                    />
                  </AnimatedItem>
                  <AnimatedItem>
                    <SatisfactionScoreCard 
                      averageRating={satisfactionStats?.averageRating ?? 0}
                      totalRatings={satisfactionStats?.totalRatings ?? 0}
                      distribution={satisfactionStats?.distribution ?? []}
                      loading={satisfactionLoading}
                    />
                  </AnimatedItem>
                  
                  {/* Row 3: AI Performance & Booking Status */}
                  <AnimatedItem>
                    <AIPerformanceCard 
                      containmentRate={aiPerformanceStats?.containmentRate ?? 0}
                      resolutionRate={aiPerformanceStats?.resolutionRate ?? 0}
                      totalConversations={aiPerformanceStats?.totalConversations ?? 0}
                      humanTakeover={aiPerformanceStats?.humanTakeover ?? 0}
                      loading={aiPerformanceLoading}
                    />
                  </AnimatedItem>
                  <AnimatedItem>
                    <BookingStatusChart 
                      data={bookingStats?.byStatus ?? []} 
                      showRate={bookingStats?.showRate ?? 0}
                      loading={bookingLoading}
                    />
                  </AnimatedItem>
                  
                  {/* Row 4: Tickets (Coming Soon) */}
                  <AnimatedItem>
                    <TicketsResolvedCard comingSoon={true} />
                  </AnimatedItem>
                </AnimatedList>
              )}
            </div>
          )}

          {/* Traffic Section */}
          {activeTab === 'traffic' && (
            <div className="space-y-6">
              {/* Active Visitors */}
              <ActiveVisitorsCard agentId={agentId} />
              
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
            </div>
          )}

          {/* Reports Section */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <ReportBuilder config={reportConfig} onConfigChange={setReportConfig} />
            </div>
          )}

          {/* Schedule Section */}
          {activeTab === 'schedule' && (
            <ScheduledReportsManager />
          )}
        </div>
      </div>
    </main>
  );
};

export default Analytics;
