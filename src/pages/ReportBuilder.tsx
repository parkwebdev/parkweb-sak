/**
 * Report Builder Page
 * 
 * Full-page report builder with live PDF preview using real analytics data.
 * Merges functionality from BuildReportSheet and PDFTestPage.
 * 
 * @page
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateBeautifulPDF } from '@/lib/pdf-generator';
import { generateCSVReport } from '@/lib/report-export';
import { buildPDFData } from '@/lib/build-pdf-data';
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PdfJsViewer } from '@/components/pdf/PdfJsViewer';
import { PdfIcon, CsvIcon } from '@/components/analytics/ExportIcons';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  X, 
  Loading02,
  RefreshCcw01,
  Download02,
  FileCheck02,
} from '@untitledui/icons';

// === Types ===

export interface ReportConfig {
  format: 'csv' | 'pdf';
  type: 'summary' | 'detailed' | 'comparison';
  includeConversations: boolean;
  includeLeads: boolean;
  includeUsageMetrics: boolean;
  includeConversationFunnel: boolean;
  includePeakActivity: boolean;
  includeBookings: boolean;
  includeBookingTrend: boolean;
  includeSatisfaction: boolean;
  includeCSATDistribution: boolean;
  includeCustomerFeedback: boolean;
  includeAIPerformance: boolean;
  includeAIPerformanceTrend: boolean;
  includeTrafficSources: boolean;
  includeTrafficSourceTrend: boolean;
  includeTopPages: boolean;
  includePageEngagement: boolean;
  includePageDepth: boolean;
  includeVisitorLocations: boolean;
  includeVisitorCities: boolean;
  includeLeadSourceBreakdown: boolean;
  includeLeadConversionTrend: boolean;
  includeAgentPerformance: boolean;
  grouping: 'day' | 'week' | 'month';
  includeKPIs: boolean;
  includeCharts: boolean;
  includeTables: boolean;
}

type DatePreset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
type Step = 'configure' | 'schedule';

// === Constants ===

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
];

const DEFAULT_CONFIG: ReportConfig = {
  format: 'pdf',
  type: 'detailed',
  includeConversations: true,
  includeLeads: true,
  includeUsageMetrics: false,
  includeConversationFunnel: false,
  includePeakActivity: false,
  includeBookings: true,
  includeBookingTrend: false,
  includeSatisfaction: true,
  includeCSATDistribution: false,
  includeCustomerFeedback: false,
  includeAIPerformance: true,
  includeAIPerformanceTrend: false,
  includeTrafficSources: false,
  includeTrafficSourceTrend: false,
  includeTopPages: false,
  includePageEngagement: false,
  includePageDepth: false,
  includeVisitorLocations: false,
  includeVisitorCities: false,
  includeLeadSourceBreakdown: true,
  includeLeadConversionTrend: false,
  includeAgentPerformance: false,
  grouping: 'day',
  includeKPIs: true,
  includeCharts: false,
  includeTables: true,
};

const getDateRangeFromPreset = (preset: DatePreset): { start: Date; end: Date } => {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'last7':
      return { start: subDays(today, 7), end: today };
    case 'last30':
      return { start: subDays(today, 30), end: today };
    case 'thisMonth':
      return { start: startOfMonth(today), end: today };
    case 'lastMonth': {
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    default:
      return { start: subDays(today, 30), end: today };
  }
};

// === Component ===

export default function ReportBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createExport } = useReportExports();
  const { createReport } = useScheduledReports();

  // === Step Management ===
  const [step, setStep] = useState<Step>('configure');

  // === Config State ===
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);

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
    if (preset !== 'custom') {
      const { start, end } = getDateRangeFromPreset(preset);
      setStartDate(start);
      setEndDate(end);
    }
  }, []);

  // === Handle Custom Date Range Change ===
  const handleCustomDateChange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      setStartDate(range.from);
      if (range.to) {
        setEndDate(range.to);
      }
    }
  }, []);

  // === Fetch Analytics Data ===
  const data = useAnalyticsData({
    startDate,
    endDate,
    comparisonStartDate: subDays(startDate, 30),
    comparisonEndDate: subDays(endDate, 30),
    comparisonMode: false,
    filters: { leadStatus: 'all', conversationStatus: 'all' },
  });

  // === Loading State ===
  const isDataLoading = data.loading || data.bookingLoading || data.satisfactionLoading || 
    data.aiPerformanceLoading || data.trafficLoading || data.funnelLoading;

  // === Peak Activity Data ===
  const peakActivityData = useMemo(() =>
    calculatePeakActivityData(data.conversationStats),
    [data.conversationStats]
  );

  // === PDF Data (memoized) - only compute when not loading ===
  const pdfData = useMemo(() => {
    if (isDataLoading) return null;
    return buildPDFData(data, peakActivityData);
  }, [data, peakActivityData, isDataLoading]);

  // === Stable config key for dependency tracking ===
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  // === Stable date primitives for useEffect dependencies ===
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // === CSV Export Data ===
  const analyticsExportData = useMemo(() => buildAnalyticsExportData({
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
  }), [data, peakActivityData]);

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
      return;
    }

    // Wait for data to finish loading
    if (isDataLoading || !pdfData) {
      setIsGenerating(true);
      return;
    }

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
          orgName: user?.email || 'Your Organization',
        });

        if (!cancelled) {
          const arrayBuffer = await blob.arrayBuffer();
          setPdfArrayBuffer(arrayBuffer);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to generate PDF preview:', err);
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
  }, [configKey, isDataLoading, pdfData, startMs, endMs, user?.email, refreshKey]);

  // === Export Handler ===
  const handleExport = useCallback(async () => {
    if (config.format === 'pdf' && !pdfData) {
      toast.error('Data is still loading. Please wait.');
      return;
    }

    setIsExporting(true);

    try {
      const reportName = `${config.type === 'summary' ? 'Summary' : config.type === 'detailed' ? 'Detailed' : 'Comparison'} Report - ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d, yyyy')}`;

      const blob = config.format === 'csv'
        ? generateCSVReport(analyticsExportData, config, startDate, endDate, user?.email || 'User')
        : await generateBeautifulPDF({
            data: pdfData!,
            config,
            startDate,
            endDate,
            orgName: user?.email || 'Your Organization',
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
    <div className="flex h-full min-h-0 min-w-0 bg-muted/30">
      {/* Sidebar */}
      <aside className="w-[340px] flex-shrink-0 border-r border-border bg-background h-full min-h-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/analytics')}
            className="h-8 w-8"
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
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
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

                  {datePreset === 'custom' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(startDate, "LLL dd, y")} - {format(endDate, "LLL dd, y")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          defaultMonth={startDate}
                          selected={{ from: startDate, to: endDate }}
                          onSelect={handleCustomDateChange}
                          numberOfMonths={2}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Report Format</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateConfig('format', 'pdf')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors flex-1",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        config.format === 'pdf'
                          ? "bg-primary/10 text-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      <PdfIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConfig('format', 'csv')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors flex-1",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        config.format === 'csv'
                          ? "bg-primary/10 text-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      <CsvIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">CSV</span>
                    </button>
                  </div>
                </div>

                {/* Report Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Report Style</Label>
                  <Select
                    value={config.type}
                    onValueChange={(v) => updateConfig('type', v as ReportType)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="comparison">Comparison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Categories Accordion */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data to Include</Label>
                  <Accordion type="multiple" defaultValue={['core', 'business']} className="space-y-2">
                    {/* Core Metrics */}
                    <AccordionItem value="core" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span>Core Metrics</span>
                          <Badge variant="secondary" className="text-xs h-5">{coreMetricsCount}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
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
                      </AccordionContent>
                    </AccordionItem>

                    {/* Business Outcomes */}
                    <AccordionItem value="business" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span>Business Outcomes</span>
                          <Badge variant="secondary" className="text-xs h-5">{businessOutcomesCount}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
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
                      </AccordionContent>
                    </AccordionItem>

                    {/* Traffic Analytics */}
                    <AccordionItem value="traffic" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span>Traffic Analytics</span>
                          <Badge variant="secondary" className="text-xs h-5">{trafficCount}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
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
                      </AccordionContent>
                    </AccordionItem>

                    {/* Leads Analytics */}
                    <AccordionItem value="leads-analytics" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span>Leads Analytics</span>
                          <Badge variant="secondary" className="text-xs h-5">{leadsAnalyticsCount}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
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
                      </AccordionContent>
                    </AccordionItem>

                    {/* Agent Data */}
                    <AccordionItem value="agent" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span>Agent Data</span>
                          <Badge variant="secondary" className="text-xs h-5">{agentDataCount}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeAgentPerformance"
                            checked={config.includeAgentPerformance}
                            onCheckedChange={(checked) => updateConfig('includeAgentPerformance', !!checked)}
                          />
                          <Label htmlFor="includeAgentPerformance" className="text-sm font-normal cursor-pointer">Agent Performance</Label>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Export Options */}
                    <AccordionItem value="options" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span>Export Options</span>
                          <Badge variant="secondary" className="text-xs h-5">{exportOptionsCount}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-2">
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Grouping */}
                <div className="space-y-2">
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
                    <p><span className="text-muted-foreground">Date Range:</span> {datePreset === 'custom' ? 'Custom' : DATE_PRESETS.find(p => p.value === datePreset)?.label}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          {step === 'configure' ? (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('schedule')}
                  className="flex-1"
                  disabled={isExporting}
                >
                  <FileCheck02 className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button
                  onClick={handleExport}
                  loading={isExporting}
                  className="flex-1"
                >
                  <Download02 className="mr-2 h-4 w-4" />
                  Export Now
                </Button>
              </div>
              {config.format === 'pdf' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="w-full"
                  disabled={isGenerating}
                >
                  <RefreshCcw01 className="mr-2 h-4 w-4" />
                  Refresh Preview
                </Button>
              )}
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
        {config.format === 'csv' ? (
          /* CSV Preview Placeholder */
          <div className="flex-1 flex items-center justify-center bg-muted/20">
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
          </div>
        ) : (
          /* PDF Preview */
          <>
            {isGenerating && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loading02 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Generating preview...</p>
                </div>
              </div>
            )}

            {previewError && !isGenerating && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-destructive max-w-md text-center p-4">
                  <p className="text-sm font-medium">Failed to generate preview</p>
                  <p className="text-xs text-muted-foreground">{previewError}</p>
                  <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {pdfArrayBuffer && !isGenerating && !previewError && (
              <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
                <PdfJsViewer data={pdfArrayBuffer} initialScale={1.0} mode="all" />
              </div>
            )}

            {!pdfArrayBuffer && !isGenerating && !previewError && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loading02 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading...</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
