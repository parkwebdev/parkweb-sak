/**
 * @fileoverview Icon-only dropdown for toggling field/column visibility.
 * Shows kanban card fields or table columns based on view mode.
 * Kanban has static header/footer fields and sortable body fields.
 * Table columns are fully sortable.
 */

import React from 'react';
import { Columns03, ChevronDown, DotsGrid } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
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
  type CardFieldKey,
} from '@/components/leads/KanbanCardFields';
import { TABLE_COLUMNS } from '@/components/leads/LeadsViewSettingsSheet';
import type { VisibilityState } from '@tanstack/react-table';

// Static fields that cannot be reordered (appear in header inline with name)
const KANBAN_HEADER_KEYS: CardFieldKey[] = ['priority', 'tags'];
// Footer fields that cannot be reordered (appear below divider)
const KANBAN_FOOTER_KEYS: CardFieldKey[] = ['createdAt', 'lastUpdated'];

interface LeadsPropertiesDropdownProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Visible kanban card fields (kanban mode) */
  visibleCardFields: Set<CardFieldKey>;
  /** Handler for toggling kanban card fields */
  onToggleCardField: (field: CardFieldKey) => void;
  /** Kanban field order */
  kanbanFieldOrder: CardFieldKey[];
  /** Handler for kanban field order changes */
  onKanbanFieldOrderChange: (order: CardFieldKey[]) => void;
  /** Table column visibility (table mode) */
  columnVisibility: VisibilityState;
  /** Handler for column visibility changes */
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  /** Table column order (table mode) */
  tableColumnOrder: string[];
  /** Handler for column order changes */
  onColumnOrderChange: (order: string[]) => void;
}

interface SortableItemProps {
  id: string;
  label: string;
  isVisible: boolean;
  onToggle: () => void;
}

function SortableItem({ id, label, isVisible, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
        id={`item-${id}`}
        checked={isVisible}
        onCheckedChange={onToggle}
        className="h-4 w-4"
      />
      <label
        htmlFor={`item-${id}`}
        className="text-sm cursor-pointer flex-1 select-none"
      >
        {label}
      </label>
    </div>
  );
}

/** Static item without drag handle - just checkbox toggle */
function StaticItem({ id, label, isVisible, onToggle }: SortableItemProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors">
      <div className="w-4 -ml-0.5" /> {/* Spacer to align with sortable items */}
      <Checkbox
        id={`item-${id}`}
        checked={isVisible}
        onCheckedChange={onToggle}
        className="h-4 w-4"
      />
      <label
        htmlFor={`item-${id}`}
        className="text-sm cursor-pointer flex-1 select-none"
      >
        {label}
      </label>
    </div>
  );
}

export const LeadsPropertiesDropdown = React.memo(function LeadsPropertiesDropdown({
  viewMode,
  visibleCardFields,
  onToggleCardField,
  kanbanFieldOrder,
  onKanbanFieldOrderChange,
  columnVisibility,
  onColumnVisibilityChange,
  tableColumnOrder,
  onColumnOrderChange,
}: LeadsPropertiesDropdownProps) {
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

  const handleTableDragEnd = (event: DragEndEvent) => {
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

  // Get kanban fields organized into sections
  const { headerFields, sortableFields, footerFields } = React.useMemo(() => {
    const fieldMap = new Map(CARD_FIELDS.map(field => [field.key, field]));
    
    // Header fields (static): priority, tags
    const headerFields = KANBAN_HEADER_KEYS
      .filter(key => fieldMap.has(key))
      .map(key => fieldMap.get(key)!);
    
    // Footer fields (static): createdAt, lastUpdated  
    const footerFields = KANBAN_FOOTER_KEYS
      .filter(key => fieldMap.has(key))
      .map(key => fieldMap.get(key)!);
    
    // Sortable body fields: everything except firstName, lastName, header, and footer
    const excludeFromSortable = new Set<CardFieldKey>([
      'firstName', 'lastName',
      ...KANBAN_HEADER_KEYS,
      ...KANBAN_FOOTER_KEYS,
    ]);
    
    const sortableFields = kanbanFieldOrder
      .filter(key => fieldMap.has(key) && !excludeFromSortable.has(key))
      .map(key => fieldMap.get(key)!);
    
    return { headerFields, sortableFields, footerFields };
  }, [kanbanFieldOrder]);

  // Handle drag end for sortable kanban fields only
  const handleKanbanDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Only reorder within sortable fields
    const sortableKeys = sortableFields.map(f => f.key);
    const oldIndex = sortableKeys.indexOf(active.id as CardFieldKey);
    const newIndex = sortableKeys.indexOf(over.id as CardFieldKey);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newSortableOrder = arrayMove(sortableKeys, oldIndex, newIndex);
    
    // Reconstruct full order: keep non-sortable positions, update sortable positions
    const excludeFromSortable = new Set<CardFieldKey>([
      'firstName', 'lastName',
      ...KANBAN_HEADER_KEYS,
      ...KANBAN_FOOTER_KEYS,
    ]);
    
    let sortableIndex = 0;
    const newFullOrder = kanbanFieldOrder.map(key => {
      if (excludeFromSortable.has(key)) return key;
      return newSortableOrder[sortableIndex++] || key;
    });
    
    onKanbanFieldOrderChange(newFullOrder);
  };

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
          // Kanban: Organized into header (static), body (sortable), footer (static)
          <>
            {/* Header fields - static, shown inline with name */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Header</DropdownMenuLabel>
            {headerFields.map(field => (
              <StaticItem
                key={field.key}
                id={field.key}
                label={field.label}
                isVisible={visibleCardFields.has(field.key)}
                onToggle={() => onToggleCardField(field.key)}
              />
            ))}

            <Separator className="my-1.5" />

            {/* Body fields - sortable */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Card Body</DropdownMenuLabel>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleKanbanDragEnd}
            >
              <SortableContext
                items={sortableFields.map(f => f.key)}
                strategy={verticalListSortingStrategy}
              >
                {sortableFields.map(field => (
                  <SortableItem
                    key={field.key}
                    id={field.key}
                    label={field.label}
                    isVisible={visibleCardFields.has(field.key)}
                    onToggle={() => onToggleCardField(field.key)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Separator className="my-1.5" />

            {/* Footer fields - static, shown below divider */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">Footer</DropdownMenuLabel>
            {footerFields.map(field => (
              <StaticItem
                key={field.key}
                id={field.key}
                label={field.label}
                isVisible={visibleCardFields.has(field.key)}
                onToggle={() => onToggleCardField(field.key)}
              />
            ))}
          </>
        ) : (
          // Table: Sortable column toggles
          <>
            <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTableDragEnd}
            >
              <SortableContext
                items={orderedColumns.map(col => col.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedColumns.map(column => {
                  const isVisible = columnVisibility[column.id] !== false;
                  return (
                    <SortableItem
                      key={column.id}
                      id={column.id}
                      label={column.label}
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
