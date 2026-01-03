/**
 * @fileoverview Icon-only dropdown for toggling field/column visibility.
 * Shows kanban card fields or table columns based on view mode.
 * Table columns support drag-to-reorder.
 */

import React from 'react';
import { Columns03, ChevronDown, DotsGrid } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  /** Table column order (table mode) */
  tableColumnOrder: string[];
  /** Handler for column order changes */
  onColumnOrderChange: (order: string[]) => void;
}

const GROUP_ORDER: FieldGroup[] = ['contact', 'session', 'organization', 'timestamps', 'notes'];

interface SortableColumnItemProps {
  column: { id: string; label: string };
  isVisible: boolean;
  onToggle: () => void;
}

function SortableColumnItem({ column, isVisible, onToggle }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 -ml-0.5 rounded hover:bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <DotsGrid size={12} className="text-muted-foreground/60" />
      </button>
      <Checkbox
        id={`col-${column.id}`}
        checked={isVisible}
        onCheckedChange={onToggle}
        className="h-4 w-4"
      />
      <label
        htmlFor={`col-${column.id}`}
        className="text-sm cursor-pointer flex-1 select-none"
      >
        {column.label}
      </label>
    </div>
  );
}

export const LeadsPropertiesDropdown = React.memo(function LeadsPropertiesDropdown({
  viewMode,
  visibleCardFields,
  onToggleCardField,
  columnVisibility,
  onColumnVisibilityChange,
  tableColumnOrder,
  onColumnOrderChange,
}: LeadsPropertiesDropdownProps) {
  const fieldsByGroup = getFieldsByGroup();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTableColumnToggle = (columnId: string) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tableColumnOrder.indexOf(active.id as string);
      const newIndex = tableColumnOrder.indexOf(over.id as string);
      const newOrder = arrayMove(tableColumnOrder, oldIndex, newIndex);
      onColumnOrderChange(newOrder);
    }
  };

  // Get ordered columns based on tableColumnOrder
  const orderedColumns = React.useMemo(() => {
    const columnMap = new Map(TABLE_COLUMNS.map(col => [col.id, col]));
    return tableColumnOrder
      .filter(id => columnMap.has(id))
      .map(id => columnMap.get(id)!);
  }, [tableColumnOrder]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
        >
          <Columns03 size={14} />
          <span className="text-xs">{viewMode === 'kanban' ? 'Fields' : 'Columns'}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
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
                      <div
                        key={field.key}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors"
                      >
                        <field.icon size={14} className="text-muted-foreground/60" />
                        <Checkbox
                          id={`field-${field.key}`}
                          checked={isSelected}
                          onCheckedChange={() => onToggleCardField(field.key)}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`field-${field.key}`}
                          className="text-sm cursor-pointer flex-1 select-none"
                        >
                          {field.label}
                        </label>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </>
        ) : (
          // Table: Show sortable column toggles
          <>
            <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedColumns.map(col => col.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedColumns.map(column => {
                  const isVisible = columnVisibility[column.id] !== false;
                  return (
                    <SortableColumnItem
                      key={column.id}
                      column={column}
                      isVisible={isVisible}
                      onToggle={() => handleTableColumnToggle(column.id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
