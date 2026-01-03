/**
 * @fileoverview Dropdown menu for display settings on the Leads page.
 * Shows a "Display" button with chevron and badge for active customizations.
 */

import React from 'react';
import { ChevronDown, Settings01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface LeadsDisplayDropdownProps {
  /** Handler to open full settings sheet */
  onOpenSettings: () => void;
  /** Number of active customizations */
  activeCustomizationCount: number;
}

export const LeadsDisplayDropdown = React.memo(function LeadsDisplayDropdown({
  onOpenSettings,
  activeCustomizationCount,
}: LeadsDisplayDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-1.5"
        >
          <span className="text-sm">Display</span>
          {activeCustomizationCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 px-1.5 text-2xs flex items-center justify-center"
            >
              {activeCustomizationCount}
            </Badge>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings01 size={16} className="mr-2" />
          View Settings
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
