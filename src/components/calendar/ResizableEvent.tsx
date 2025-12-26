import React, { useRef, useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Repeat02, AlertTriangle } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CalendarEvent } from '@/types/calendar';

const HOUR_HEIGHT = 96; // pixels per hour (24px per 15-minute slot)
const MIN_DURATION_MINUTES = 15;
const SNAP_MINUTES = 15;

interface ResizableEventProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onClick?: () => void;
  onResizeStart?: (eventId: string) => void;
  onResizeMove?: (eventId: string, newEndTime: Date) => void;
  onResizeEnd?: (eventId: string, newEndTime: Date) => void;
  variant?: 'week' | 'day' | 'month';
  hasConflict?: boolean;
  conflictingEvents?: string[];
}

export function ResizableEvent({
  event,
  style,
  onClick,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  variant = 'week',
  hasConflict = false,
  conflictingEvents = [],
}: ResizableEventProps) {
  const [isResizing, setIsResizing] = useState(false);
  const isResizeIntent = useRef(false);
  const resizeStartY = useRef<number>(0);
  const originalEndTime = useRef<Date>(new Date(event.end));

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { type: 'event', event },
    disabled: isResizing || isResizeIntent.current,
  });

  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  // Snap time to 5-minute increments
  const snapToInterval = (date: Date): Date => {
    const minutes = date.getMinutes();
    const snappedMinutes = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
    const result = new Date(date);
    result.setMinutes(snappedMinutes, 0, 0);
    return result;
  };

  // Calculate new end time based on mouse movement
  const calculateNewEndTime = useCallback((deltaY: number): Date => {
    const minutesDelta = (deltaY / HOUR_HEIGHT) * 60;
    const newEnd = new Date(originalEndTime.current.getTime() + minutesDelta * 60 * 1000);
    
    // Enforce minimum duration
    const minEndTime = new Date(eventStart.getTime() + MIN_DURATION_MINUTES * 60 * 1000);
    if (newEnd < minEndTime) {
      return snapToInterval(minEndTime);
    }
    
    return snapToInterval(newEnd);
  }, [eventStart]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set intent BEFORE any async operations to prevent drag activation
    isResizeIntent.current = true;
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    originalEndTime.current = new Date(event.end);
    onResizeStart?.(event.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaY = moveEvent.clientY - resizeStartY.current;
      const newEndTime = calculateNewEndTime(deltaY);
      onResizeMove?.(event.id, newEndTime);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaY = upEvent.clientY - resizeStartY.current;
      const newEndTime = calculateNewEndTime(deltaY);
      
      setIsResizing(false);
      isResizeIntent.current = false;
      onResizeEnd?.(event.id, newEndTime);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Month view - click to view, drag to move to different day (no resize)
  if (variant === 'month') {
    const content = (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-xs rounded overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
          hasConflict && "ring-1 ring-amber-500"
        )}
        style={{
          backgroundColor: event.color ? `${event.color}15` : 'hsl(var(--primary) / 0.1)',
          color: event.color || 'hsl(var(--primary))',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {hasConflict && (
          <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-500" />
        )}
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
      </div>
    );

    if (hasConflict && conflictingEvents.length > 0) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">⚠️ Conflicts with: {conflictingEvents.join(', ')}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  }

  // Week/Day view with resize handle
  const weekDayContent = (
    <div
      ref={setNodeRef}
      className={cn(
        "text-xs rounded overflow-hidden touch-none select-none group relative",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        variant === 'day' && "flex flex-col text-sm",
        hasConflict && "ring-1 ring-amber-500"
      )}
      style={{
        ...style,
        backgroundColor: event.color ? `${event.color}20` : 'hsl(var(--primary) / 0.1)',
        color: event.color || 'hsl(var(--primary))',
        borderLeft: hasConflict 
          ? `${variant === 'day' ? 3 : 2}px solid hsl(var(--warning))` 
          : `${variant === 'day' ? 3 : 2}px solid ${event.color || 'hsl(var(--primary))'}`,
      }}
    >
      {/* Conflict indicator */}
      {hasConflict && (
        <div className="absolute top-1 right-1 z-10">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        </div>
      )}
      
      {/* Drag handle - main content area */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "px-1.5 py-0.5 pb-5",
          !isResizing && "cursor-grab active:cursor-grabbing",
          variant === 'day' && "px-2 py-1 pb-5"
        )}
        onClick={(e) => {
          if (!isResizing) {
            e.stopPropagation();
            onClick?.();
          }
        }}
      >
        <div className="font-medium truncate flex items-center gap-1 pr-4">
          {event.title}
          {event.recurrence && !event.is_recurring_instance && (
            <Repeat02 className="h-3 w-3 flex-shrink-0 opacity-70" />
          )}
        </div>
        <div className={cn("opacity-75", variant === 'week' ? 'text-2xs' : 'text-xs')}>
          {format(eventStart, 'h:mm a')}
          {variant === 'day' && ` - ${format(eventEnd, 'h:mm a')}`}
        </div>
      </div>
      
      {/* Resize handle - bottom edge (separate from drag area) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-5 cursor-ns-resize z-10",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )}
        onMouseDown={handleResizeMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-current opacity-60" />
      </div>
    </div>
  );

  if (hasConflict && conflictingEvents.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{weekDayContent}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">⚠️ Conflicts with: {conflictingEvents.join(', ')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return weekDayContent;
};
