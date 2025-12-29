/**
 * BuildReportSheet Component
 * 
 * Unified report builder sheet combining immediate export and scheduling.
 * Features date range pills, format selection (CSV/PDF), data category accordions,
 * and a scheduling step for automated report delivery.
 * @module components/analytics/BuildReportSheet
 */

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ArrowLeft, X } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { PdfIcon, CsvIcon } from './ExportIcons';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { isValidEmail } from '@/utils/validation';
import { logger } from '@/utils/logger';

export interface ReportConfig {
  format: 'csv' | 'pdf';
  type: 'summary' | 'detailed' | 'comparison';
  // Core Metrics
  includeConversations: boolean;
  includeLeads: boolean;
  includeUsageMetrics: boolean;
  includeConversationFunnel: boolean;
  includePeakActivity: boolean;
  // Business Outcomes
  includeBookings: boolean;
  includeBookingTrend: boolean;
  includeSatisfaction: boolean;
  includeCustomerFeedback: boolean;
  includeAIPerformance: boolean;
  // Traffic Analytics
  includeTrafficSources: boolean;
  includeTrafficSourceTrend: boolean;
  includeTopPages: boolean;
  includePageEngagement: boolean;
  includePageDepth: boolean;
  includeVisitorLocations: boolean;
  // Leads Analytics
  includeLeadSourceBreakdown: boolean;
  includeLeadConversionTrend: boolean;
  // Agent Data
  includeAgentPerformance: boolean;
  // Grouping & Export Options
  grouping: 'day' | 'week' | 'month';
  includeKPIs: boolean;
  includeCharts: boolean;
  includeTables: boolean;
}

type DatePreset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
type Step = 'configure' | 'schedule';

interface BuildReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
  onExport: (startDate: Date, endDate: Date) => void;
  isExporting?: boolean;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
];

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

