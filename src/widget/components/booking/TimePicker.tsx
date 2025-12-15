/**
 * TimePicker Component
 * 
 * Step 2 of the multi-step booking flow.
 * Displays a 3-column grid of available time slots.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TimePickerData, BookingTime } from '../../types';

interface TimePickerProps {
  data: TimePickerData;
  onSelect: (time: BookingTime) => void;
  primaryColor?: string;
}

const INITIAL_VISIBLE = 6;

export function TimePicker({ data, onSelect, primaryColor }: TimePickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Only show available times
  const availableTimes = data.times.filter(slot => slot.available);
  const visibleTimes = showAll ? availableTimes : availableTimes.slice(0, INITIAL_VISIBLE);
  const hasMore = availableTimes.length > INITIAL_VISIBLE;

  return (
    <div className="mt-2 space-y-2">
      {/* Context header */}
      <p className="text-xs text-muted-foreground">
        {data.selectedDayDisplay} at {data.locationName}
      </p>

      {/* Time grid - 3 columns */}
      <div className="grid grid-cols-3 gap-1.5">
        {visibleTimes.map((slot) => (
          <button
            key={slot.datetime}
            onClick={() => onSelect(slot)}
            className={cn(
              "py-3 px-2 rounded-lg text-sm font-medium transition-all duration-150",
              "bg-card hover:bg-accent border border-border cursor-pointer active:scale-95"
            )}
            style={primaryColor ? { borderColor: `${primaryColor}30` } : undefined}
          >
            {slot.time}
          </button>
        ))}
      </div>

      {/* More times button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          More times ({availableTimes.length - INITIAL_VISIBLE} more)
        </button>
      )}
    </div>
  );
}
