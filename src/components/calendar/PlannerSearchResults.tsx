/**
 * @fileoverview Planner Search Results Component
 * 
 * Renders filtered calendar event results for the TopBar search.
 * Displays events with their type color indicator and formatted date/time.
 * 
 * @module components/calendar/PlannerSearchResults
 */

import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBar';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';
import { format } from 'date-fns';

interface PlannerSearchResultsProps {
  /** Current search query */
  query: string;
  /** All calendar events to filter */
  events: CalendarEvent[];
  /** Callback when an event is selected */
  onSelect: (event: CalendarEvent) => void;
}

/**
 * Renders filtered event results for the Planner search.
 * Searches by title, lead name, property, or community.
 */
export function PlannerSearchResults({ query, events, onSelect }: PlannerSearchResultsProps) {
  const q = query.toLowerCase().trim();
  
  const filtered = events.filter(event => 
    event.title.toLowerCase().includes(q) ||
    event.lead_name?.toLowerCase().includes(q) ||
    event.property?.toLowerCase().includes(q) ||
    event.community?.toLowerCase().includes(q)
  ).slice(0, 8);
  
  if (filtered.length === 0) {
    return <TopBarSearchEmptyState message="No bookings found" />;
  }
  
  return (
    <div className="py-1">
      {filtered.map(event => {
        const typeConfig = event.type ? EVENT_TYPE_CONFIG[event.type] : null;
        return (
          <TopBarSearchResultItem
            key={event.id}
            icon={
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: typeConfig?.color || 'hsl(var(--muted-foreground))' }}
              />
            }
            title={event.title}
            subtitle={format(new Date(event.start), 'MMM d, h:mm a')}
            onClick={() => onSelect(event)}
          />
        );
      })}
    </div>
  );
}
