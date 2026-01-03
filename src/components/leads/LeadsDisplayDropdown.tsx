/**
 * @fileoverview Dropdown menu for quick display/filter access on the Leads page.
 * Shows a badge when customizations differ from defaults.
 */

import React from 'react';
import { FilterLines, Settings01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface LeadsDisplayDropdownProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Handler for view mode changes */
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  /** Handler to open full settings sheet */
  onOpenSettings: () => void;
  /** Number of active customizations */
  activeCustomizationCount: number;
}

export const LeadsDisplayDropdown = React.memo(function LeadsDisplayDropdown({
  viewMode,
  onViewModeChange,
  onOpenSettings,
  activeCustomizationCount,
}: LeadsDisplayDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 relative"
        >
          <FilterLines size={16} />
          {activeCustomizationCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-2xs flex items-center justify-center"
            >
              {activeCustomizationCount}
            </Badge>
          )}
          <span className="sr-only">Display options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => onViewModeChange('kanban')}
          className="justify-between"
        >
          <span>Kanban View</span>
          {viewMode === 'kanban' && (
            <span className="text-primary text-xs">Active</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onViewModeChange('table')}
          className="justify-between"
        >
          <span>Table View</span>
          {viewMode === 'table' && (
            <span className="text-primary text-xs">Active</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings01 size={16} className="mr-2" />
          All Settings
          {activeCustomizationCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto h-5 px-1.5 text-2xs"
            >
              {activeCustomizationCount}
            </Badge>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
