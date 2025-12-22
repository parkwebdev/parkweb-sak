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
import { createPortal, unstable_batchedUpdates } from "react-dom";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  type UniqueIdentifier,
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
  easing: "ease-out",
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
        isDragging && "opacity-50 shadow-lg",
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

  // Local state used for visual updates during drag; only committed to parent on drag end.
  const [localData, setLocalData] = useState<T[]>(data);

  // Clone original drag-start state so we can restore on cancel.
  const [clonedData, setClonedData] = useState<T[] | null>(null);

  // From official dnd-kit MultipleContainers pattern: stabilizes collision detection to prevent flicker.
  const lastOverId = React.useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = React.useRef(false);

  // Track the item's container at drag start (official pattern).
  // This prevents "snap back" when the item crosses columns during dragOver.
  const activeContainerRef = React.useRef<string | null>(null);

  // Prevent flash when parent data refetches right after we commit a drag.
  const commitTimeRef = React.useRef<number>(0);

  // Sync external data changes when NOT dragging.
  useEffect(() => {
    if (!activeCardId) {
      // Ignore data updates for 500ms after commit to prevent flash
      if (Date.now() - commitTimeRef.current < 500) return;
      setLocalData(data);
    }
  }, [data, activeCardId]);

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

  const isColumnId = React.useCallback(
    (id: UniqueIdentifier) => columns.some((c) => c.id === id),
    [columns]
  );

  const findContainer = React.useCallback(
    (id: UniqueIdentifier) => {
      if (isColumnId(id)) return String(id);
      const item = localData.find((i) => i.id === id);
      return item?.column;
    },
    [isColumnId, localData]
  );

  const getColumnItems = React.useCallback(
    (source: T[], columnId: string) => source.filter((i) => i.column === columnId),
    []
  );

  const flattenByColumns = React.useCallback(
    (byColumn: Map<string, T[]>) => {
      const out: T[] = [];
      for (const col of columns) {
        const items = byColumn.get(col.id) ?? [];
        out.push(...items);
      }
      return out;
    },
    [columns]
  );

  // Precompute column item IDs map for O(1) lookup in collision detection
  const columnItemIdsMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const col of columns) {
      map.set(col.id, new Set(localData.filter((i) => i.column === col.id).map((i) => i.id)));
    }
    return map;
  }, [columns, localData]);

  const collisionDetectionStrategy = React.useCallback<CollisionDetection>(
    (args) => {
      const { active, droppableContainers } = args;

      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        // If we are over a column, refine to closest card inside that column.
        if (isColumnId(overId)) {
          const columnId = String(overId);
          const columnItemIds = columnItemIdsMap.get(columnId);

          if (columnItemIds && columnItemIds.size > 0) {
            const cardsInColumn = droppableContainers.filter((container) =>
              columnItemIds.has(String(container.id))
            );

            if (cardsInColumn.length > 0) {
              overId = getFirstCollision(
                closestCorners({
                  ...args,
                  droppableContainers: cardsInColumn,
                }),
                "id"
              );
            }
          }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = active.id;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [columnItemIdsMap, isColumnId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    activeContainerRef.current = findContainer(event.active.id) ?? null;

    const card = localData.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(String(event.active.id));
      setClonedData(localData);
      setActiveCardContent(renderOverlay ? renderOverlay(card) : null);
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (overId == null) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    // Only handle cross-column moves here (official pattern). Same-column reordering happens on drag end.
    if (activeContainer !== overContainer) {
      setLocalData((prev) => {
        const activeItems = prev.filter((i) => i.column === activeContainer);
        const overItems = prev.filter((i) => i.column === overContainer);

        const activeIndex = activeItems.findIndex((i) => i.id === active.id);
        const overIndex = overItems.findIndex((i) => i.id === overId);

        let newIndex: number;

        // Handle empty column case - dropping on column itself
        if (isColumnId(overId)) {
          newIndex = overItems.length;
        } else {
          const isBelowOverItem =
            !!over &&
            !!active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;
          newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
        }

        const activeItem = activeItems[activeIndex];
        if (!activeItem) return prev;

        const updatedActive = { ...activeItem, column: overContainer } as T;

        // Build per-column arrays, update just the two affected columns, then flatten in column order.
        const byColumn = new Map<string, T[]>();
        for (const col of columns) {
          byColumn.set(col.id, prev.filter((i) => i.column === col.id));
        }

        // Remove from old container.
        byColumn.set(
          activeContainer,
          (byColumn.get(activeContainer) ?? []).filter((i) => i.id !== active.id)
        );

        // Insert into new container.
        const nextOver = [...(byColumn.get(overContainer) ?? [])];
        const cleanedOver = nextOver.filter((i) => i.id !== active.id);
        cleanedOver.splice(newIndex, 0, updatedActive);
        byColumn.set(overContainer, cleanedOver);

        recentlyMovedToNewContainer.current = true;
        return flattenByColumns(byColumn);
      });
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      unstable_batchedUpdates(() => {
        setActiveCardId(null);
        setActiveCardContent(null);
        setClonedData(null);
      });
      activeContainerRef.current = null;
      onDragEnd?.(event);
      return;
    }

    const overId = over.id;
    const startContainer = activeContainerRef.current;
    const overContainer = findContainer(overId);

    let nextData = localData;

    // Same-column reordering: only do arrayMove if we stayed in the same column
    if (startContainer && overContainer && startContainer === overContainer && !isColumnId(overId)) {
      const columnItems = localData.filter((i) => i.column === overContainer);
      const activeIndex = columnItems.findIndex((i) => i.id === active.id);
      const overIndex = columnItems.findIndex((i) => i.id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const reordered = arrayMove(columnItems, activeIndex, overIndex);

        const byColumn = new Map<string, T[]>();
        for (const col of columns) {
          byColumn.set(col.id, localData.filter((i) => i.column === col.id));
        }
        byColumn.set(overContainer, reordered);
        nextData = flattenByColumns(byColumn);
      }
    }
    // Cross-column moves: handleDragOver already positioned the item, just commit localData

    commitTimeRef.current = Date.now();

    unstable_batchedUpdates(() => {
      setLocalData(nextData);
      onDataChange?.(nextData);

      setActiveCardId(null);
      setActiveCardContent(null);
      setClonedData(null);
    });

    activeContainerRef.current = null;
    onDragEnd?.(event);
  };

  const handleDragCancel = () => {
    activeContainerRef.current = null;
    unstable_batchedUpdates(() => {
      if (clonedData) {
        setLocalData(clonedData);
      }
      setActiveCardId(null);
      setActiveCardContent(null);
      setClonedData(null);
    });
  };

  // Reset this flag after layouts have a chance to settle (official pattern).
  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [localData]);

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

  const activeCard = activeCardId
    ? localData.find((item) => item.id === activeCardId)
    : null;

  return (
    <KanbanContext.Provider
      value={{ columns, data: localData, activeCardId, activeCardContent }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
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
                  <div className="w-[304px]">{renderOverlay(activeCard)}</div>
                ) : (
                  <Card className="w-[304px] cursor-grabbing rounded-md border bg-card p-3 shadow-md">
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

