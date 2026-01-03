/**
 * @fileoverview Full-width header bar for the Leads page.
 * Clean layout: Search | Active Filters | Icon Controls | View Toggle
 */

import React from 'react';
import { SearchMd, X } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ViewModeToggle } from './ViewModeToggle';
import { LeadsActiveFilters, type DateRangeFilter } from './LeadsActiveFilters';
import { LeadsSortDropdown } from './LeadsSortDropdown';
import { LeadsPropertiesDropdown } from './LeadsPropertiesDropdown';
import type { LeadStage } from '@/hooks/useLeadStages';
import type { SortOption } from '@/components/leads/LeadsViewSettingsSheet';
import type { CardFieldKey } from '@/components/leads/KanbanCardFields';
import type { VisibilityState } from '@tanstack/react-table';

interface LeadsHeaderBarProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Handler for view mode changes */
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  /** Current search query */
  searchQuery: string;
  /** Handler for search changes */
  onSearchChange: (query: string) => void;
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
  /** Current sort option */
  sortOption: SortOption | null;
  /** Handler for sort changes */
  onSortChange: (sort: SortOption | null) => void;
  /** Visible kanban card fields */
  visibleCardFields: Set<CardFieldKey>;
  /** Handler for toggling kanban card fields */
  onToggleCardField: (field: CardFieldKey) => void;
  /** Table column visibility */
  columnVisibility: VisibilityState;
  /** Handler for column visibility changes */
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

export const LeadsHeaderBar = React.memo(function LeadsHeaderBar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  stages,
  selectedStageIds,
  onStageFilterChange,
  dateRange,
  onDateRangeChange,
  sortOption,
  onSortChange,
  visibleCardFields,
  onToggleCardField,
  columnVisibility,
  onColumnVisibilityChange,
}: LeadsHeaderBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 lg:px-8 py-3">
        {/* Search - compact */}
        <div className="w-48 lg:w-64 flex-shrink-0">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-9 pr-8"
            />
            <SearchMd className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => onSearchChange('')}
              >
                <X size={14} />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active filter chips + Add filter button */}
        <LeadsActiveFilters
          stages={stages}
          selectedStageIds={selectedStageIds}
          onStageFilterChange={onStageFilterChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right controls - icon buttons */}
        <div className="flex items-center gap-1">
          {viewMode === 'kanban' && (
            <LeadsSortDropdown
              sortOption={sortOption}
              onSortChange={onSortChange}
            />
          )}
          <LeadsPropertiesDropdown
            viewMode={viewMode}
            visibleCardFields={visibleCardFields}
            onToggleCardField={onToggleCardField}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
          />
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>
      </div>
    </div>
  );
});
