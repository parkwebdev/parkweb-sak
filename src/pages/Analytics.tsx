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
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import { useSatisfactionAnalytics } from '@/hooks/useSatisfactionAnalytics';
import { useAIPerformanceAnalytics } from '@/hooks/useAIPerformanceAnalytics';
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { ComparisonView } from '@/components/analytics/ComparisonView';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { BookingsByLocationChart } from '@/components/analytics/BookingsByLocationChart';
import { BookingStatusChart } from '@/components/analytics/BookingStatusChart';
import { SatisfactionScoreCard } from '@/components/analytics/SatisfactionScoreCard';
import { AIPerformanceCard } from '@/components/analytics/AIPerformanceCard';

import { TrafficSourceChart } from '@/components/analytics/TrafficSourceChart';
import { TopPagesChart } from '@/components/analytics/TopPagesChart';
import { LandingPagesTable } from '@/components/analytics/LandingPagesTable';

import { VisitorLocationMap } from '@/components/analytics/VisitorLocationMap';
import { BuildReportSheet, ReportConfig } from '@/components/analytics/BuildReportSheet';
import { FileCheck02 } from '@untitledui/icons';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { ExportHistoryTable } from '@/components/analytics/ExportHistoryTable';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { useReportExports } from '@/hooks/useReportExports';
import { toast } from '@/lib/toast';
import { subDays, format } from 'date-fns';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';
import { downloadFile } from '@/lib/file-download';

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


