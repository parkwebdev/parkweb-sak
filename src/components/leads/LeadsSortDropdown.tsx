/**
 * @fileoverview Dropdown menu for sorting leads.
 */

import React from 'react';
import { ChevronDown, ArrowUp, ArrowDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { SortOption } from '@/components/leads/LeadsViewSettingsSheet';

interface LeadsSortDropdownProps {
  /** Current sort option */
  sortOption: SortOption | null;
  /** Handler for sort changes */
  onSortChange: (sort: SortOption | null) => void;
}

const SORT_COLUMNS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Updated' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Company' },
] as const;

export const LeadsSortDropdown = React.memo(function LeadsSortDropdown({
  sortOption,
  onSortChange,
}: LeadsSortDropdownProps) {
  const currentColumn = sortOption?.column || 'created_at';
  const currentDirection = sortOption?.direction || 'desc';
  const currentLabel = SORT_COLUMNS.find(c => c.value === currentColumn)?.label || 'Created';

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
          {currentDirection === 'asc' ? (
            <ArrowUp size={14} className="text-muted-foreground" />
          ) : (
            <ArrowDown size={14} className="text-muted-foreground" />
          )}
          <span className="text-sm">{currentLabel}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 bg-popover">
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
              <ArrowDown size={16} className="mr-2" />
              Switch to Descending
            </>
          ) : (
            <>
              <ArrowUp size={16} className="mr-2" />
              Switch to Ascending
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
