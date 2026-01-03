/**
 * @fileoverview Icon-only dropdown for sorting leads (kanban mode).
 */

import React from 'react';
import { SwitchVertical01, ArrowUp, ArrowDown, ChevronDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
] as const;

export const LeadsSortDropdown = React.memo(function LeadsSortDropdown({
  sortOption,
  onSortChange,
}: LeadsSortDropdownProps) {
  const currentColumn = sortOption?.column || 'created_at';
  const currentDirection = sortOption?.direction || 'desc';

  const handleColumnSelect = (column: string) => {
    // If same column, toggle direction; otherwise set new column with current direction
    if (column === currentColumn) {
      onSortChange({
        column: column as SortOption['column'],
        direction: currentDirection === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({
        column: column as SortOption['column'],
        direction: currentDirection,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
        >
          <SwitchVertical01 size={14} />
          <span className="text-xs">Sort</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-popover">
        <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
        {SORT_COLUMNS.map(col => (
          <DropdownMenuItem
            key={col.value}
            onClick={() => handleColumnSelect(col.value)}
            className="flex items-center justify-between"
          >
            <span>{col.label}</span>
            {currentColumn === col.value && (
              <span className="flex items-center gap-1 text-muted-foreground">
                {currentDirection === 'asc' ? (
                  <ArrowUp size={14} />
                ) : (
                  <ArrowDown size={14} />
                )}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
