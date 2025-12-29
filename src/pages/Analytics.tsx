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

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useAuth } from '@/hooks/useAuth';
import { useReportExports } from '@/hooks/useReportExports';

import { BuildReportSheet, ReportConfig } from '@/components/analytics/BuildReportSheet';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { toast } from '@/lib/toast';
import { subDays, format } from 'date-fns';
import { logger } from '@/utils/logger';
import { downloadFile } from '@/lib/file-download';

// Section components
import {
  ConversationsSection,
  LeadsSection,
  BookingsSection,
  AIPerformanceSection,
  SourcesSection,
  PagesSection,
  GeographySection,
  ReportsSection,
} from '@/components/analytics/sections';


function Analytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsSection>('conversations');
  const [exportSheetOpen, setExportSheetOpen] = useState(false);

  // Report exports hook
  const { createExport, isCreating } = useReportExports();

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

  // === Consolidated Analytics Data Hook ===
  const data = useAnalyticsData({
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
    comparisonMode,
    filters,
  });

  // Destructure commonly used values
  const {
    // Stats
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    bookingStats,
    satisfactionStats,
    aiPerformanceStats,
    // Traffic
    trafficSources,
    landingPages,
    locationData,
    engagement,
    sourcesByDate,
    pageDepthDistribution,
    leadsBySource,
    // Funnel
    funnelStages,
    // Comparison
    comparisonTrafficSources,
    // KPIs
    totalConversations,
    totalLeads,
    conversionRate,
    totalMessages,
    totalBookings,
    comparisonTotalConversations,
    comparisonTotalLeads,
    comparisonConversionRate,
    comparisonTotalMessages,
    // Trends
    leadTrend,
    conversionTrend,
    bookingTrend,
    conversationTrendValue,
    leadTrendValue,
    bookingTrendValue,
    aiContainmentTrendValue,
    // Chart Data
    leadChartData,
    conversionChartData,
    bookingChartData,
    // Loading
    loading,
    bookingLoading,
    satisfactionLoading,
    aiPerformanceLoading,
    trafficLoading,
    funnelLoading,
    comparisonTrafficLoading,
    // Actions
    refetch,
    // Mock Mode
    mockMode,
    setMockMode,
    regenerateMockData,
    // Utilities
    calculatePeriodChange,
    calculatePointChange,
    // Original data for exports
    analyticsConversations,
    leads,
  } = data;

  // KPIs array for reports
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

  // Analytics data for export - includes all analytics categories
  const analyticsExportData = {
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
      confirmed: loc.bookings - loc.cancelled - loc.completed - loc.noShow,
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
      bounce_rate: 0,
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
        blob = generateCSVReport(analyticsExportData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User');
      } else {
        blob = await generatePDFReport(analyticsExportData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User');
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
  }, [analyticsExportData, reportConfig, user?.email, createExport]);

  // Section title and description mapping
  const sectionInfo: Record<AnalyticsSection, { title: string; description: string }> = {
    'conversations': { title: 'Conversations', description: 'Analyze chat sessions and engagement patterns' },
    'leads': { title: 'Leads', description: 'Track lead generation and conversion metrics' },
    'bookings': { title: 'Bookings', description: 'Monitor appointment scheduling performance' },
    'ai-performance': { title: 'Ari Performance', description: 'Measure Ari containment, resolution, and satisfaction' },
    'sources': { title: 'Traffic Sources', description: 'Understand where your visitors come from' },
    'pages': { title: 'Top Pages', description: 'See which pages drive the most engagement' },
    'geography': { title: 'Geography', description: 'View visitor locations around the world' },
    'reports': { title: 'Reports', description: 'View export history and manage scheduled reports' },
  };

  // Sections that show the toolbar
  const showToolbar = ['conversations', 'leads', 'bookings', 'ai-performance', 'sources', 'pages', 'geography'].includes(activeTab);
  // Sections that show build report button
  const showBuildReport = activeTab === 'reports';

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

          {/* Conversations Section */}
          {activeTab === 'conversations' && (
            <ConversationsSection
              conversationStats={conversationStats}
              funnelStages={funnelStages}
              conversationTrendValue={conversationTrendValue}
              loading={loading}
              funnelLoading={funnelLoading}
            />
          )}

          {/* Leads Section */}
          {activeTab === 'leads' && (
            <LeadsSection
              totalLeads={totalLeads}
              conversionRate={conversionRate}
              leadChartData={leadChartData}
              conversionChartData={conversionChartData}
              leadStats={leadStats}
              leadChange={calculatePeriodChange(leadTrend)}
              conversionChange={calculatePointChange(conversionTrend)}
              leadTrendValue={leadTrendValue}
              loading={loading}
            />
          )}

          {/* Bookings Section */}
          {activeTab === 'bookings' && (
            <BookingsSection
              totalBookings={totalBookings}
              bookingChartData={bookingChartData}
              bookingChange={calculatePeriodChange(bookingTrend)}
              bookingsByLocation={bookingStats?.byLocation ?? []}
              bookingTrendData={bookingStats?.trend ?? []}
              bookingTrendValue={bookingTrendValue}
              bookingLoading={bookingLoading}
            />
          )}

          {/* AI Performance Section */}
          {activeTab === 'ai-performance' && (
            <AIPerformanceSection
              containmentRate={aiPerformanceStats?.containmentRate ?? 0}
              resolutionRate={aiPerformanceStats?.resolutionRate ?? 0}
              totalConversations={aiPerformanceStats?.totalConversations ?? 0}
              humanTakeover={aiPerformanceStats?.humanTakeover ?? 0}
              csatDistribution={satisfactionStats?.distribution ?? []}
              averageRating={satisfactionStats?.averageRating ?? 0}
              totalRatings={satisfactionStats?.totalRatings ?? 0}
              recentFeedback={satisfactionStats?.recentFeedback ?? []}
              aiContainmentTrendValue={aiContainmentTrendValue}
              aiPerformanceLoading={aiPerformanceLoading}
              satisfactionLoading={satisfactionLoading}
            />
          )}

          {/* Traffic Sources Section */}
          {activeTab === 'sources' && (
            <SourcesSection
              trafficSources={trafficSources}
              comparisonTrafficSources={comparisonTrafficSources}
              engagement={engagement}
              leadsBySource={leadsBySource}
              sourcesByDate={sourcesByDate}
              comparisonMode={comparisonMode}
              trafficLoading={trafficLoading}
              comparisonTrafficLoading={comparisonTrafficLoading}
            />
          )}

          {/* Pages Section */}
          {activeTab === 'pages' && (
            <PagesSection
              engagement={engagement}
              landingPages={landingPages}
              pageDepthDistribution={pageDepthDistribution}
              trafficLoading={trafficLoading}
            />
          )}

          {/* Geography Section */}
          {activeTab === 'geography' && (
            <GeographySection
              locationData={locationData}
              trafficLoading={trafficLoading}
            />
          )}

          {/* Reports Section */}
          {activeTab === 'reports' && (
            <ReportsSection />
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
