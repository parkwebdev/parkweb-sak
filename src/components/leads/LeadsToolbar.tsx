/**
 * @fileoverview Unified search toolbar for Leads page.
 * Shared across both Table and Kanban views.
 */

import React from 'react';
import { SearchLg } from '@untitledui/icons';
import { Input } from '@/components/ui/input';

interface LeadsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const LeadsToolbar = React.memo(function LeadsToolbar({
  searchQuery,
  onSearchChange,
}: LeadsToolbarProps) {
  return (
    <div className="flex items-center gap-4">
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
  );
});
