/**
 * @fileoverview Dropdown menu for toggling field/column visibility.
 * Shows kanban card fields or table columns based on view mode.
 */

import React from 'react';
import { ChevronDown, LayoutGrid01, Rows03 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { 
  CARD_FIELDS, 
  FIELD_GROUP_LABELS, 
  getFieldsByGroup,
  type CardFieldKey,
  type FieldGroup,
} from '@/components/leads/KanbanCardFields';
import { TABLE_COLUMNS } from '@/components/leads/LeadsViewSettingsSheet';
import type { VisibilityState } from '@tanstack/react-table';

interface LeadsPropertiesDropdownProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Visible kanban card fields (kanban mode) */
  visibleCardFields: Set<CardFieldKey>;
  /** Handler for toggling kanban card fields */
  onToggleCardField: (field: CardFieldKey) => void;
  /** Table column visibility (table mode) */
  columnVisibility: VisibilityState;
  /** Handler for column visibility changes */
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

const GROUP_ORDER: FieldGroup[] = ['contact', 'session', 'organization', 'timestamps', 'notes'];

export const LeadsPropertiesDropdown = React.memo(function LeadsPropertiesDropdown({
  viewMode,
  visibleCardFields,
  onToggleCardField,
  columnVisibility,
  onColumnVisibilityChange,
}: LeadsPropertiesDropdownProps) {
  const fieldsByGroup = getFieldsByGroup();

  const handleTableColumnToggle = (columnId: string) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
    });
  };

  // Count visible properties
  const visibleCount = viewMode === 'kanban' 
    ? visibleCardFields.size 
    : TABLE_COLUMNS.filter(col => columnVisibility[col.id] !== false).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 gap-1.5"
        >
          {viewMode === 'kanban' ? (
            <LayoutGrid01 size={14} className="text-muted-foreground" />
          ) : (
            <Rows03 size={14} className="text-muted-foreground" />
          )}
          <span className="text-sm">Properties</span>
          <span className="text-xs text-muted-foreground">({visibleCount})</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 bg-popover max-h-80 overflow-y-auto">
        {viewMode === 'kanban' ? (
          // Kanban: Show card field toggles grouped
          <>
            {GROUP_ORDER.map((group, groupIndex) => {
              const fields = fieldsByGroup[group];
              if (!fields?.length) return null;
              
              return (
                <React.Fragment key={group}>
                  {groupIndex > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs">
                    {FIELD_GROUP_LABELS[group]}
                  </DropdownMenuLabel>
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
                </React.Fragment>
              );
            })}
          </>
        ) : (
          // Table: Show column toggles
          <>
            <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
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
