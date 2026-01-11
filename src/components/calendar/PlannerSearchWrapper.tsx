/**
 * @fileoverview Planner Search Wrapper
 * 
 * Self-contained wrapper that fetches calendar events internally,
 * preventing data dependencies from propagating to parent TopBar config.
 * 
 * @module components/calendar/PlannerSearchWrapper
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { PlannerTopBarSearch } from './PlannerTopBarSearch';
import type { CalendarEvent } from '@/types/calendar';

interface PlannerSearchWrapperProps {
  /** Callback when an event is selected from search results */
  onSelect: (event: CalendarEvent) => void;
}

/**
 * Wrapper component that fetches its own data to isolate
 * data dependencies from the parent's TopBar config.
 */
export const PlannerSearchWrapper = memo(function PlannerSearchWrapper({
  onSelect,
}: PlannerSearchWrapperProps) {
  const { events } = useCalendarEvents();
  
  // Keep onSelect stable via ref
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  
  const handleSelect = useCallback((event: CalendarEvent) => {
    onSelectRef.current(event);
  }, []);
  
  return (
    <PlannerTopBarSearch
      events={events}
      onSelect={handleSelect}
    />
  );
});
