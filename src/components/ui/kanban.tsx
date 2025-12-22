/**
 * @fileoverview Reusable Kanban board primitives built on dnd-kit.
 * Matches the shadcn kanban component API pattern with render props.
 */

"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  defaultAnimateLayoutChanges,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type { DragEndEvent } from "@dnd-kit/core";

// Smooth drop animation configuration
const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
  duration: 200,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

// Custom animate layout changes for smoother reordering
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

// Base types for kanban items and columns
type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

// Context type
type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
  activeCardContent: ReactNode | null;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
  activeCardContent: null,
});

// KanbanBoard - Droppable column container
export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-80 shrink-0 flex-col rounded-lg bg-muted/40 p-2 transition-all duration-200",
        isOver && "ring-2 ring-primary/20 bg-muted/60",
        className
      )}
    >
      {children}
    </div>
  );
};

// KanbanCard - Draggable card component
export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
};

export const KanbanCard = <T extends KanbanItemProps>({
  id,
  name,
  children,
  className,
}: KanbanCardProps<T>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    animateLayoutChanges,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style: React.CSSProperties = {
    transition,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing transition-shadow duration-200",
        isDragging && "opacity-50 shadow-lg scale-[1.02]",
        !isDragging && "hover:shadow-md",
        className
      )}
    >
      <div className="select-none">
        {children ?? <p className="text-sm font-medium">{name}</p>}
      </div>
    </Card>
  );
};

// KanbanCards - Sortable context wrapper with scroll area
export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "id"
> & {
  children: (item: T) => ReactNode;
  id: string;
};

export const KanbanCards = <T extends KanbanItemProps>({
  children,
  className,
  id,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === id);
  const items = filteredData.map((item) => item.id);

  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <ScrollArea className="max-h-[calc(100vh-320px)]">
        <div
          className={cn("flex flex-col gap-2 p-0.5 min-h-[100px]", className)}
          {...props}
        >
          {filteredData.map(children)}
        </div>
        <ScrollBar />
      </ScrollArea>
    </SortableContext>
  );
};

// KanbanHeader - Column header
export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div
    className={cn("flex items-center justify-between p-2", className)}
    {...props}
  />
);

// KanbanProvider - Main context provider with DnD
export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps
> = Omit<DndContextProps, "children"> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  renderOverlay?: (item: T) => ReactNode;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  renderOverlay,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeCardContent, setActiveCardContent] = useState<ReactNode | null>(null);
  
  // LOCAL state for visual updates during drag - only committed on dragEnd
  const [localData, setLocalData] = useState<T[]>(data);

  // Sync external data changes when NOT dragging
  useEffect(() => {
    if (!activeCardId) {
      setLocalData(data);
    }
  }, [data, activeCardId]);

  // Add activation constraints to prevent accidental drags
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = localData.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(event.active.id as string);
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = localData.find((item) => item.id === active.id);
    const overItem = localData.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id;

    if (!overColumn) {
      return;
    }

    // Moving to a different column
    if (activeColumn !== overColumn) {
      setLocalData((prev) => {
        const newData = [...prev];
        const activeIndex = newData.findIndex((item) => item.id === active.id);
        
        // Update the column
        newData[activeIndex] = { ...newData[activeIndex], column: overColumn };
        
        // If dropping on another item, reorder
        if (overItem) {
          const overIndex = newData.findIndex((item) => item.id === over.id);
          return arrayMove(newData, activeIndex, overIndex);
        }
        
        return newData;
      });
    } 
    // Same column reordering
    else if (overItem && active.id !== over.id) {
      setLocalData((prev) => {
        const activeIndex = prev.findIndex((item) => item.id === active.id);
        const overIndex = prev.findIndex((item) => item.id === over.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          return arrayMove(prev, activeIndex, overIndex);
        }
        return prev;
      });
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Commit the local state to parent
    if (activeCardId) {
      onDataChange?.(localData);
    }
    
    setActiveCardId(null);
    setActiveCardContent(null);
    onDragEnd?.(event);
  };

  const handleDragCancel = () => {
    // Reset to original data on cancel
    setLocalData(data);
    setActiveCardId(null);
    setActiveCardContent(null);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const item = localData.find((item) => item.id === active.id);
      const columnName = columns.find((col) => col.id === item?.column)?.name;
      return `Picked up card "${item?.name}" from "${columnName}" column`;
    },
    onDragOver({ active, over }) {
      const item = localData.find((item) => item.id === active.id);
      const newColumn = columns.find((col) => col.id === over?.id)?.name;
      if (newColumn) {
        return `Dragged card "${item?.name}" over "${newColumn}" column`;
      }
      return "";
    },
    onDragEnd({ active, over }) {
      const item = localData.find((item) => item.id === active.id);
      const newColumn = columns.find((col) => col.id === over?.id)?.name;
      if (newColumn) {
        return `Dropped card "${item?.name}" into "${newColumn}" column`;
      }
      return `Dropped card "${item?.name}"`;
    },
    onDragCancel({ active }) {
      const item = localData.find((item) => item.id === active.id);
      return `Cancelled dragging card "${item?.name}"`;
    },
  };

  // Get active card data for overlay
  const activeCard = activeCardId ? localData.find((item) => item.id === activeCardId) : null;

  return (
    <KanbanContext.Provider value={{ columns, data: localData, activeCardId, activeCardContent }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{ announcements }}
        {...props}
      >
        <div className={cn("flex gap-4 p-1", className)}>
          {columns.map((column) => children(column))}
        </div>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeCard ? (
                renderOverlay ? (
                  <div className="w-80">
                    {renderOverlay(activeCard)}
                  </div>
                ) : (
                  <Card className="w-80 cursor-grabbing rounded-md border bg-card p-3 shadow-xl ring-2 ring-primary/20">
                    <p className="text-sm font-medium">{activeCard.name}</p>
                  </Card>
                )
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
