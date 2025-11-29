import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, FilterLines, Download01, RefreshCcw01 } from '@untitledui/icons';
import { DateRangePicker } from './DateRangePicker';
import { ComparisonPeriodSelector } from './ComparisonPeriodSelector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PdfIcon, CsvIcon } from './ExportIcons';
import { useAgents } from '@/hooks/useAgents';
import { format } from 'date-fns';

interface AnalyticsToolbarProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  comparisonMode: boolean;
  onComparisonModeChange: (enabled: boolean) => void;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  onComparisonDateChange: (start: Date, end: Date) => void;
  filters: {
    agentId: string;
    leadStatus: string;
    conversationStatus: string;
  };
  onFiltersChange: (filters: any) => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const AnalyticsToolbar = ({
  startDate,
  endDate,
  onDateChange,
  comparisonMode,
  onComparisonModeChange,
  comparisonStartDate,
  comparisonEndDate,
  onComparisonDateChange,
  filters,
  onFiltersChange,
  onRefresh,
  onExportCSV,
  onExportPDF,
}: AnalyticsToolbarProps) => {
  const { agents } = useAgents();

  const activeFilterCount = [
    filters.agentId !== 'all',
    filters.leadStatus !== 'all',
    filters.conversationStatus !== 'all',
  ].filter(Boolean).length;

  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-b border-border pb-4">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDateRange(startDate, endDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={onDateChange}
              showExternalPresets={false}
            />
          </PopoverContent>
        </Popover>

        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <FilterLines className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Filter Analytics</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Agent</Label>
                  <Select
                    value={filters.agentId}
                    onValueChange={(value) => onFiltersChange({ ...filters, agentId: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lead Status</Label>
                  <Select
                    value={filters.leadStatus}
                    onValueChange={(value) => onFiltersChange({ ...filters, leadStatus: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Conversation Status</Label>
                  <Select
                    value={filters.conversationStatus}
                    onValueChange={(value) => onFiltersChange({ ...filters, conversationStatus: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="human_takeover">Human Takeover</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8"
                    onClick={() => onFiltersChange({ agentId: 'all', leadStatus: 'all', conversationStatus: 'all' })}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Compare Toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="compare"
            checked={comparisonMode}
            onCheckedChange={onComparisonModeChange}
          />
          <Label htmlFor="compare" className="text-sm cursor-pointer">
            Compare
          </Label>
        </div>

        {/* Comparison Period Selector */}
        {comparisonMode && (
          <ComparisonPeriodSelector
            currentStartDate={startDate}
            currentEndDate={endDate}
            comparisonStartDate={comparisonStartDate}
            comparisonEndDate={comparisonEndDate}
            onComparisonDateChange={onComparisonDateChange}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-9">
          <RefreshCcw01 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Download01 className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportCSV}>
              <CsvIcon className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <PdfIcon className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
