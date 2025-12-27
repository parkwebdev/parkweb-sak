/**
 * ExportReportSheet Component
 * 
 * Stripe-inspired export configuration sheet with progressive disclosure.
 * Features date range pills, collapsible data category accordions, and clean UX.
 * @module components/analytics/ExportReportSheet
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface ReportConfig {
  type: 'summary' | 'detailed' | 'comparison';
  // Core Metrics
  includeConversations: boolean;
  includeLeads: boolean;
  includeUsageMetrics: boolean;
  // Business Outcomes
  includeBookings: boolean;
  includeSatisfaction: boolean;
  includeAIPerformance: boolean;
  // Traffic Analytics
  includeTrafficSources: boolean;
  includeTopPages: boolean;
  includeVisitorLocations: boolean;
  // Agent Data
  includeAgentPerformance: boolean;
  // Grouping & Export Options
  grouping: 'day' | 'week' | 'month';
  includeKPIs: boolean;
  includeCharts: boolean;
  includeTables: boolean;
}

type DatePreset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

interface ExportReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportFormat: 'csv' | 'pdf';
  config: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
  onExport: (startDate: Date, endDate: Date) => void;
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

export const ExportReportSheet = ({
  open,
  onOpenChange,
  exportFormat,
  config,
  onConfigChange,
  onExport,
}: ExportReportSheetProps) => {
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

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

  const handleExport = () => {
    const range = datePreset === 'custom' 
      ? { start: customDateRange?.from || new Date(), end: customDateRange?.to || new Date() }
      : getDateRangeFromPreset(datePreset);
    
    onExport(range.start, range.end);
    onOpenChange(false);
  };

  // Count selected items per category
  const coreMetricsCount = [config.includeConversations, config.includeLeads, config.includeUsageMetrics].filter(Boolean).length;
  const businessOutcomesCount = [config.includeBookings, config.includeSatisfaction, config.includeAIPerformance].filter(Boolean).length;
  const trafficCount = [config.includeTrafficSources, config.includeTopPages, config.includeVisitorLocations].filter(Boolean).length;
  const agentDataCount = config.includeAgentPerformance ? 1 : 0;
  const exportOptionsCount = [config.includeKPIs, config.includeCharts, config.includeTables].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Export Report</SheetTitle>
          <SheetDescription>
            Configure your {exportFormat.toUpperCase()} export settings
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
                  />
                </PopoverContent>
              </Popover>
            )}
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
                      <Label htmlFor="bookings" className="text-sm font-normal cursor-pointer">Bookings</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="satisfaction"
                        checked={config.includeSatisfaction}
                        onCheckedChange={(checked) => updateConfig('includeSatisfaction', !!checked)}
                      />
                      <Label htmlFor="satisfaction" className="text-sm font-normal cursor-pointer">Satisfaction</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="aiPerformance"
                        checked={config.includeAIPerformance}
                        onCheckedChange={(checked) => updateConfig('includeAIPerformance', !!checked)}
                      />
                      <Label htmlFor="aiPerformance" className="text-sm font-normal cursor-pointer">AI Performance</Label>
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
                        id="topPages"
                        checked={config.includeTopPages}
                        onCheckedChange={(checked) => updateConfig('includeTopPages', !!checked)}
                      />
                      <Label htmlFor="topPages" className="text-sm font-normal cursor-pointer">Top Pages</Label>
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
            <Label className="text-sm font-medium">Group data by</Label>
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

        <SheetFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export {exportFormat.toUpperCase()}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
