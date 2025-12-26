/**
 * @fileoverview Droppable time slot for calendar week/day views.
 * Provides 15-minute precision drop targets for event placement.
 */

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  date: Date;
  hour: number;
  minute: 0 | 15 | 30 | 45;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// Get position class based on minute value
function getPositionClass(minute: 0 | 15 | 30 | 45): string {
  switch (minute) {
    case 0: return 'top-0';
    case 15: return 'top-1/4';
    case 30: return 'top-1/2';
    case 45: return 'top-3/4';
  }
}

export function DroppableTimeSlot({
  date,
  hour,
  minute,
  children,
  onClick,
  className,
}: DroppableTimeSlotProps) {
  const slotId = `slot-${date.toISOString().split('T')[0]}-${hour}-${minute}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { type: 'slot', date, hour, minute },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-0 h-1/4 cursor-pointer transition-colors z-0",
        getPositionClass(minute),
        "hover:bg-accent/30",
        isOver && "bg-primary/20 ring-2 ring-primary ring-inset",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
