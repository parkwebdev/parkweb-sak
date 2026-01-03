/**
 * @fileoverview Visible active filter chips with "Add filter" popover.
 * Displays current filters as dismissible badges and provides a popover to add/modify filters.
 */

import React, { useState } from 'react';
import { FilterLines, X, ChevronDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { hexToRgbObject } from '@/lib/color-utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { LeadStage } from '@/hooks/useLeadStages';

export type DateRangeFilter = 'all' | '7days' | '30days' | '90days';

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: '90days', label: 'Last 90 days' },
] as const;

interface LeadsActiveFiltersProps {
  /** Available pipeline stages */
  stages: LeadStage[];
  /** Currently selected stage IDs for filtering */
  selectedStageIds: string[];
  /** Handler for stage filter changes */
  onStageFilterChange: (stageIds: string[]) => void;
  /** Current date range filter */
  dateRange: DateRangeFilter;
  /** Handler for date range changes */
  onDateRangeChange: (range: DateRangeFilter) => void;
  /** Whether to show the add filter button (default: true) */
  showAddButton?: boolean;
  /** Whether to show active filter chips (default: true) */
  showChips?: boolean;
}

export const LeadsActiveFilters = React.memo(function LeadsActiveFilters({
  stages,
  selectedStageIds,
  onStageFilterChange,
  dateRange,
  onDateRangeChange,
  showAddButton = true,
  showChips = true,
}: LeadsActiveFiltersProps) {
  const [open, setOpen] = useState(false);

  // Get selected stages for display
  const selectedStages = stages.filter(s => selectedStageIds.includes(s.id));
  const hasStageFilter = selectedStageIds.length > 0;
  const hasDateFilter = dateRange !== 'all';
  const hasActiveFilters = hasStageFilter || hasDateFilter;

  const handleStageToggle = (stageId: string, checked: boolean) => {
    if (checked) {
      onStageFilterChange([...selectedStageIds, stageId]);
    } else {
      onStageFilterChange(selectedStageIds.filter(id => id !== stageId));
    }
  };

  const removeStageFilter = (stageId: string) => {
    onStageFilterChange(selectedStageIds.filter(id => id !== stageId));
  };

  const removeDateFilter = () => {
    onDateRangeChange('all');
  };

  const clearAllFilters = () => {
    onStageFilterChange([]);
    onDateRangeChange('all');
    setOpen(false);
  };

  const dateRangeLabel = DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Active stage filter chips */}
      {showChips && selectedStages.map(stage => (
        <Badge
          key={stage.id}
          variant="secondary"
          className="h-6 gap-1.5 pr-1 pl-2 text-xs font-normal"
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          {stage.name}
          <button
            onClick={() => removeStageFilter(stage.id)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
          >
            <X size={12} />
            <span className="sr-only">Remove {stage.name} filter</span>
          </button>
        </Badge>
      ))}

      {/* Active date filter chip */}
      {showChips && hasDateFilter && (
        <Badge
          variant="secondary"
          className="h-6 gap-1.5 pr-1 pl-2 text-xs font-normal"
        >
          {dateRangeLabel}
          <button
            onClick={removeDateFilter}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
          >
            <X size={12} />
            <span className="sr-only">Remove date filter</span>
          </button>
        </Badge>
      )}

      {/* Add filter popover */}
      {showAddButton && (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5"
          >
            <FilterLines size={14} />
            <span className="text-xs">Filter</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <div className="p-3 space-y-4">
            {/* Stage filters - Toggle Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Stage</Label>
              <div className="flex flex-wrap gap-1.5">
                {stages.map(stage => {
                  const isSelected = selectedStageIds.includes(stage.id);
                  const rgb = hexToRgbObject(stage.color);
                  const bgStyle = isSelected && rgb 
                    ? { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` }
                    : {};
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStageToggle(stage.id, !isSelected)}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        transition-all duration-150 border
                        ${isSelected 
                          ? 'border-transparent text-foreground' 
                          : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                        }
                      `}
                      style={bgStyle}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Date range filter - Toggle Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
              <div className="flex flex-wrap gap-1.5">
                {DATE_RANGE_OPTIONS.map(option => {
                  const isSelected = dateRange === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onDateRangeChange(option.value)}
                      className={`
                        px-2.5 py-1 rounded-full text-xs font-medium
                        transition-all duration-150 border
                        ${isSelected 
                          ? 'bg-accent border-transparent text-foreground' 
                          : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-muted-foreground hover:text-foreground"
                  onClick={clearAllFilters}
                >
                  <X size={14} className="mr-2" />
                  Clear all filters
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
      )}
    </div>
  );
});
