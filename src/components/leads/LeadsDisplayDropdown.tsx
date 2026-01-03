/**
 * @fileoverview Dropdown menu for display/sorting settings on the Leads page.
 * Provides inline sort options and access to field customization.
 */

import React from 'react';
import { ChevronDown, ArrowUp, ArrowDown, Columns03 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { SortOption } from '@/components/leads/LeadsViewSettingsSheet';

interface LeadsDisplayDropdownProps {
  /** Current sort option */
  sortOption: SortOption | null;
  /** Handler for sort changes */
  onSortChange: (sort: SortOption | null) => void;
  /** Handler to open fields/columns settings */
  onOpenFieldsSettings: () => void;
}

const SORT_COLUMNS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Updated' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Company' },
] as const;

export const LeadsDisplayDropdown = React.memo(function LeadsDisplayDropdown({
  sortOption,
  onSortChange,
  onOpenFieldsSettings,
}: LeadsDisplayDropdownProps) {
  const currentColumn = sortOption?.column || 'created_at';
  const currentDirection = sortOption?.direction || 'desc';

  const handleColumnChange = (column: string) => {
    onSortChange({
      column: column as SortOption['column'],
      direction: currentDirection,
    });
  };

  const handleToggleDirection = () => {
    onSortChange({
      column: currentColumn as SortOption['column'],
      direction: currentDirection === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 gap-1.5"
        >
          <span className="text-sm">Display</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-popover">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={currentColumn} onValueChange={handleColumnChange}>
          {SORT_COLUMNS.map(col => (
            <DropdownMenuRadioItem key={col.value} value={col.value}>
              {col.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleToggleDirection}>
          {currentDirection === 'asc' ? (
            <>
              <ArrowUp size={16} className="mr-2" />
              Ascending
            </>
          ) : (
            <>
              <ArrowDown size={16} className="mr-2" />
              Descending
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onOpenFieldsSettings}>
          <Columns03 size={16} className="mr-2" />
          Customize Fields...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
