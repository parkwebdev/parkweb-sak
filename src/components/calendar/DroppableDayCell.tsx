/**
 * @fileoverview Droppable day cell for calendar drag-and-drop.
 * Uses @dnd-kit to enable events to be dropped onto calendar days.
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableDayCellProps {
  date: Date;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DroppableDayCell({
  date,
  children,
  className,
  onClick,
}: DroppableDayCellProps) {
  const slotId = `day-${date.toISOString().split('T')[0]}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { type: 'day', date },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-primary/10 ring-2 ring-primary ring-inset")}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
