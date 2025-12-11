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
  variant?: 'week' | 'day' | 'month';
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
        variant === 'day' && "flex flex-col text-sm px-2 py-1",
        variant === 'month' && "flex items-center gap-1.5 px-2 py-1"
      )}
      style={{
        ...style,
        backgroundColor: event.color ? `${event.color}${variant === 'month' ? '15' : '20'}` : 'hsl(var(--primary) / 0.1)',
        color: event.color || 'hsl(var(--primary))',
        borderLeft: variant !== 'month' ? `${variant === 'day' ? 3 : 2}px solid ${event.color || 'hsl(var(--primary))'}` : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {variant === 'month' ? (
        <>
          <span 
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
          />
          {!event.allDay && (
            <span className="font-medium truncate">
              {format(eventStart, 'h:mm a')}
            </span>
          )}
          {event.allDay && (
            <span className="font-medium text-xs text-muted-foreground">All day</span>
          )}
          <span className="truncate">{event.title}</span>
          {event.recurrence && !event.is_recurring_instance && (
            <Repeat02 className="h-3 w-3 flex-shrink-0 opacity-70" />
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};
