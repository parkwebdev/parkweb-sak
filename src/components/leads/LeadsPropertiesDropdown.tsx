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
                  {fields.map(field => {
                    const isSelected = visibleCardFields.has(field.key);
                    return (
                      <button
                        key={field.key}
                        onClick={() => onToggleCardField(field.key)}
                        className={`
                          w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm
                          transition-colors cursor-pointer
                          ${isSelected 
                            ? 'bg-accent text-accent-foreground border-l-2 border-l-primary pl-1.5' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border-l-2 border-l-transparent pl-1.5'
                          }
                        `}
                      >
                        <field.icon size={14} className={isSelected ? 'text-foreground' : 'text-muted-foreground'} />
                        {field.label}
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </>
        ) : (
          // Table: Show column toggles
          <>
            <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
            {TABLE_COLUMNS.map(column => {
              const isSelected = columnVisibility[column.id] !== false;
              return (
                <button
                  key={column.id}
                  onClick={() => handleTableColumnToggle(column.id)}
                  className={`
                    w-full flex items-center px-2 py-1.5 text-sm rounded-sm
                    transition-colors cursor-pointer
                    ${isSelected 
                      ? 'bg-accent text-accent-foreground border-l-2 border-l-primary pl-1.5' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border-l-2 border-l-transparent pl-1.5'
                    }
                  `}
                >
                  {column.label}
                </button>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
