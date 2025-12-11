import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  date: Date;
  hour: number;
  minute: 0 | 30;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  date,
  hour,
  minute,
  children,
  onClick,
  className,
}) => {
  const slotId = `slot-${date.toISOString().split('T')[0]}-${hour}-${minute}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { type: 'slot', date, hour, minute },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-0 h-1/2 cursor-pointer transition-colors z-0",
        minute === 0 ? "top-0" : "bottom-0",
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
