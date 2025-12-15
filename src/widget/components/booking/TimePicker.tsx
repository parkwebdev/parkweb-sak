/**
 * TimePicker Component
 * 
 * Step 2 of the multi-step booking flow.
 * Displays a 3-column grid of available time slots.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Phone01 } from '../../icons';
import type { TimePickerData, BookingTime } from '../../types';

interface TimePickerProps {
  data: TimePickerData;
  onSelect: (time: BookingTime) => void;
  onGoBack?: () => void;
  primaryColor?: string;
}

const INITIAL_VISIBLE = 6;

export function TimePicker({ data, onSelect, onGoBack, primaryColor }: TimePickerProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Only show available times
  const availableTimes = useMemo(
    () => data.times.filter(slot => slot.available),
    [data.times]
  );
  const visibleTimes = showAll ? availableTimes : availableTimes.slice(0, INITIAL_VISIBLE);
  const hasMore = availableTimes.length > INITIAL_VISIBLE;

  const handleSelect = (slot: BookingTime) => {
    setSelectedId(slot.datetime);
    onSelect(slot);
  };

  // Empty state
  if (availableTimes.length === 0) {
    return (
      <div className="mt-2 space-y-2">
        {/* Go back link */}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Go back to pick a different day"
          >
            <ChevronLeft size={14} />
            Pick a different day
          </button>
        )}
        
        <div className="rounded-xl p-4 bg-card border border-border text-center space-y-2">
          <p className="text-sm text-foreground font-medium">No times available</p>
          <p className="text-xs text-muted-foreground">
            Try selecting a different day.
          </p>
          {data.phoneNumber && (
            <a
              href={`tel:${data.phoneNumber}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              aria-label={`Call ${data.locationName} at ${data.phoneNumber}`}
            >
              <Phone01 size={14} />
              {data.phoneNumber}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Go back link */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Go back to pick a different day"
        >
          <ChevronLeft size={14} />
          Pick a different day
        </button>
      )}

      {/* Context header */}
      <p className="text-xs text-muted-foreground">
        {data.selectedDayDisplay} at {data.locationName}
      </p>

      {/* Time grid - 3 columns */}
      <div 
        className="grid grid-cols-3 gap-1.5"
        role="group"
        aria-label="Available times for booking"
      >
        {visibleTimes.map((slot) => {
          const isSelected = selectedId === slot.datetime;
          return (
            <button
              key={slot.datetime}
              onClick={() => handleSelect(slot)}
              disabled={isSelected}
              aria-label={`Book appointment at ${slot.time}`}
              className={cn(
                "py-2.5 px-1.5 sm:py-3 sm:px-2 rounded-lg text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "opacity-50 pointer-events-none"
                  : "bg-card hover:bg-accent border border-border cursor-pointer active:scale-95"
              )}
              style={primaryColor && !isSelected ? { borderColor: `${primaryColor}30` } : undefined}
            >
              {slot.time}
            </button>
          );
        })}
      </div>

      {/* More times button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          More times ({availableTimes.length - INITIAL_VISIBLE} more)
        </button>
      )}
    </div>
  );
}
