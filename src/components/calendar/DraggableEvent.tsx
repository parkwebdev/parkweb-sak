import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Repeat02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';

interface DraggableEventProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onClick?: () => void;
  variant?: 'week' | 'day';
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  style,
  onClick,
  variant = 'week',
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { type: 'event', event },
  });

  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "text-xs px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing overflow-hidden touch-none select-none",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        variant === 'day' && "flex flex-col text-sm px-2 py-1"
      )}
      style={{
        ...style,
        backgroundColor: event.color ? `${event.color}20` : 'hsl(var(--primary) / 0.1)',
        color: event.color || 'hsl(var(--primary))',
        borderLeft: `${variant === 'day' ? 3 : 2}px solid ${event.color || 'hsl(var(--primary))'}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="font-medium truncate flex items-center gap-1">
        {event.title}
        {event.recurrence && !event.is_recurring_instance && (
          <Repeat02 className="h-3 w-3 flex-shrink-0 opacity-70" />
        )}
      </div>
      <div className={cn("opacity-75", variant === 'week' ? 'text-[10px]' : 'text-xs')}>
        {format(eventStart, 'h:mm a')}
        {variant === 'day' && ` - ${format(eventEnd, 'h:mm a')}`}
      </div>
    </div>
  );
};
