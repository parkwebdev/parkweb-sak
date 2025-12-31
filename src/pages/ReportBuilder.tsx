/**
 * Report Builder Page
 * 
 * Full-page report builder with live PDF preview using real analytics data.
 * Merges functionality from BuildReportSheet and PDFTestPage.
 * 
 * @page
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useNavigate } from 'react-router-dom';
import { generateBeautifulPDF } from '@/lib/pdf-generator';
import { generateCSVReport } from '@/lib/report-export';
import { buildPDFData } from '@/lib/build-pdf-data';
import { aggregatePDFData, aggregateAnalyticsExportData } from '@/lib/data-aggregation';
import { buildAnalyticsExportData } from '@/lib/analytics-export-data';
import { calculatePeakActivityData } from '@/lib/peak-activity-utils';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useAuth } from '@/hooks/useAuth';
import { useReportExports } from '@/hooks/useReportExports';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { isValidEmail } from '@/utils/validation';
import { downloadFile } from '@/lib/file-download';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { PDFConfig, ReportType } from '@/types/pdf';
import { 
  type ReportConfig, 
  type DatePreset,
  DATE_PRESETS,
  DEFAULT_REPORT_CONFIG,
  getDateRangeFromPreset,
} from '@/types/report-config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PdfJsViewer } from '@/components/pdf/PdfJsViewer';
import { PdfIcon, CsvIcon } from '@/components/analytics/ExportIcons';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';

import { 
  ArrowLeft, 
  X,
  Loading02,
  RefreshCcw01,
  Download02,
  FileCheck02,
} from '@untitledui/icons';

// Re-export ReportConfig for backward compatibility
export type { ReportConfig } from '@/types/report-config';

type Step = 'configure' | 'schedule';

// === Component ===

export default function ReportBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const { createExport } = useReportExports();
  const { createReport } = useScheduledReports();

  // === Step Management ===
  const [step, setStep] = useState<Step>('configure');

  // === Config State ===
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);

  // === Date State (stable references to prevent re-renders) ===
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [startDate, setStartDate] = useState<Date>(() => subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  // === PDF Preview State ===
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // === Export State ===
  const [isExporting, setIsExporting] = useState(false);

  // === Scheduling State ===
  const [scheduleName, setScheduleName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  // === Handle Preset Change (updates stable date state) ===
  const handlePresetChange = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    const { start, end } = getDateRangeFromPreset(preset);
    setStartDate(start);
    setEndDate(end);
  }, []);

  // === Toggle all items in a section ===
  const toggleSection = useCallback((keys: string[], selectAll: boolean) => {
    setConfig(prev => {
      const updates = { ...prev };
      keys.forEach(key => {
        (updates as Record<string, unknown>)[key] = selectAll;
      });
      return updates;
    });
  }, []);

  // === Memoized comparison dates (stable references) ===
  const comparisonStartDate = useMemo(() => subDays(startDate, 30), [startDate]);
  const comparisonEndDate = useMemo(() => subDays(endDate, 30), [endDate]);

  // === Stable Filters (memoized to prevent infinite re-render loops) ===
  const filters = useMemo(() => ({ leadStatus: 'all', conversationStatus: 'all' }), []);

  // === Fetch Analytics Data ===
  const data = useAnalyticsData({
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
    comparisonMode: false,
    filters,
  });

  // === Loading State ===
  const isDataLoading = data.loading || data.bookingLoading || data.satisfactionLoading || 
    data.aiPerformanceLoading || data.trafficLoading || data.funnelLoading;

  // === Peak Activity Data ===
  const peakActivityData = useMemo(() =>
    calculatePeakActivityData(data.conversationStats),
    [data.conversationStats]
  );

  // === Stable config key for dependency tracking ===
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  // === Stable date primitives for useEffect dependencies ===
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // === Stable data version key (primitives only) to prevent re-renders ===
  const dataVersion = useMemo(() => {
    if (isDataLoading) return null;
    // Include booking total to detect booking data changes
    return `${data.totalConversations}-${data.totalLeads}-${data.conversionRate}-${data.totalMessages}-${data.bookingStats?.totalBookings ?? 0}`;
  }, [isDataLoading, data.totalConversations, data.totalLeads, data.conversionRate, data.totalMessages, data.bookingStats?.totalBookings]);

  // === PDF Data - computed from stable dataVersion ===
  // Only recomputes when dataVersion or grouping changes
  const pdfData = useMemo(() => {
    if (!dataVersion) return null;
    const rawData = buildPDFData(data, peakActivityData);
    // Apply grouping aggregation (weekly/monthly)
    return aggregatePDFData(rawData, config.grouping);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, peakActivityData, config.grouping]);

  // === Generation guard ref to prevent duplicate generations ===
  const lastPreviewKeyRef = useRef<string | null>(null);

  // === CSV Export Data (with grouping aggregation) ===
  const analyticsExportData = useMemo(() => {
    const rawData = buildAnalyticsExportData({
      totalConversations: data.totalConversations,
      totalLeads: data.totalLeads,
      conversionRate: data.conversionRate,
      totalMessages: data.totalMessages,
      comparisonTotalConversations: data.comparisonTotalConversations,
      comparisonTotalLeads: data.comparisonTotalLeads,
      comparisonConversionRate: data.comparisonConversionRate,
      comparisonTotalMessages: data.comparisonTotalMessages,
      comparisonMode: false,
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
      funnelStages: data.funnelStages,
      peakActivity: peakActivityData,
      engagement: data.engagement,
      leadsBySource: data.leadsBySource,
      pageDepthDistribution: data.pageDepthDistribution,
      sourcesByDate: data.sourcesByDate,
    });
    // Apply grouping aggregation (weekly/monthly)
    return aggregateAnalyticsExportData(rawData, config.grouping);
  }, [data, peakActivityData, config.grouping]);

  // === Config Helpers ===
  const updateConfig = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // === Generate PDF Preview ===
  useEffect(() => {
    // Only generate preview for PDF format
    if (config.format !== 'pdf') {
      setPdfArrayBuffer(null);
      setIsGenerating(false);
      lastPreviewKeyRef.current = null;
      return;
    }

    // Wait for data to be ready
    if (!dataVersion || !pdfData) {
      return;
    }

    // Build a unique key for this preview configuration
    const previewKey = `${configKey}|${dataVersion}|${startMs}|${endMs}|${user?.email ?? ''}|${refreshKey}|${config.grouping}`;

    // Skip if we already generated for this exact configuration
    if (lastPreviewKeyRef.current === previewKey) {
      logger.debug('PDF preview skipped - same key', { previewKey });
      return;
    }

    logger.debug('PDF preview generation starting', { previewKey });
    
    let cancelled = false;

    const generatePreview = async () => {
      setIsGenerating(true);
      setPreviewError(null);

      try {
        const blob = await generateBeautifulPDF({
          data: pdfData,
          config,
          startDate,
          endDate,
          orgName: 'Ari Agent',
        });

        if (!cancelled) {
          const arrayBuffer = await blob.arrayBuffer();
          setPdfArrayBuffer(arrayBuffer);
          lastPreviewKeyRef.current = previewKey;
          logger.debug('PDF preview generation complete', { previewKey });
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('Failed to generate PDF preview:', err);
          setPreviewError(err instanceof Error ? err.message : 'Failed to generate preview');
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    };

    // Debounce preview generation
    const timeout = setTimeout(generatePreview, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // ONLY stable primitives in dependencies - no object references!
  }, [configKey, dataVersion, startMs, endMs, user?.email, refreshKey]);

  // === Export Handler ===
  const handleExport = useCallback(async () => {
    if (config.format === 'pdf' && !pdfData) {
      toast.error('Data is still loading. Please wait.');
      return;
    }

    setIsExporting(true);

    try {
      const reportName = `Analytics Report - ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d, yyyy')}`;

      const blob = config.format === 'csv'
        ? generateCSVReport(analyticsExportData, config, startDate, endDate, user?.email || 'User')
        : await generateBeautifulPDF({
            data: pdfData!,
            config,
            startDate,
            endDate,
            orgName: 'Ari Agent',
          });

      await createExport({
        name: reportName,
        format: config.format,
        file: blob,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        reportConfig: config,
      });

      const url = URL.createObjectURL(blob);
      await downloadFile(url, `${reportName.replace(/[^a-zA-Z0-9-_]/g, '_')}.${config.format}`);
      URL.revokeObjectURL(url);

      toast.success(`${config.format.toUpperCase()} exported and saved`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Export error:', error);
      toast.error(`Export failed: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }, [config, pdfData, analyticsExportData, startDate, endDate, user?.email, createExport]);

  // === Scheduling Handlers ===
  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && !recipients.includes(email) && isValidEmail(email)) {
      setRecipients([...recipients, email]);
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName || recipients.length === 0) return;

    setIsScheduling(true);
    try {
      await createReport({
        name: scheduleName,
        recipients,
        frequency,
        day_of_week: frequency === 'weekly' ? dayOfWeek : null,
        day_of_month: frequency === 'monthly' ? dayOfMonth : null,
        time_of_day: `${timeOfDay}:00`,
        report_config: {
          format: config.format,
          type: config.type,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ...config,
        },
        active: true,
      });

      toast.success('Scheduled report created');
      navigate('/analytics');
    } catch (error: unknown) {
      logger.error('Error creating scheduled report:', error);
      toast.error('Failed to create scheduled report');
    } finally {
      setIsScheduling(false);
    }
  };

  // === Category Counts ===
  const coreMetricsCount = [
    config.includeConversations,
    config.includeLeads,
    config.includeUsageMetrics,
    config.includeConversationFunnel,
    config.includePeakActivity
  ].filter(Boolean).length;

  const businessOutcomesCount = [
    config.includeBookings,
    config.includeBookingTrend,
    config.includeSatisfaction,
    config.includeCSATDistribution,
    config.includeCustomerFeedback,
    config.includeAIPerformance,
    config.includeAIPerformanceTrend
  ].filter(Boolean).length;

  const trafficCount = [
    config.includeTrafficSources,
    config.includeTrafficSourceTrend,
    config.includeTopPages,
    config.includePageEngagement,
    config.includePageDepth,
    config.includeVisitorLocations,
    config.includeVisitorCities
  ].filter(Boolean).length;

  const leadsAnalyticsCount = [
    config.includeLeadSourceBreakdown,
    config.includeLeadConversionTrend
  ].filter(Boolean).length;

  const agentDataCount = config.includeAgentPerformance ? 1 : 0;
  const exportOptionsCount = [config.includeKPIs, config.includeCharts, config.includeTables].filter(Boolean).length;

  return (
    <motion.div 
      className="flex h-full min-h-0 min-w-0 bg-muted/30"
      initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Sidebar */}
      <aside className="w-[340px] flex-shrink-0 border-r border-border bg-background h-full min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/analytics?tab=reports')}
            className="h-8 w-8"
            aria-label="Back to reports"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {step === 'configure' ? 'Build Report' : 'Schedule Report'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === 'configure' ? 'Configure and preview your report' : 'Set up automated delivery'}
            </p>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="p-4 space-y-5"
            >
              {step === 'configure' ? (
                <>
                  {/* Date Range Pills */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DATE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handlePresetChange(preset.value)}
                          aria-pressed={datePreset === preset.value}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full border transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            datePreset === preset.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:bg-muted"
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Grouping */}
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-sm font-medium">Group Data By</Label>
                      <Select
                        value={config.grouping}
                        onValueChange={(v) => updateConfig('grouping', v as 'day' | 'week' | 'month')}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Daily</SelectItem>
                          <SelectItem value="week">Weekly</SelectItem>
                          <SelectItem value="month">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Report Format</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateConfig('format', 'pdf')}
                        aria-pressed={config.format === 'pdf'}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors flex-1",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          config.format === 'pdf'
                            ? "bg-primary/5 text-foreground border-primary"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        )}
                      >
                        <PdfIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig('format', 'csv')}
                        aria-pressed={config.format === 'csv'}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors flex-1",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          config.format === 'csv'
                            ? "bg-primary/5 text-foreground border-primary"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        )}
                      >
                        <CsvIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Data Categories */}
                  <div className="space-y-0">
                    {/* Core Metrics */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Core Metrics</p>
                        <button
                          type="button"
                          onClick={() => {
                            const keys = ['includeConversations', 'includeConversationFunnel', 'includePeakActivity', 'includeLeads', 'includeUsageMetrics'];
                            const allSelected = keys.every(k => config[k as keyof ReportConfig]);
                            toggleSection(keys, !allSelected);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {['includeConversations', 'includeConversationFunnel', 'includePeakActivity', 'includeLeads', 'includeUsageMetrics'].every(k => config[k as keyof ReportConfig]) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: 'includeConversations', label: 'Conversations' },
                          { key: 'includeConversationFunnel', label: 'Conversation Funnel' },
                          { key: 'includePeakActivity', label: 'Peak Activity Heatmap' },
                          { key: 'includeLeads', label: 'Leads' },
                          { key: 'includeUsageMetrics', label: 'Usage Metrics' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center gap-2">
                            <Checkbox
                              id={item.key}
                              checked={config[item.key as keyof ReportConfig] as boolean}
                              onCheckedChange={(checked) => updateConfig(item.key as keyof ReportConfig, !!checked)}
                            />
                            <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Business Outcomes */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Outcomes</p>
                        <button
                          type="button"
                          onClick={() => {
                            const keys = ['includeBookings', 'includeBookingTrend', 'includeSatisfaction', 'includeCSATDistribution', 'includeCustomerFeedback', 'includeAIPerformance', 'includeAIPerformanceTrend'];
                            const allSelected = keys.every(k => config[k as keyof ReportConfig]);
                            toggleSection(keys, !allSelected);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {['includeBookings', 'includeBookingTrend', 'includeSatisfaction', 'includeCSATDistribution', 'includeCustomerFeedback', 'includeAIPerformance', 'includeAIPerformanceTrend'].every(k => config[k as keyof ReportConfig]) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: 'includeBookings', label: 'Bookings by Location' },
                          { key: 'includeBookingTrend', label: 'Booking Trend' },
                          { key: 'includeSatisfaction', label: 'Satisfaction Ratings' },
                          { key: 'includeCSATDistribution', label: 'CSAT Distribution' },
                          { key: 'includeCustomerFeedback', label: 'Customer Feedback' },
                          { key: 'includeAIPerformance', label: 'Ari Performance' },
                          { key: 'includeAIPerformanceTrend', label: 'Ari Performance Trend' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center gap-2">
                            <Checkbox
                              id={item.key}
                              checked={config[item.key as keyof ReportConfig] as boolean}
                              onCheckedChange={(checked) => updateConfig(item.key as keyof ReportConfig, !!checked)}
                            />
                            <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Traffic Analytics */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Traffic Analytics</p>
                        <button
                          type="button"
                          onClick={() => {
                            const keys = ['includeTrafficSources', 'includeTrafficSourceTrend', 'includeTopPages', 'includePageEngagement', 'includePageDepth', 'includeVisitorLocations', 'includeVisitorCities'];
                            const allSelected = keys.every(k => config[k as keyof ReportConfig]);
                            toggleSection(keys, !allSelected);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {['includeTrafficSources', 'includeTrafficSourceTrend', 'includeTopPages', 'includePageEngagement', 'includePageDepth', 'includeVisitorLocations', 'includeVisitorCities'].every(k => config[k as keyof ReportConfig]) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: 'includeTrafficSources', label: 'Traffic Sources' },
                          { key: 'includeTrafficSourceTrend', label: 'Traffic Source Trend' },
                          { key: 'includeTopPages', label: 'Top Pages' },
                          { key: 'includePageEngagement', label: 'Page Engagement' },
                          { key: 'includePageDepth', label: 'Page Depth' },
                          { key: 'includeVisitorLocations', label: 'Visitor Locations' },
                          { key: 'includeVisitorCities', label: 'Top Cities' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center gap-2">
                            <Checkbox
                              id={item.key}
                              checked={config[item.key as keyof ReportConfig] as boolean}
                              onCheckedChange={(checked) => updateConfig(item.key as keyof ReportConfig, !!checked)}
                            />
                            <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Leads Analytics */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads Analytics</p>
                        <button
                          type="button"
                          onClick={() => {
                            const keys = ['includeLeadSourceBreakdown', 'includeLeadConversionTrend'];
                            const allSelected = keys.every(k => config[k as keyof ReportConfig]);
                            toggleSection(keys, !allSelected);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {['includeLeadSourceBreakdown', 'includeLeadConversionTrend'].every(k => config[k as keyof ReportConfig]) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: 'includeLeadSourceBreakdown', label: 'Lead Source Breakdown' },
                          { key: 'includeLeadConversionTrend', label: 'Lead Conversion Trend' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center gap-2">
                            <Checkbox
                              id={item.key}
                              checked={config[item.key as keyof ReportConfig] as boolean}
                              onCheckedChange={(checked) => updateConfig(item.key as keyof ReportConfig, !!checked)}
                            />
                            <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Agent Data */}
                    <div className="py-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2">Agent Data</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeAgentPerformance"
                            checked={config.includeAgentPerformance}
                            onCheckedChange={(checked) => updateConfig('includeAgentPerformance', !!checked)}
                          />
                          <Label htmlFor="includeAgentPerformance" className="text-sm font-normal cursor-pointer">Agent Performance</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Export Options */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Export Options</p>
                        <button
                          type="button"
                          onClick={() => {
                            const keys = ['includeKPIs', 'includeCharts', 'includeTables'];
                            const allSelected = keys.every(k => config[k as keyof ReportConfig]);
                            toggleSection(keys, !allSelected);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {['includeKPIs', 'includeCharts', 'includeTables'].every(k => config[k as keyof ReportConfig]) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: 'includeKPIs', label: 'KPI Summary' },
                          { key: 'includeCharts', label: 'Charts' },
                          { key: 'includeTables', label: 'Data Tables' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center gap-2">
                            <Checkbox
                              id={item.key}
                              checked={config[item.key as keyof ReportConfig] as boolean}
                              onCheckedChange={(checked) => updateConfig(item.key as keyof ReportConfig, !!checked)}
                            />
                            <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </>
              ) : (
                /* Schedule Step */
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-name">Report Name</Label>
                    <Input
                      id="schedule-name"
                      placeholder="e.g., Weekly Team Summary"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setFrequency(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                            <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {frequency === 'monthly' && (
                    <div className="space-y-2">
                      <Label>Day of Month</Label>
                      <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time of Day</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-recipient">Email Recipients</Label>
                    <div className="flex gap-2">
                      <Input
                        id="schedule-recipient"
                        type="email"
                        placeholder="email@example.com"
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRecipient();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddRecipient}>Add</Button>
                    </div>
                    {recipients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {recipients.map((email) => (
                          <Badge key={email} variant="secondary" className="gap-1">
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(email)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Config Summary */}
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Configuration</p>
                    <div className="text-sm space-y-0.5">
                      <p><span className="text-muted-foreground">Format:</span> {config.format.toUpperCase()}</p>
                      <p><span className="text-muted-foreground">Style:</span> {config.type.charAt(0).toUpperCase() + config.type.slice(1)}</p>
                      <p><span className="text-muted-foreground">Date Range:</span> {DATE_PRESETS.find(p => p.value === datePreset)?.label}</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          {step === 'configure' ? (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setStep('schedule')}
                  className="flex-1"
                  disabled={isExporting}
                >
                  Schedule
                </Button>
                <Button
                  size="default"
                  onClick={handleExport}
                  loading={isExporting}
                  className="flex-1"
                >
                  Export Now
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('configure')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCreateSchedule}
                disabled={!scheduleName || recipients.length === 0}
                loading={isScheduling}
                className="flex-1"
              >
                Create Schedule
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Preview Area */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {config.format === 'csv' ? (
            /* CSV Preview Placeholder */
            <motion.div
              key="csv-preview"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex items-center justify-center bg-muted/20"
            >
              <div className="text-center space-y-3 max-w-sm px-4">
                <CsvIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-foreground">CSV Preview Not Available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CSV exports will include all selected data categories as a spreadsheet. 
                    Click "Export Now" to download.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* PDF Preview */
            <motion.div
              key="pdf-preview"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDataLoading && (
                  <motion.div
                    key="loading-data"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex items-center justify-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loading02 className="h-8 w-8 animate-spin" aria-hidden="true" />
                      <p className="text-sm">Loading analytics data...</p>
                    </div>
                  </motion.div>
                )}

                {!isDataLoading && isGenerating && (
                  <motion.div
                    key="generating-pdf"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex items-center justify-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loading02 className="h-8 w-8 animate-spin" aria-hidden="true" />
                      <p className="text-sm">Generating PDF preview...</p>
                    </div>
                  </motion.div>
                )}

                {!isDataLoading && previewError && !isGenerating && (
                  <motion.div
                    key="error"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-3 text-destructive max-w-md text-center p-4">
                      <p className="text-sm font-medium">Failed to generate preview</p>
                      <p className="text-xs text-muted-foreground">{previewError}</p>
                      <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm">
                        Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}

                {!isDataLoading && pdfArrayBuffer && !isGenerating && !previewError && (
                  <motion.div
                    key="pdf-viewer"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden"
                  >
                    <PdfJsViewer data={pdfArrayBuffer} initialScale={1.0} mode="all" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
