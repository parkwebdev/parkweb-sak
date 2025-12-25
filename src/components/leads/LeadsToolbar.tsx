/**
 * @fileoverview Unified toolbar for Leads page with search, filters, and view toggle.
 * Shared across both Table and Kanban views.
 */

import React from 'react';
import { SearchLg, LayoutAlt04, List } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LeadsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
}

export const LeadsToolbar = React.memo(function LeadsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: LeadsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative max-w-sm flex-1">
          <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('kanban')}
            aria-label="Kanban view"
          >
            <LayoutAlt04 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
