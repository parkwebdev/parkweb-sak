/**
 * @fileoverview Dropdown menu for filtering leads by stage and date range.
 * Provides multi-select stage filtering and quick date range options.
 */

import React from 'react';
import { FilterLines, ChevronDown, X } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { LeadStage } from '@/hooks/useLeadStages';

export type DateRangeFilter = 'all' | '7days' | '30days' | '90days';

interface LeadsFiltersDropdownProps {
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
}

export const LeadsFiltersDropdown = React.memo(function LeadsFiltersDropdown({
  stages,
  selectedStageIds,
  onStageFilterChange,
  dateRange,
  onDateRangeChange,
}: LeadsFiltersDropdownProps) {
  // Count active filters
  const activeFilterCount = 
    (selectedStageIds.length > 0 && selectedStageIds.length < stages.length ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0);

  const handleStageToggle = (stageId: string, checked: boolean) => {
    if (checked) {
      onStageFilterChange([...selectedStageIds, stageId]);
    } else {
      onStageFilterChange(selectedStageIds.filter(id => id !== stageId));
    }
  };

  const handleClearFilters = () => {
    onStageFilterChange([]);
    onDateRangeChange('all');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 gap-1.5"
        >
          <FilterLines size={16} className="text-muted-foreground" />
          <span className="text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 px-1.5 text-2xs flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover">
        <DropdownMenuLabel>Stage</DropdownMenuLabel>
        {stages.map(stage => (
          <DropdownMenuCheckboxItem
            key={stage.id}
            checked={selectedStageIds.includes(stage.id)}
            onCheckedChange={(checked) => handleStageToggle(stage.id, checked)}
          >
            <span
              className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            {stage.name}
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Date Range</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRangeFilter)}>
          <DropdownMenuRadioItem value="all">All time</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="7days">Last 7 days</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="30days">Last 30 days</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="90days">Last 90 days</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {activeFilterCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
            >
              <X size={14} className="mr-2" />
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
