/**
 * @fileoverview Planner TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Planner page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/calendar/PlannerTopBarSearch
 */

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { PlannerSearchResults } from './PlannerSearchResults';
import type { CalendarEvent } from '@/types/calendar';

interface PlannerTopBarSearchProps {
  /** All calendar events to search through */
  events: CalendarEvent[];
  /** Callback when an event is selected from search results */
  onSelect: (event: CalendarEvent) => void;
}

/**
 * Self-contained search component for the Planner page.
 * Manages search state internally to avoid triggering parent re-renders.
 * Uses refs for data props to ensure stable renderResults callback.
 */
export const PlannerTopBarSearch = memo(function PlannerTopBarSearch({
  events,
  onSelect,
}: PlannerTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use refs to avoid closure issues and keep renderResults stable
  const eventsRef = useRef(events);
  const onSelectRef = useRef(onSelect);
  
  // Keep refs updated with latest values
  useEffect(() => {
    eventsRef.current = events;
    onSelectRef.current = onSelect;
  });
  
  // Stable renderResults with empty deps - reads from refs
  const renderResults = useCallback((query: string) => (
    <PlannerSearchResults
      query={query}
      events={eventsRef.current}
      onSelect={onSelectRef.current}
    />
  ), []);

  return (
    <TopBarSearch
      placeholder="Search bookings..."
      value={searchQuery}
      onChange={setSearchQuery}
      renderResults={renderResults}
    />
  );
});
