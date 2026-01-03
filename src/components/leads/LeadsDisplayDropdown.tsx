/**
 * @fileoverview Dropdown menu for display/sorting settings on the Leads page.
 * Provides inline sort options and field/column visibility toggles based on view mode.
 */

import React from 'react';
import { ChevronDown, ArrowUp, ArrowDown } from '@untitledui/icons';
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
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { SortOption } from '@/components/leads/LeadsViewSettingsSheet';
import { 
  CARD_FIELDS, 
  FIELD_GROUP_LABELS, 
  getFieldsByGroup,
  type CardFieldKey,
  type FieldGroup,
} from '@/components/leads/KanbanCardFields';
import { TABLE_COLUMNS } from '@/components/leads/LeadsViewSettingsSheet';
import type { VisibilityState } from '@tanstack/react-table';

interface LeadsDisplayDropdownProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Current sort option */
  sortOption: SortOption | null;
  /** Handler for sort changes */
  onSortChange: (sort: SortOption | null) => void;
  /** Visible kanban card fields (kanban mode) */
  visibleCardFields: Set<CardFieldKey>;
  /** Handler for toggling kanban card fields */
  onToggleCardField: (field: CardFieldKey) => void;
  /** Table column visibility (table mode) */
  columnVisibility: VisibilityState;
  /** Handler for column visibility changes */
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

const SORT_COLUMNS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Updated' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Company' },
] as const;

const GROUP_ORDER: FieldGroup[] = ['contact', 'session', 'organization', 'timestamps', 'notes'];

export const LeadsDisplayDropdown = React.memo(function LeadsDisplayDropdown({
  viewMode,
  sortOption,
  onSortChange,
  visibleCardFields,
  onToggleCardField,
  columnVisibility,
  onColumnVisibilityChange,
}: LeadsDisplayDropdownProps) {
  const currentColumn = sortOption?.column || 'created_at';
  const currentDirection = sortOption?.direction || 'desc';
  const fieldsByGroup = getFieldsByGroup();

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

  const handleTableColumnToggle = (columnId: string) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
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
      <DropdownMenuContent align="start" className="w-52 bg-popover">
        {/* Sorting Section */}
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

        {/* Properties Section - View mode dependent */}
        <DropdownMenuLabel>Properties</DropdownMenuLabel>
        
        {viewMode === 'kanban' ? (
          // Kanban: Show card field toggles with sub-menus per group
          <>
            {GROUP_ORDER.map(group => {
              const fields = fieldsByGroup[group];
              if (!fields?.length) return null;
              
              return (
                <DropdownMenuSub key={group}>
                  <DropdownMenuSubTrigger>
                    {FIELD_GROUP_LABELS[group]}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover">
                    {fields.map(field => (
                      <DropdownMenuCheckboxItem
                        key={field.key}
                        checked={visibleCardFields.has(field.key)}
                        onCheckedChange={() => onToggleCardField(field.key)}
                      >
                        <field.icon size={14} className="mr-2 text-muted-foreground" />
                        {field.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}
          </>
        ) : (
          // Table: Show column toggles inline
          <>
            {TABLE_COLUMNS.map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={columnVisibility[column.id] !== false}
                onCheckedChange={() => handleTableColumnToggle(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
