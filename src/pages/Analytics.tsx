/**
 * Analytics Page
 * 
 * Comprehensive analytics dashboard with section navigation.
 * Uses consolidated data hook for all analytics data.
 * 
 * @page
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useAuth } from '@/hooks/useAuth';
import { useReportExports } from '@/hooks/useReportExports';
import { BuildReportSheet, ReportConfig } from '@/components/analytics/BuildReportSheet';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { buildAnalyticsExportData } from '@/lib/analytics-export-data';
import { SECTION_INFO, TOOLBAR_SECTIONS, DEFAULT_REPORT_CONFIG } from '@/lib/analytics-constants';
import { toast } from '@/lib/toast';
import { subDays, format } from 'date-fns';
import { logger } from '@/utils/logger';
import { downloadFile } from '@/lib/file-download';

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
  
  // === UI State ===
  const [activeTab, setActiveTab] = useState<AnalyticsSection>('conversations');
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);

  // === Date State ===
  const [startDate, setStartDate] = useState(() => subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(() => new Date());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState(() => subDays(new Date(), 60));
  const [comparisonEndDate, setComparisonEndDate] = useState(() => subDays(new Date(), 30));
  const [filters, setFilters] = useState({ leadStatus: 'all', conversationStatus: 'all' });

  // === Report Exports ===
  const { createExport, isCreating } = useReportExports();

  // === Analytics Data ===
  const data = useAnalyticsData({
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
    comparisonMode,
    filters,
  });

  // === Export Data (memoized) ===
  const analyticsExportData = useMemo(() => buildAnalyticsExportData({
    totalConversations: data.totalConversations,
    totalLeads: data.totalLeads,
    conversionRate: data.conversionRate,
    totalMessages: data.totalMessages,
    comparisonTotalConversations: data.comparisonTotalConversations,
    comparisonTotalLeads: data.comparisonTotalLeads,
    comparisonConversionRate: data.comparisonConversionRate,
    comparisonTotalMessages: data.comparisonTotalMessages,
    comparisonMode,
    conversationStats: data.conversationStats,
    leadStats: data.leadStats,
    agentPerformance: data.agentPerformance,
    usageMetrics: data.usageMetrics,
    bookingStats: data.bookingStats,
    satisfactionStats: data.satisfactionStats,
    aiPerformanceStats: data.aiPerformanceStats,
    trafficSources: data.trafficSources,
    landingPages: data.landingPages,
    locationData: data.locationData,
    analyticsConversations: data.analyticsConversations,
    leads: data.leads,
  }), [data, comparisonMode]);

  // === Handlers ===
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
      
      const blob = exportFormat === 'csv'
        ? generateCSVReport(analyticsExportData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User')
        : await generatePDFReport(analyticsExportData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User');
      
      await createExport({
        name: reportName,
        format: exportFormat,
        file: blob,
        dateRangeStart: exportStartDate,
        dateRangeEnd: exportEndDate,
        reportConfig,
      });
      
      const url = URL.createObjectURL(blob);
      await downloadFile(url, `${reportName.replace(/[^a-zA-Z0-9-_]/g, '_')}.${exportFormat}`);
      URL.revokeObjectURL(url);
      
      toast.success(`${exportFormat.toUpperCase()} exported and saved`);
    } catch (error: unknown) {
      logger.error('Export error:', error);
      toast.error(`Failed to export ${reportConfig.format.toUpperCase()}`);
    }
  }, [analyticsExportData, reportConfig, user?.email, createExport]);

  // === Derived State ===
  const showToolbar = TOOLBAR_SECTIONS.includes(activeTab);
  const showBuildReport = activeTab === 'reports';

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      <AnalyticsSectionMenu activeSection={activeTab} onSectionChange={setActiveTab} />
      
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{SECTION_INFO[activeTab].title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{SECTION_INFO[activeTab].description}</p>
            </div>
            {showBuildReport && (
              <Button size="sm" onClick={() => setExportSheetOpen(true)}>Build Report</Button>
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
              mockMode={data.mockMode}
              onMockModeChange={data.setMockMode}
              onRegenerateMockData={data.regenerateMockData}
              onRefresh={data.refetch}
            />
          )}

          {/* Sections */}
          {activeTab === 'conversations' && (
            <ConversationsSection
              conversationStats={data.conversationStats}
              funnelStages={data.funnelStages}
              conversationTrendValue={data.conversationTrendValue}
              loading={data.loading}
              funnelLoading={data.funnelLoading}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsSection
              totalLeads={data.totalLeads}
              conversionRate={data.conversionRate}
              leadChartData={data.leadChartData}
              conversionChartData={data.conversionChartData}
              leadStats={data.leadStats}
              leadChange={data.calculatePeriodChange(data.leadTrend)}
              conversionChange={data.calculatePointChange(data.conversionTrend)}
              leadTrendValue={data.leadTrendValue}
              loading={data.loading}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsSection
              totalBookings={data.totalBookings}
              bookingChartData={data.bookingChartData}
              bookingChange={data.calculatePeriodChange(data.bookingTrend)}
              bookingsByLocation={data.bookingStats?.byLocation ?? []}
              bookingTrendData={data.bookingStats?.trend ?? []}
              bookingTrendValue={data.bookingTrendValue}
              bookingLoading={data.bookingLoading}
            />
          )}

          {activeTab === 'ai-performance' && (
            <AIPerformanceSection
              containmentRate={data.aiPerformanceStats?.containmentRate ?? 0}
              resolutionRate={data.aiPerformanceStats?.resolutionRate ?? 0}
              totalConversations={data.aiPerformanceStats?.totalConversations ?? 0}
              humanTakeover={data.aiPerformanceStats?.humanTakeover ?? 0}
              csatDistribution={data.satisfactionStats?.distribution ?? []}
              averageRating={data.satisfactionStats?.averageRating ?? 0}
              totalRatings={data.satisfactionStats?.totalRatings ?? 0}
              recentFeedback={data.satisfactionStats?.recentFeedback ?? []}
              aiContainmentTrendValue={data.aiContainmentTrendValue}
              aiPerformanceLoading={data.aiPerformanceLoading}
              satisfactionLoading={data.satisfactionLoading}
            />
          )}

          {activeTab === 'sources' && (
            <SourcesSection
              trafficSources={data.trafficSources}
              comparisonTrafficSources={data.comparisonTrafficSources}
              engagement={data.engagement}
              leadsBySource={data.leadsBySource}
              sourcesByDate={data.sourcesByDate}
              comparisonMode={comparisonMode}
              trafficLoading={data.trafficLoading}
              comparisonTrafficLoading={data.comparisonTrafficLoading}
            />
          )}

          {activeTab === 'pages' && (
            <PagesSection
              engagement={data.engagement}
              landingPages={data.landingPages}
              pageDepthDistribution={data.pageDepthDistribution}
              trafficLoading={data.trafficLoading}
            />
          )}

          {activeTab === 'geography' && (
            <GeographySection
              locationData={data.locationData}
              trafficLoading={data.trafficLoading}
            />
          )}

          {activeTab === 'reports' && <ReportsSection />}
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
}

export default Analytics;
