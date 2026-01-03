/**
 * @fileoverview Unified toolbar for the Leads page.
 * Provides search, display dropdown with badge counts, and view mode toggle.
 */

import React from 'react';
import { SearchMd, X } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ViewModeToggle } from './ViewModeToggle';
import { LeadsDisplayDropdown } from './LeadsDisplayDropdown';

interface LeadsToolbarProps {
  /** Current search query */
  searchQuery: string;
  /** Handler for search changes */
  onSearchChange: (query: string) => void;
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Handler for view mode changes */
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  /** Handler to open full settings sheet */
  onOpenSettings: () => void;
  /** Number of active customizations (differs from defaults) */
  activeCustomizationCount: number;
  /** Optional class name */
  className?: string;
}

export const LeadsToolbar = React.memo(function LeadsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onOpenSettings,
  activeCustomizationCount,
  className,
}: LeadsToolbarProps) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className ?? ''}`}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
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

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        <LeadsDisplayDropdown
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onOpenSettings={onOpenSettings}
          activeCustomizationCount={activeCustomizationCount}
        />
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
});
