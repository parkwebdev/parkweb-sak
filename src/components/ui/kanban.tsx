/**
 * @fileoverview Reusable Kanban board primitives built on dnd-kit.
 * Provides drag-and-drop columns and cards with accessibility support.
 */

"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import tunnel from "tunnel-rat";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Tunnel for drag overlay portal
const dragOverlayTunnel = tunnel();

// Context for kanban state
interface KanbanContextValue<TColumn, TCard> {
  activeCard: TCard | null;
  columns: TColumn[];
}

const KanbanContext = React.createContext<KanbanContextValue<unknown, unknown>>({
  activeCard: null,
  columns: [],
});

function useKanbanContext<TColumn, TCard>() {
  return React.useContext(KanbanContext) as KanbanContextValue<TColumn, TCard>;
}

// Provider props
interface KanbanProviderProps<TColumn, TCard extends { id: string }> {
  children: React.ReactNode;
  columns: TColumn[];
  cards: TCard[];
  onDragEnd: (event: DragEndEvent) => void;
  getCardColumn: (card: TCard) => string;
  className?: string;
}

/**
 * KanbanProvider - Main context provider with DnD sensors
 */
function KanbanProvider<TColumn extends { id: string }, TCard extends { id: string }>({
  children,
  columns,
  cards,
  onDragEnd,
  getCardColumn,
  className,
}: KanbanProviderProps<TColumn, TCard>) {
  const [activeCard, setActiveCard] = React.useState<TCard | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const card = cards.find((c) => c.id === event.active.id);
      if (card) setActiveCard(card);
    },
    [cards]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      onDragEnd(event);
    },
    [onDragEnd]
  );

  const handleDragCancel = React.useCallback(() => {
    setActiveCard(null);
  }, []);

  const contextValue = React.useMemo(
    () => ({ activeCard, columns }),
    [activeCard, columns]
  );

  return (
    <KanbanContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
          {children}
        </div>
        <dragOverlayTunnel.Out />
      </DndContext>
    </KanbanContext.Provider>
  );
}

// Board/Column styles
const kanbanBoardVariants = cva(
  "flex flex-col rounded-xl border bg-muted/40 min-w-[300px] max-w-[350px] flex-shrink-0",
  {
    variants: {
      size: {
        default: "min-h-[500px]",
        sm: "min-h-[300px]",
        lg: "min-h-[700px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface KanbanBoardProps extends VariantProps<typeof kanbanBoardVariants> {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * KanbanBoard - Droppable column container
 */
function KanbanBoard({ id, children, className, size }: KanbanBoardProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        kanbanBoardVariants({ size }),
        isOver && "ring-2 ring-primary/50",
        className
      )}
      role="listbox"
      aria-label={`Column ${id}`}
    >
      {children}
    </div>
  );
}

// Header styles
const kanbanHeaderVariants = cva(
  "flex items-center justify-between px-4 py-3 border-b bg-background/50 rounded-t-xl",
  {
    variants: {
      variant: {
        default: "",
        accent: "border-l-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface KanbanHeaderProps extends VariantProps<typeof kanbanHeaderVariants> {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

/**
 * KanbanHeader - Column header with title and count
 */
function KanbanHeader({
  children,
  className,
  variant,
  accentColor,
}: KanbanHeaderProps) {
  return (
    <div
      className={cn(kanbanHeaderVariants({ variant }), className)}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      {children}
    </div>
  );
}

interface KanbanCardsProps<TCard extends { id: string }> {
  cards: TCard[];
  children: (card: TCard) => React.ReactNode;
  className?: string;
}

/**
 * KanbanCards - Sortable context wrapper for cards
 */
function KanbanCards<TCard extends { id: string }>({
  cards,
  children,
  className,
}: KanbanCardsProps<TCard>) {
  return (
    <SortableContext
      items={cards.map((c) => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        className={cn("flex-1 p-2 space-y-2 overflow-y-auto", className)}
        role="list"
      >
        {cards.map((card) => children(card))}
      </div>
    </SortableContext>
  );
}

interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

/**
 * KanbanCard - Individual draggable card
 */
function KanbanCard({ id, children, className }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "shadow-lg ring-2 ring-primary/20",
        className
      )}
      role="option"
      aria-grabbed={isDragging}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

interface KanbanOverlayProps {
  children: React.ReactNode;
}

/**
 * KanbanOverlay - Portal overlay for dragged card
 */
function KanbanOverlay({ children }: KanbanOverlayProps) {
  return (
    <dragOverlayTunnel.In>
      <DragOverlay dropAnimation={null}>
        {children}
      </DragOverlay>
    </dragOverlayTunnel.In>
  );
}

export {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  KanbanOverlay,
  useKanbanContext,
};