export const BuildReportSheet = ({
  open,
  onOpenChange,
  config,
  onConfigChange,
  onExport,
  isExporting = false,
}: BuildReportSheetProps) => {
  const { createReport } = useScheduledReports();
  
  // Step management
  const [step, setStep] = useState<Step>('configure');
  
  // Date range state
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Scheduling state
  const [scheduleName, setScheduleName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const updateConfig = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getDateRangeFromPreset(preset);
      setCustomDateRange({ from: start, to: end });
    }
  };

  const getCurrentDateRange = () => {
    return datePreset === 'custom' 
      ? { start: customDateRange?.from || new Date(), end: customDateRange?.to || new Date() }
      : getDateRangeFromPreset(datePreset);
  };

  const handleExport = () => {
    const range = getCurrentDateRange();
    onExport(range.start, range.end);
  };

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
      const range = getCurrentDateRange();
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
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
          ...config,
        },
        active: true,
      });

      // Reset and close
      resetScheduleForm();
      setStep('configure');
      onOpenChange(false);
    } catch (error: unknown) {
      logger.error('Error creating scheduled report:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const resetScheduleForm = () => {
    setScheduleName('');
    setRecipients([]);
    setFrequency('weekly');
    setDayOfWeek(1);
    setDayOfMonth(1);
    setTimeOfDay('09:00');
    setRecipientInput('');
  };

  const handleBack = () => {
    setStep('configure');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset to configure step when closing
      setStep('configure');
    }
    onOpenChange(isOpen);
  };

  // Count selected items per category
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
    config.includeCustomerFeedback,
    config.includeAIPerformance
  ].filter(Boolean).length;
  
  const trafficCount = [
    config.includeTrafficSources, 
    config.includeTrafficSourceTrend,
    config.includeTopPages, 
    config.includePageEngagement,
    config.includePageDepth,
    config.includeVisitorLocations
  ].filter(Boolean).length;
  
  const leadsAnalyticsCount = [
    config.includeLeadSourceBreakdown,
    config.includeLeadConversionTrend
  ].filter(Boolean).length;
  
  const agentDataCount = config.includeAgentPerformance ? 1 : 0;
  const exportOptionsCount = [config.includeKPIs, config.includeCharts, config.includeTables].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {step === 'configure' ? (
          <>
            <SheetHeader>
              <SheetTitle>Build Report</SheetTitle>
              <SheetDescription>
                Configure your report settings
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Date Range Pills */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetChange(preset.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        datePreset === preset.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                
                {/* Custom Date Picker */}
                {datePreset === 'custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.from ? (
                          customDateRange.to ? (
                            <>
                              {format(customDateRange.from, "LLL dd, y")} - {format(customDateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(customDateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span className="text-muted-foreground">Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={customDateRange?.from}
                        selected={customDateRange}
                        onSelect={setCustomDateRange}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Report Format</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateConfig('format', 'csv')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors flex-1",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      config.format === 'csv'
                        ? "bg-primary/10 text-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    <CsvIcon className="h-6 w-6" />
                    <span className="font-medium">CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig('format', 'pdf')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors flex-1",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      config.format === 'pdf'
                        ? "bg-primary/10 text-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    <PdfIcon className="h-6 w-6" />
                    <span className="font-medium">PDF</span>
                  </button>
                </div>
              </div>

              {/* Report Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Report Style</Label>
                <Select 
                  value={config.type} 
                  onValueChange={(v) => updateConfig('type', v as ReportConfig['type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">
                      <div className="flex flex-col items-start">
                        <span>Summary</span>
                        <span className="text-xs text-muted-foreground">High-level overview</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="detailed">
                      <div className="flex flex-col items-start">
                        <span>Detailed</span>
                        <span className="text-xs text-muted-foreground">Complete data analysis</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comparison">
                      <div className="flex flex-col items-start">
                        <span>Comparison</span>
                        <span className="text-xs text-muted-foreground">Period over period</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Categories Accordion */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Data to Include</Label>
                <Accordion type="multiple" defaultValue={['core', 'business']} className="border-none bg-transparent p-0">
                  {/* Core Metrics */}
                  <AccordionItem value="core" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>Core Metrics</span>
                        <span className="text-xs text-muted-foreground">({coreMetricsCount} selected)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="conversations"
                            checked={config.includeConversations}
                            onCheckedChange={(checked) => updateConfig('includeConversations', !!checked)}
                          />
                          <Label htmlFor="conversations" className="text-sm font-normal cursor-pointer">Conversations</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="conversationFunnel"
                            checked={config.includeConversationFunnel}
                            onCheckedChange={(checked) => updateConfig('includeConversationFunnel', !!checked)}
                          />
                          <Label htmlFor="conversationFunnel" className="text-sm font-normal cursor-pointer">Conversation Funnel</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="peakActivity"
                            checked={config.includePeakActivity}
                            onCheckedChange={(checked) => updateConfig('includePeakActivity', !!checked)}
                          />
                          <Label htmlFor="peakActivity" className="text-sm font-normal cursor-pointer">Peak Activity Heatmap</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="leads"
                            checked={config.includeLeads}
                            onCheckedChange={(checked) => updateConfig('includeLeads', !!checked)}
                          />
                          <Label htmlFor="leads" className="text-sm font-normal cursor-pointer">Leads</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="usage"
                            checked={config.includeUsageMetrics}
                            onCheckedChange={(checked) => updateConfig('includeUsageMetrics', !!checked)}
                          />
                          <Label htmlFor="usage" className="text-sm font-normal cursor-pointer">Usage Metrics</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Business Outcomes */}
                  <AccordionItem value="business" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>Business Outcomes</span>
                        <span className="text-xs text-muted-foreground">({businessOutcomesCount} selected)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="bookings"
                            checked={config.includeBookings}
                            onCheckedChange={(checked) => updateConfig('includeBookings', !!checked)}
                          />
                          <Label htmlFor="bookings" className="text-sm font-normal cursor-pointer">Bookings by Location</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="bookingTrend"
                            checked={config.includeBookingTrend}
                            onCheckedChange={(checked) => updateConfig('includeBookingTrend', !!checked)}
                          />
                          <Label htmlFor="bookingTrend" className="text-sm font-normal cursor-pointer">Booking Trend</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="satisfaction"
                            checked={config.includeSatisfaction}
                            onCheckedChange={(checked) => updateConfig('includeSatisfaction', !!checked)}
                          />
                          <Label htmlFor="satisfaction" className="text-sm font-normal cursor-pointer">Satisfaction Ratings</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="customerFeedback"
                            checked={config.includeCustomerFeedback}
                            onCheckedChange={(checked) => updateConfig('includeCustomerFeedback', !!checked)}
                          />
                          <Label htmlFor="customerFeedback" className="text-sm font-normal cursor-pointer">Customer Feedback</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="aiPerformance"
                            checked={config.includeAIPerformance}
                            onCheckedChange={(checked) => updateConfig('includeAIPerformance', !!checked)}
                          />
                          <Label htmlFor="aiPerformance" className="text-sm font-normal cursor-pointer">Ari Performance</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Traffic Analytics */}
                  <AccordionItem value="traffic" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>Traffic Analytics</span>
                        <span className="text-xs text-muted-foreground">({trafficCount} selected)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="trafficSources"
                            checked={config.includeTrafficSources}
                            onCheckedChange={(checked) => updateConfig('includeTrafficSources', !!checked)}
                          />
                          <Label htmlFor="trafficSources" className="text-sm font-normal cursor-pointer">Traffic Sources</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="trafficSourceTrend"
                            checked={config.includeTrafficSourceTrend}
                            onCheckedChange={(checked) => updateConfig('includeTrafficSourceTrend', !!checked)}
                          />
                          <Label htmlFor="trafficSourceTrend" className="text-sm font-normal cursor-pointer">Traffic Source Trend</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="topPages"
                            checked={config.includeTopPages}
                            onCheckedChange={(checked) => updateConfig('includeTopPages', !!checked)}
                          />
                          <Label htmlFor="topPages" className="text-sm font-normal cursor-pointer">Top Pages</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="pageEngagement"
                            checked={config.includePageEngagement}
                            onCheckedChange={(checked) => updateConfig('includePageEngagement', !!checked)}
                          />
                          <Label htmlFor="pageEngagement" className="text-sm font-normal cursor-pointer">Page Engagement Metrics</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="pageDepth"
                            checked={config.includePageDepth}
                            onCheckedChange={(checked) => updateConfig('includePageDepth', !!checked)}
                          />
                          <Label htmlFor="pageDepth" className="text-sm font-normal cursor-pointer">Page Depth Distribution</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="visitorLocations"
                            checked={config.includeVisitorLocations}
                            onCheckedChange={(checked) => updateConfig('includeVisitorLocations', !!checked)}
                          />
                          <Label htmlFor="visitorLocations" className="text-sm font-normal cursor-pointer">Visitor Locations</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Leads Analytics */}
                  <AccordionItem value="leads-analytics" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>Leads Analytics</span>
                        <span className="text-xs text-muted-foreground">({leadsAnalyticsCount} selected)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="leadSourceBreakdown"
                            checked={config.includeLeadSourceBreakdown}
                            onCheckedChange={(checked) => updateConfig('includeLeadSourceBreakdown', !!checked)}
                          />
                          <Label htmlFor="leadSourceBreakdown" className="text-sm font-normal cursor-pointer">Lead Source Breakdown</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="leadConversionTrend"
                            checked={config.includeLeadConversionTrend}
                            onCheckedChange={(checked) => updateConfig('includeLeadConversionTrend', !!checked)}
                          />
                          <Label htmlFor="leadConversionTrend" className="text-sm font-normal cursor-pointer">Lead Conversion Trend</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Agent Data */}
                  <AccordionItem value="agent" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>Agent Data</span>
                        <span className="text-xs text-muted-foreground">({agentDataCount} selected)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="agentPerformance"
                            checked={config.includeAgentPerformance}
                            onCheckedChange={(checked) => updateConfig('includeAgentPerformance', !!checked)}
                          />
                          <Label htmlFor="agentPerformance" className="text-sm font-normal cursor-pointer">Agent Performance</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Export Options */}
                  <AccordionItem value="options" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>Export Options</span>
                        <span className="text-xs text-muted-foreground">({exportOptionsCount} selected)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="kpis"
                            checked={config.includeKPIs}
                            onCheckedChange={(checked) => updateConfig('includeKPIs', !!checked)}
                          />
                          <Label htmlFor="kpis" className="text-sm font-normal cursor-pointer">KPI Summary</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="charts"
                            checked={config.includeCharts}
                            onCheckedChange={(checked) => updateConfig('includeCharts', !!checked)}
                          />
                          <Label htmlFor="charts" className="text-sm font-normal cursor-pointer">Charts</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="tables"
                            checked={config.includeTables}
                            onCheckedChange={(checked) => updateConfig('includeTables', !!checked)}
                          />
                          <Label htmlFor="tables" className="text-sm font-normal cursor-pointer">Data Tables</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Grouping */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Group Data By</Label>
                <Select 
                  value={config.grouping} 
                  onValueChange={(v) => updateConfig('grouping', v as ReportConfig['grouping'])}
                >
                  <SelectTrigger>
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

            <SheetFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="sm:flex-1">
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setStep('schedule')} className="sm:flex-1">
                Schedule Report
              </Button>
              <Button onClick={handleExport} loading={isExporting} className="sm:flex-1">
                Export Now
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <SheetTitle>Schedule Report</SheetTitle>
                  <SheetDescription>
                    Configure automated report delivery
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Report Name */}
              <div className="space-y-2">
                <Label htmlFor="schedule-name">Report Name</Label>
                <Input
                  id="schedule-name"
                  placeholder="e.g., Weekly Team Summary"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                />
              </div>

              {/* Frequency */}
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

              {/* Day Selection (for weekly/monthly) */}
              {frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
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
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time of Day</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                />
              </div>

              {/* Recipients */}
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

              {/* Summary of report config */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Configuration</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Format:</span> {config.format.toUpperCase()}</p>
                  <p><span className="text-muted-foreground">Style:</span> {config.type.charAt(0).toUpperCase() + config.type.slice(1)}</p>
                  <p><span className="text-muted-foreground">Date Range:</span> {datePreset === 'custom' ? 'Custom' : DATE_PRESETS.find(p => p.value === datePreset)?.label}</p>
                </div>
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBack} className="sm:flex-1">
                Back
              </Button>
              <Button 
                onClick={handleCreateSchedule} 
                disabled={!scheduleName || recipients.length === 0}
                loading={isScheduling}
                className="sm:flex-1"
              >
                Create Schedule
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
