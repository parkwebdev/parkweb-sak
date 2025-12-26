/**
 * AnalyticsToolbar Component
 * 
 * Toolbar with unified date picker, filters, and actions.
 * Uses dynamic lead stages from database for filtering.
 * @module components/analytics/AnalyticsToolbar
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FilterLines, RefreshCcw01, Beaker02 } from '@untitledui/icons';
import { AnalyticsDatePicker } from './AnalyticsDatePicker';
import { useLeadStages } from '@/hooks/useLeadStages';

/** Analytics filter configuration */
export interface AnalyticsFilters {
  leadStatus: string;
  conversationStatus: string;
}

interface AnalyticsToolbarProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  comparisonMode: boolean;
  onComparisonModeChange: (enabled: boolean) => void;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
  onComparisonDateChange: (start: Date, end: Date) => void;
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onRefresh: () => void;
  /** Mock data mode toggle (dev only) */
  mockMode?: boolean;
  onMockModeChange?: (enabled: boolean) => void;
  onRegenerateMockData?: () => void;
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
  mockMode,
  onMockModeChange,
  onRegenerateMockData,
}: AnalyticsToolbarProps) => {
  const { stages } = useLeadStages();

  const activeFilterCount = [
    filters.leadStatus !== 'all',
    filters.conversationStatus !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-b border-border pb-4">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Unified Date Picker with Compare */}
        <AnalyticsDatePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={onDateChange}
          comparisonMode={comparisonMode}
          onComparisonModeChange={onComparisonModeChange}
          comparisonStartDate={comparisonStartDate}
          comparisonEndDate={comparisonEndDate}
          onComparisonDateChange={onComparisonDateChange}
        />

        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
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
                  <Label className="text-xs text-muted-foreground">Lead Stage</Label>
                  <Select
                    value={filters.leadStatus}
                    onValueChange={(value) => onFiltersChange({ ...filters, leadStatus: value })}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Conversation Status</Label>
                  <Select
                    value={filters.conversationStatus}
                    onValueChange={(value) => onFiltersChange({ ...filters, conversationStatus: value })}
                  >
                    <SelectTrigger size="sm">
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
                    onClick={() => onFiltersChange({ leadStatus: 'all', conversationStatus: 'all' })}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center">
        {/* Mock Data Toggle - Dev Only */}
        {onMockModeChange && (
          <div className="flex items-center gap-2 px-2 py-1 bg-warning/10 border border-warning/30 rounded-md">
            <Beaker02 className="h-4 w-4 text-warning" />
            <Label htmlFor="mock-toggle" className="text-xs font-medium text-warning cursor-pointer">
              Mock Data
            </Label>
            <Switch
              id="mock-toggle"
              checked={mockMode}
              onCheckedChange={onMockModeChange}
              className="scale-75"
              aria-label="Toggle mock data mode"
            />
            {mockMode && onRegenerateMockData && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-warning hover:bg-warning/20"
                onClick={onRegenerateMockData}
                aria-label="Regenerate mock data"
              >
                <RefreshCcw01 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Refresh analytics">
          <RefreshCcw01 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
