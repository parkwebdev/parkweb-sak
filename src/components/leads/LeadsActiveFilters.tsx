/**
 * @fileoverview Filter popover for leads.
 * Provides stage, assignee, and date range filtering in a dropdown.
 */

import React, { useState } from 'react';
import { FilterLines, X, ChevronDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { hexToRgbObject } from '@/lib/color-utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LeadStage } from '@/hooks/useLeadStages';
import type { TeamMember } from '@/types/team';

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
  /** Available team members for assignee filtering */
  teamMembers?: TeamMember[];
  /** Currently selected assignee user IDs for filtering */
  selectedAssigneeIds?: string[];
  /** Handler for assignee filter changes */
  onAssigneeFilterChange?: (userIds: string[]) => void;
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
  teamMembers = [],
  selectedAssigneeIds = [],
  onAssigneeFilterChange,
  showAddButton = true,
  showChips = true,
}: LeadsActiveFiltersProps) {
  const [open, setOpen] = useState(false);

  // Get selected stages for display
  const hasStageFilter = selectedStageIds.length > 0;
  const hasDateFilter = dateRange !== 'all';
  const hasAssigneeFilter = selectedAssigneeIds.length > 0;
  const hasActiveFilters = hasStageFilter || hasDateFilter || hasAssigneeFilter;
  const activeFilterCount = selectedStageIds.length + (hasDateFilter ? 1 : 0) + selectedAssigneeIds.length;

  const handleStageToggle = (stageId: string, checked: boolean) => {
    if (checked) {
      onStageFilterChange([...selectedStageIds, stageId]);
    } else {
      onStageFilterChange(selectedStageIds.filter(id => id !== stageId));
    }
  };

  const handleAssigneeToggle = (userId: string, checked: boolean) => {
    if (!onAssigneeFilterChange) return;
    if (checked) {
      onAssigneeFilterChange([...selectedAssigneeIds, userId]);
    } else {
      onAssigneeFilterChange(selectedAssigneeIds.filter(id => id !== userId));
    }
  };

  const clearAllFilters = () => {
    onStageFilterChange([]);
    onDateRangeChange('all');
    onAssigneeFilterChange?.([]);
    setOpen(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter button - no chips shown
  if (!showAddButton) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
        >
          <FilterLines size={14} />
          <span className="text-xs">Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium px-1">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
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

          {/* Assignee filters */}
          {teamMembers.length > 0 && onAssigneeFilterChange && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Assignee</Label>
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map(member => {
                    const isSelected = selectedAssigneeIds.includes(member.user_id);
                    
                    return (
                      <button
                        key={member.user_id}
                        onClick={() => handleAssigneeToggle(member.user_id, !isSelected)}
                        className={`
                          inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                          transition-all duration-150 border
                          ${isSelected 
                            ? 'bg-accent border-transparent text-foreground' 
                            : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                          }
                        `}
                      >
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(member.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.display_name || 'Unknown'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

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
  );
});