function Analytics() {
  const { user } = useAuth();
  const { agentId } = useAgent();
  const [activeTab, setActiveTab] = useState<AnalyticsSection>('dashboard');
  const [exportSheetOpen, setExportSheetOpen] = useState(false);

  // Report exports hook
  const { createExport, isCreating } = useReportExports();

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
    format: 'csv',
    type: 'summary',
    // Core Metrics
    includeConversations: true,
    includeLeads: true,
    includeUsageMetrics: true,
    // Business Outcomes
    includeBookings: true,
    includeSatisfaction: true,
    includeAIPerformance: true,
    // Traffic Analytics
    includeTrafficSources: true,
    includeTopPages: true,
    includeVisitorLocations: true,
    // Agent Data
    includeAgentPerformance: true,
    // Options
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
    locationData: realLocationData,
    loading: trafficLoading,
  } = useTrafficAnalytics(startDate, endDate, shouldFetchRealData);

  // Fetch comparison traffic analytics for trend calculation
  const {
    trafficSources: comparisonTrafficSources,
    loading: comparisonTrafficLoading,
  } = useTrafficAnalytics(comparisonStartDate, comparisonEndDate, comparisonMode && shouldFetchRealData);

  // Fetch Mapbox token for map rendering
  const { data: mapboxToken } = useMapboxToken();

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
  const locationData = mockMode && mockData ? mockData.locationData : realLocationData;


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

  // Calculate trend values for chart headers
  const conversationTrendValue = useMemo(() => calculatePeriodChange(conversationTrend), [conversationTrend, calculatePeriodChange]);
  const leadTrendValue = useMemo(() => calculatePeriodChange(leadTrend), [leadTrend, calculatePeriodChange]);
  const bookingTrendValue = useMemo(() => calculatePeriodChange(bookingTrend), [bookingTrend, calculatePeriodChange]);
  const satisfactionTrendValue = useMemo(() => calculatePointChange(satisfactionTrend), [satisfactionTrend, calculatePointChange]);
  const aiContainmentTrendValue = useMemo(() => calculatePointChange(containmentTrend), [containmentTrend, calculatePointChange]);

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

  // Analytics data for export - includes all analytics categories
  const analyticsData = {
    // KPI metrics
    totalConversations,
    conversationsChange: comparisonMode && comparisonTotalConversations > 0 
      ? parseFloat(((totalConversations - comparisonTotalConversations) / comparisonTotalConversations * 100).toFixed(1))
      : 0,
    totalLeads,
    leadsChange: comparisonMode && comparisonTotalLeads > 0
      ? parseFloat(((totalLeads - comparisonTotalLeads) / comparisonTotalLeads * 100).toFixed(1))
      : 0,
    conversionRate: parseFloat(conversionRate),
    conversionChange: comparisonMode && parseFloat(comparisonConversionRate) > 0
      ? parseFloat((parseFloat(conversionRate) - parseFloat(comparisonConversionRate)).toFixed(1))
      : 0,
    totalMessages,
    messagesChange: comparisonMode && comparisonTotalMessages > 0
      ? parseFloat(((totalMessages - comparisonTotalMessages) / comparisonTotalMessages * 100).toFixed(1))
      : 0,
    // Core statistics
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    // Business outcomes - transform to export format
    bookingStats: bookingStats?.byLocation?.map(loc => ({
      location: loc.locationName,
      total: loc.bookings,
      confirmed: loc.bookings - loc.cancelled - loc.completed - loc.noShow, // Approximate confirmed
      cancelled: loc.cancelled,
      completed: loc.completed,
      no_show: loc.noShow,
      show_rate: loc.bookings > 0 ? Math.round((loc.completed / loc.bookings) * 100) : 0,
    })) || [],
    satisfactionStats: satisfactionStats ? {
      average_rating: satisfactionStats.averageRating,
      total_ratings: satisfactionStats.totalRatings,
      distribution: satisfactionStats.distribution.map(d => ({
        rating: d.rating,
        count: d.count,
        percentage: d.percentage,
      })),
    } : undefined,
    aiPerformanceStats: aiPerformanceStats ? {
      containment_rate: aiPerformanceStats.containmentRate,
      resolution_rate: aiPerformanceStats.resolutionRate,
      ai_handled: aiPerformanceStats.aiHandled,
      human_takeover: aiPerformanceStats.humanTakeover,
      total_conversations: aiPerformanceStats.totalConversations,
    } : undefined,
    // Traffic analytics - transform to export format
    trafficSources: (() => {
      const totalValue = trafficSources?.reduce((sum, s) => sum + s.value, 0) || 0;
      return trafficSources?.map(source => ({
        source: source.name,
        visitors: source.value,
        percentage: totalValue > 0 ? Math.round((source.value / totalValue) * 100) : 0,
      })) || [];
    })(),
    topPages: landingPages?.map(page => ({
      page: page.url,
      visits: page.visits,
      bounce_rate: 0, // Not available in current data structure
      conversations: page.conversions,
    })) || [],
    visitorLocations: locationData?.map(loc => {
      const totalVisitors = locationData.reduce((sum, l) => sum + l.count, 0);
      return {
        country: loc.country,
        visitors: loc.count,
        percentage: totalVisitors > 0 ? Math.round((loc.count / totalVisitors) * 100) : 0,
      };
    }) || [],
    // Original data for other uses
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

  const handleExport = useCallback(async (exportStartDate: Date, exportEndDate: Date) => {
    try {
      const exportFormat = reportConfig.format;
      const reportName = `${reportConfig.type === 'summary' ? 'Summary' : reportConfig.type === 'detailed' ? 'Detailed' : 'Comparison'} Report - ${format(exportStartDate, 'MMM d')} to ${format(exportEndDate, 'MMM d, yyyy')}`;
      
      let blob: Blob;
      if (exportFormat === 'csv') {
        blob = generateCSVReport(analyticsData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User');
      } else {
        blob = await generatePDFReport(analyticsData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User');
      }
      
      // Save to storage and DB
      await createExport({
        name: reportName,
        format: exportFormat,
        file: blob,
        dateRangeStart: exportStartDate,
        dateRangeEnd: exportEndDate,
        reportConfig,
      });
      
      // Also trigger immediate download
      const url = URL.createObjectURL(blob);
      const fileName = `${reportName.replace(/[^a-zA-Z0-9-_]/g, '_')}.${exportFormat}`;
      await downloadFile(url, fileName);
      URL.revokeObjectURL(url);
      
      toast.success(`${exportFormat.toUpperCase()} exported and saved`);
    } catch (error: unknown) {
      logger.error('Export error:', error);
      toast.error(`Failed to export ${reportConfig.format.toUpperCase()}`);
    }
  }, [analyticsData, reportConfig, user?.email, createExport]);

  // Section title and description mapping
  const sectionInfo: Record<AnalyticsSection, { title: string; description: string }> = {
    'dashboard': { title: 'Analytics Dashboard', description: 'Track performance and insights across your organization' },
    'conversations': { title: 'Conversations', description: 'Analyze chat sessions and engagement patterns' },
    'leads': { title: 'Leads', description: 'Track lead generation and conversion metrics' },
    'bookings': { title: 'Bookings', description: 'Monitor appointment scheduling performance' },
    'satisfaction': { title: 'Satisfaction', description: 'Review customer feedback and ratings' },
    'ai-performance': { title: 'AI Performance', description: 'Measure AI containment and resolution rates' },
    'sources': { title: 'Traffic Sources', description: 'Understand where your visitors come from' },
    'pages': { title: 'Top Pages', description: 'See which pages drive the most engagement' },
    'geography': { title: 'Geography', description: 'View visitor locations around the world' },
    'export-history': { title: 'Export History', description: 'View and download past reports' },
    'scheduled': { title: 'Scheduled Reports', description: 'Manage automated report delivery' },
  };

  // Sections that show the toolbar
  const showToolbar = ['dashboard', 'conversations', 'leads', 'bookings', 'satisfaction', 'ai-performance', 'sources', 'pages', 'geography'].includes(activeTab);
  // Sections that show build report button
  const showBuildReport = ['export-history', 'scheduled'].includes(activeTab);

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      <AnalyticsSectionMenu 
        activeSection={activeTab} 
        onSectionChange={setActiveTab} 
      />
      
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{sectionInfo[activeTab].title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{sectionInfo[activeTab].description}</p>
            </div>
            {showBuildReport && (
              <Button size="sm" onClick={() => setExportSheetOpen(true)}>
                <FileCheck02 className="h-4 w-4 mr-2" />
                Build Report
              </Button>
            )}
          </div>

          {/* Toolbar */}
          {showToolbar && (
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Engagement</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      <MetricCardWithChart title={totalConversations.toLocaleString()} subtitle="Total Conversations" description="Chat sessions started with Ari" change={calculatePeriodChange(conversationTrend)} changeType="percentage" changeLabel="vs last period" chartData={generateChartData(conversationTrend)} animationDelay={0} />
                      <MetricCardWithChart title={totalLeads.toLocaleString()} subtitle="Total Leads" description="Visitors who shared contact info" change={calculatePeriodChange(leadTrend)} changeType="percentage" changeLabel="vs last period" chartData={generateChartData(leadTrend)} animationDelay={0.05} />
                      <MetricCardWithChart title={`${conversionRate}%`} subtitle="Conversion Rate" description="Leads marked as won or converted" change={calculatePointChange(conversionTrend)} changeType="points" changeLabel="vs last period" chartData={generateChartData(conversionTrend)} animationDelay={0.1} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Outcomes</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      <MetricCardWithChart title={totalBookings.toLocaleString()} subtitle="Total Bookings" description="Appointments scheduled via Ari" change={calculatePeriodChange(bookingTrend)} changeType="percentage" changeLabel="vs last period" chartData={generateChartData(bookingTrend)} animationDelay={0.15} />
                      <MetricCardWithChart title={avgSatisfaction.toFixed(1)} subtitle="Avg Satisfaction" description="User ratings out of 5 stars" change={calculatePointChange(satisfactionTrend)} changeType="points" changeLabel="vs last period" chartData={generateChartData(satisfactionTrend)} animationDelay={0.2} />
                      <MetricCardWithChart title={`${containmentRate.toFixed(0)}%`} subtitle="AI Containment" description="Chats resolved without human help" change={calculatePointChange(containmentTrend)} changeType="points" changeLabel="vs last period" chartData={generateChartData(containmentTrend)} animationDelay={0.25} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conversations Section */}
          {activeTab === 'conversations' && (
            <div className="space-y-6">
              <AnimatedList staggerDelay={0.1}>
                <AnimatedItem><ConversationChart data={conversationStats.map(s => ({ date: s.date, total: s.total, active: s.active, closed: s.closed }))} trendValue={conversationTrendValue} trendPeriod="this month" /></AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* Leads Section */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <AnimatedList staggerDelay={0.1}>
                <AnimatedItem><LeadConversionChart data={leadStats} trendValue={leadTrendValue} trendPeriod="this month" /></AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* Bookings Section */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <AnimatedList className="grid grid-cols-1 lg:grid-cols-2 gap-6" staggerDelay={0.1}>
                <AnimatedItem><BookingsByLocationChart data={bookingStats?.byLocation ?? []} loading={bookingLoading} /></AnimatedItem>
                <AnimatedItem><BookingStatusChart data={bookingStats?.byStatus ?? []} showRate={bookingStats?.showRate ?? 0} loading={bookingLoading} trendValue={bookingTrendValue} trendPeriod="this month" /></AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* Satisfaction Section */}
          {activeTab === 'satisfaction' && (
            <div className="space-y-6">
              <AnimatedList staggerDelay={0.1}>
                <AnimatedItem><SatisfactionScoreCard averageRating={satisfactionStats?.averageRating ?? 0} totalRatings={satisfactionStats?.totalRatings ?? 0} distribution={satisfactionStats?.distribution ?? []} loading={satisfactionLoading} trendValue={satisfactionTrendValue} trendPeriod="this month" /></AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* AI Performance Section */}
          {activeTab === 'ai-performance' && (
            <div className="space-y-6">
              <AnimatedList className="space-y-6" staggerDelay={0.1}>
                <AnimatedItem><AIPerformanceCard containmentRate={aiPerformanceStats?.containmentRate ?? 0} resolutionRate={aiPerformanceStats?.resolutionRate ?? 0} totalConversations={aiPerformanceStats?.totalConversations ?? 0} humanTakeover={aiPerformanceStats?.humanTakeover ?? 0} loading={aiPerformanceLoading} trendValue={aiContainmentTrendValue} trendPeriod="this month" /></AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* Traffic Sources Section */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <AnimatedList staggerDelay={0.1}>
                <AnimatedItem>
                  <TrafficSourceChart 
                    data={trafficSources} 
                    loading={trafficLoading || (comparisonMode && comparisonTrafficLoading)}
                    comparisonData={comparisonMode ? comparisonTrafficSources : undefined}
                  />
                </AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* Pages Section */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <AnimatedList className="space-y-6" staggerDelay={0.1}>
                <AnimatedItem><TopPagesChart data={landingPages} loading={trafficLoading} /></AnimatedItem>
                <AnimatedItem><LandingPagesTable data={landingPages} loading={trafficLoading} /></AnimatedItem>
              </AnimatedList>
            </div>
          )}

          {/* Geography Section */}
          {activeTab === 'geography' && (
            <div className="space-y-6">
              <ErrorBoundary
                fallback={(error) => (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm font-medium text-foreground">Visitor map failed to load</p>
                    <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
                  </div>
                )}
              >
                <VisitorLocationMap data={locationData} loading={trafficLoading} mapboxToken={mapboxToken} />
              </ErrorBoundary>
            </div>
          )}

          {/* Export History Section */}
          {activeTab === 'export-history' && (
            <div className="space-y-6">
              <ExportHistoryTable />
            </div>
          )}

          {/* Scheduled Reports Section */}
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <ScheduledReportsManager />
            </div>
          )}
        </div>
      </main>
      
      <BuildReportSheet
        open={exportSheetOpen}
        onOpenChange={setExportSheetOpen}
        config={reportConfig}
        onConfigChange={setReportConfig}
        onExport={handleExport}
        isExporting={isCreating}
      />
    </div>
  );
};

export default Analytics;
