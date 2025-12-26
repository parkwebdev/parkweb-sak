/**
 * @fileoverview Dragged event preview overlay.
 * Shows event title and time during drag operations.
 */

import React from 'react';
import { format } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

interface DraggedEventPreviewProps {
  event: CalendarEvent;
}

export function DraggedEventPreview({ event }: DraggedEventPreviewProps) {
  return (
    <div
      className="px-3 py-2 rounded-lg shadow-xl text-sm pointer-events-none min-w-[140px] border border-border bg-card"
      style={{
        backgroundColor: event.color ? `${event.color}30` : 'hsl(var(--card))',
        borderLeft: `3px solid ${event.color || 'hsl(var(--primary))'}`,
      }}
    >
      <div className="font-medium truncate" style={{ color: event.color || 'hsl(var(--foreground))' }}>
        {event.title}
      </div>
      <div className="text-xs text-muted-foreground">
        {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
      </div>
    </div>
  );
};
