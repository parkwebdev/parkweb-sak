/**
 * @fileoverview Icon-only dropdown for toggling field/column visibility.
 * Shows kanban card fields or table columns based on view mode.
 */

import React from 'react';
import { Settings01 } from '@untitledui/icons';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Settings01 size={16} className="text-muted-foreground" />
              <span className="sr-only">Properties</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Properties</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-52 bg-popover max-h-80 overflow-y-auto">
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
