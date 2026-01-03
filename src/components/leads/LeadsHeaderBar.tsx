/**
 * @fileoverview Full-width header bar for the Leads page.
 * Provides view mode toggle, search, and display dropdown in a visually distinct bar.
 */

import React from 'react';
import { SearchMd, X } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ViewModeToggle } from './ViewModeToggle';
import { LeadsDisplayDropdown } from './LeadsDisplayDropdown';

interface LeadsHeaderBarProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Handler for view mode changes */
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  /** Current search query */
  searchQuery: string;
  /** Handler for search changes */
  onSearchChange: (query: string) => void;
  /** Handler to open full settings sheet */
  onOpenSettings: () => void;
  /** Number of active customizations (differs from defaults) */
  activeCustomizationCount: number;
}

export const LeadsHeaderBar = React.memo(function LeadsHeaderBar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  activeCustomizationCount,
}: LeadsHeaderBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-8 py-3">
        {/* Left: View Mode Toggle */}
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />

        {/* Center: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 pr-8"
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

        {/* Right: Display Dropdown */}
        <LeadsDisplayDropdown
          onOpenSettings={onOpenSettings}
          activeCustomizationCount={activeCustomizationCount}
        />
      </div>
    </div>
  );
});
