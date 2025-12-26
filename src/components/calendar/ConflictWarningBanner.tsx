/**
 * ConflictWarningBanner Component
 * 
 * Reusable conflict warning banner for calendar events.
 * Used in TimeChangeReasonDialog, CreateEventDialog, and EventDetailDialog.
 * 
 * @module components/calendar/ConflictWarningBanner
 */

import React, { useMemo } from 'react';
import { AlertTriangle } from '@untitledui/icons';
import type { CalendarEvent } from '@/types/calendar';

interface ConflictWarningBannerProps {
  /** The events that conflict with the proposed time */
  conflictingEvents: CalendarEvent[];
}

interface ConflictCheckProps {
  /** Date of the proposed event */
  date?: Date;
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** Whether the event is all-day */
  allDay: boolean;
  /** Existing events to check against */
  existingEvents: CalendarEvent[];
  /** Event ID to exclude from conflict check (for editing) */
  excludeEventId?: string;
}

/**
 * Hook to calculate conflicting events
 */
export function useConflictingEvents({
  date,
  startTime,
  endTime,
  allDay,
  existingEvents,
  excludeEventId,
}: ConflictCheckProps): CalendarEvent[] {
  return useMemo(() => {
    if (!date || allDay || !existingEvents.length) return [];

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const proposedStart = new Date(date);
    proposedStart.setHours(startHour, startMinute, 0, 0);

    const proposedEnd = new Date(date);
    proposedEnd.setHours(endHour, endMinute, 0, 0);

    return existingEvents.filter((e) => {
      if (e.allDay) return false;
      if (excludeEventId && e.id === excludeEventId) return false;

      const eStart = new Date(e.start).getTime();
      const eEnd = new Date(e.end).getTime();
      const pStart = proposedStart.getTime();
      const pEnd = proposedEnd.getTime();

      // Check overlap: proposed starts before existing ends AND proposed ends after existing starts
      return pStart < eEnd && pEnd > eStart;
    });
  }, [date, startTime, endTime, allDay, existingEvents, excludeEventId]);
}

/**
 * Conflict warning banner component with amber styling
 */
export function ConflictWarningBanner({
  conflictingEvents,
}: ConflictWarningBannerProps) {
  if (conflictingEvents.length === 0) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-warning">
          Schedule Conflict Detected
        </p>
        <p className="text-xs text-warning/80">
          This time overlaps with: {conflictingEvents.map((e) => e.title).join(', ')}
        </p>
      </div>
    </div>
  );
};

/**
 * Self-contained conflict warning that calculates conflicts internally
 */
export function ConflictWarning(props: ConflictCheckProps) {
  const conflictingEvents = useConflictingEvents(props);
  return <ConflictWarningBanner conflictingEvents={conflictingEvents} />;
}
