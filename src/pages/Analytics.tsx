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
import { ReportChartRenderer } from '@/components/analytics/ReportChartRenderer';
import { generateCSVReport } from '@/lib/report-export';
import { generateBeautifulPDF } from '@/lib/pdf-generator';
import { buildAnalyticsExportData } from '@/lib/analytics-export-data';
import { calculatePeakActivityData } from '@/lib/peak-activity-utils';
import { SECTION_INFO, TOOLBAR_SECTIONS, DEFAULT_REPORT_CONFIG } from '@/lib/analytics-constants';
import { toast } from '@/lib/toast';
import { subDays, format } from 'date-fns';
import { logger } from '@/utils/logger';
import { downloadFile } from '@/lib/file-download';
import type { ExtractProgress, SvgChartData } from '@/lib/pdf-chart-extract';
import type { ChartImageData } from '@/lib/pdf-generator';

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
  
  // === Chart Capture State (for PDF generation) ===
  const [isCapturingCharts, setIsCapturingCharts] = useState(false);
  const [captureProgress, setCaptureProgress] = useState<ExtractProgress | null>(null);
  const [pendingExport, setPendingExport] = useState<{ startDate: Date; endDate: Date } | null>(null);

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

  // === Peak Activity Data (calculated from conversation stats) ===
  const peakActivityData = useMemo(() => 
    calculatePeakActivityData(data.conversationStats),
    [data.conversationStats]
  );

  // === Export Data (memoized with all 9 new fields) ===
  const analyticsExportData = useMemo(() => buildAnalyticsExportData({
    // KPIs
    totalConversations: data.totalConversations,
    totalLeads: data.totalLeads,
    conversionRate: data.conversionRate,
    totalMessages: data.totalMessages,
    // Comparison KPIs
    comparisonTotalConversations: data.comparisonTotalConversations,
    comparisonTotalLeads: data.comparisonTotalLeads,
    comparisonConversionRate: data.comparisonConversionRate,
    comparisonTotalMessages: data.comparisonTotalMessages,
    comparisonMode,
    // Core stats
    conversationStats: data.conversationStats,
    leadStats: data.leadStats,
    agentPerformance: data.agentPerformance,
    usageMetrics: data.usageMetrics,
    // Business outcomes
    bookingStats: data.bookingStats,
    satisfactionStats: data.satisfactionStats,
    aiPerformanceStats: data.aiPerformanceStats,
    // Traffic
    trafficSources: data.trafficSources,
    landingPages: data.landingPages,
    locationData: data.locationData,
    // Original data
    analyticsConversations: data.analyticsConversations,
    leads: data.leads,
    // NEW: 9 additional fields for complete exports
    funnelStages: data.funnelStages,
    peakActivity: peakActivityData,
    engagement: data.engagement,
    leadsBySource: data.leadsBySource,
    pageDepthDistribution: data.pageDepthDistribution,
    sourcesByDate: data.sourcesByDate,
  }), [data, comparisonMode, peakActivityData]);

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
    const exportFormat = reportConfig.format;
    
    // For PDF, we need to capture charts first
    if (exportFormat === 'pdf' && reportConfig.includeCharts) {
      setPendingExport({ startDate: exportStartDate, endDate: exportEndDate });
      setIsCapturingCharts(true);
      return;
    }
    
    // For CSV or PDF without charts, export directly
    try {
      const reportName = `${reportConfig.type === 'summary' ? 'Summary' : reportConfig.type === 'detailed' ? 'Detailed' : 'Comparison'} Report - ${format(exportStartDate, 'MMM d')} to ${format(exportEndDate, 'MMM d, yyyy')}`;
      
      const blob = exportFormat === 'csv'
        ? generateCSVReport(analyticsExportData, reportConfig, exportStartDate, exportEndDate, user?.email || 'User')
        : await generateBeautifulPDF({
            data: buildPDFData(),
            config: reportConfig,
            startDate: exportStartDate,
            endDate: exportEndDate,
            orgName: user?.email || 'User',
          });
      
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

  // Build PDF data from analytics data
  const buildPDFData = useCallback(() => ({
    totalConversations: data.totalConversations,
    conversationsChange: data.conversationTrendValue,
    totalLeads: data.totalLeads,
    leadsChange: data.leadTrendValue,
    conversionRate: data.conversionRate ? parseFloat(data.conversionRate) : 0,
    conversationStats: data.conversationStats,
    conversationFunnel: data.funnelStages?.map(s => ({
      name: s.name,
      count: s.count,
      percentage: s.percentage,
      dropOffPercent: s.dropOffPercent,
    })),
    peakActivity: peakActivityData ? {
      peakDay: peakActivityData.peakDay,
      peakTime: peakActivityData.peakTime,
      peakValue: peakActivityData.peakValue,
    } : undefined,
    leadStats: data.leadStats ? [{ date: format(new Date(), 'yyyy-MM-dd'), total: data.totalLeads }] : undefined,
    leadSourceBreakdown: data.leadsBySource?.map(s => ({
      source: s.source,
      leads: s.leads,
      sessions: s.sessions,
      cvr: s.cvr,
    })),
    bookingStats: data.bookingStats?.byLocation?.map(l => ({
      location: l.locationName,
      total: l.bookings,
      confirmed: l.bookings - l.completed - l.cancelled - l.noShow,
      completed: l.completed,
      no_show: l.noShow,
      show_rate: Math.round((l.completed / Math.max(l.bookings, 1)) * 100),
    })),
    bookingTrend: data.bookingStats?.trend?.map(t => ({
      date: t.date,
      confirmed: t.confirmed,
      completed: t.completed,
      cancelled: t.cancelled,
      noShow: t.noShow,
    })),
    satisfactionStats: data.satisfactionStats ? {
      average_rating: data.satisfactionStats.averageRating,
      total_ratings: data.satisfactionStats.totalRatings,
    } : undefined,
    recentFeedback: data.satisfactionStats?.recentFeedback?.map(f => ({
      rating: f.rating,
      feedback: f.feedback,
      createdAt: f.createdAt,
      triggerType: f.triggerType,
    })),
    aiPerformanceStats: data.aiPerformanceStats ? {
      containment_rate: data.aiPerformanceStats.containmentRate,
      resolution_rate: data.aiPerformanceStats.resolutionRate,
      ai_handled: data.aiPerformanceStats.totalConversations - data.aiPerformanceStats.humanTakeover,
      human_takeover: data.aiPerformanceStats.humanTakeover,
      total_conversations: data.aiPerformanceStats.totalConversations,
    } : undefined,
    trafficSources: data.trafficSources?.map(s => ({
      source: s.name,
      visitors: s.value,
      percentage: 0, // Calculate if needed
    })),
    topPages: data.landingPages?.map(p => ({
      page: p.url,
      visits: p.visits,
      bounce_rate: 0, // Not available in mock data
      conversations: p.conversions,
    })),
    pageEngagement: data.engagement ? {
      bounceRate: data.engagement.bounceRate,
      avgPagesPerSession: data.engagement.avgPagesPerSession,
      totalSessions: data.engagement.totalSessions,
      overallCVR: data.engagement.overallCVR,
    } : undefined,
    pageDepthDistribution: data.pageDepthDistribution?.map(d => ({
      depth: d.depth,
      count: d.count,
      percentage: d.percentage,
    })),
    visitorLocations: data.locationData?.map(l => ({
      country: l.country,
      visitors: l.count,
      percentage: 0, // Calculate if needed
    })),
  }), [data, peakActivityData]);

  // Build chart data for ReportChartRenderer
  const chartData = useMemo(() => ({
    conversationStats: data.conversationStats,
    conversationFunnel: data.funnelStages?.map(s => ({
      name: s.name,
      count: s.count,
      percentage: s.percentage,
      dropOffPercent: s.dropOffPercent,
      color: s.color,
    })),
    bookingTrend: data.bookingStats?.trend?.map(t => ({
      date: t.date,
      confirmed: t.confirmed,
      completed: t.completed,
      cancelled: t.cancelled,
      noShow: t.noShow,
      total: t.confirmed + t.completed + t.cancelled + t.noShow,
    })),
    bookingStats: data.bookingStats?.byLocation?.map(l => ({
      location: l.locationName,
      total: l.bookings,
      confirmed: l.bookings - l.completed - l.cancelled - l.noShow,
      completed: l.completed,
      cancelled: l.cancelled,
      no_show: l.noShow,
    })),
    trafficSources: data.trafficSources?.map(s => ({
      source: s.name,
      visitors: s.value,
      percentage: 0,
    })),
    trafficSourceTrend: data.sourcesByDate?.map(s => ({
      date: s.date,
      direct: s.direct,
      organic: s.organic,
      paid: s.paid,
      social: s.social,
      email: s.email,
      referral: s.referral,
      total: s.total,
    })),
    topPages: data.landingPages?.map(p => ({
      page: p.url,
      visits: p.visits,
      bounce_rate: 0,
      conversations: p.conversions,
    })),
    pageDepthDistribution: data.pageDepthDistribution,
    leadSourceBreakdown: data.leadsBySource,
    satisfactionStats: data.satisfactionStats ? {
      average_rating: data.satisfactionStats.averageRating,
      total_ratings: data.satisfactionStats.totalRatings,
      distribution: data.satisfactionStats.distribution,
    } : undefined,
    leadConversionTrend: data.leadStats?.map(s => ({
      date: s.date,
      new: (s.new as number) || 0,
      contacted: (s.contacted as number) || 0,
      qualified: (s.qualified as number) || 0,
      converted: (s.converted as number) || (s.won as number) || 0,
      total: s.total,
    })),
  }), [data]);

  // Handle chart capture completion
  const handleChartCapture = useCallback(async (charts: Map<string, SvgChartData>) => {
    if (!pendingExport) return;
    
    setIsCapturingCharts(false);
    setCaptureProgress(null);
    
    try {
      const { startDate: exportStartDate, endDate: exportEndDate } = pendingExport;
      const reportName = `${reportConfig.type === 'summary' ? 'Summary' : reportConfig.type === 'detailed' ? 'Detailed' : 'Comparison'} Report - ${format(exportStartDate, 'MMM d')} to ${format(exportEndDate, 'MMM d, yyyy')}`;

      const chartMap: Map<string, ChartImageData> = new Map(
        Array.from(charts.entries()).map(([id, c]) => [
          id,
          {
            id,
            svgString: c.svgString,
            width: c.width,
            height: c.height,
          },
        ])
      );

      const blob = await generateBeautifulPDF({
        data: buildPDFData(),
        config: reportConfig,
        startDate: exportStartDate,
        endDate: exportEndDate,
        orgName: user?.email || 'User',
        charts: chartMap,
      });
      
      await createExport({
        name: reportName,
        format: 'pdf',
        file: blob,
        dateRangeStart: exportStartDate,
        dateRangeEnd: exportEndDate,
        reportConfig,
      });
      
      const url = URL.createObjectURL(blob);
      await downloadFile(url, `${reportName.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`);
      URL.revokeObjectURL(url);
      
      toast.success('PDF exported with charts');
    } catch (error: unknown) {
      logger.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setPendingExport(null);
    }
  }, [pendingExport, reportConfig, user?.email, createExport, buildPDFData]);

  const handleCaptureProgress = useCallback((p: ExtractProgress) => {
    setCaptureProgress(p);
  }, []);

  const handleCaptureError = useCallback((err: Error) => {
    logger.error('Chart capture error:', err);
    setIsCapturingCharts(false);
    setCaptureProgress(null);
    setPendingExport(null);
    toast.error('Failed to capture charts for PDF');
  }, []);

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
        isExporting={isCreating || isCapturingCharts}
        captureProgress={captureProgress}
      />
      
      {/* Offscreen chart renderer for PDF capture */}
      {isCapturingCharts && (
        <ReportChartRenderer
          data={chartData}
          config={reportConfig}
          onCapture={handleChartCapture}
          onProgress={handleCaptureProgress}
          onError={handleCaptureError}
        />
      )}
    </div>
  );
}

export default Analytics;
