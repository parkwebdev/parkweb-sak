/**
 * DayPicker Component
 * 
 * Step 1 of the multi-step booking flow.
 * Displays a 3-column grid of available days.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DayPickerData, BookingDay } from '../../types';

interface DayPickerProps {
  data: DayPickerData;
  onSelect: (day: BookingDay) => void;
  primaryColor?: string;
}

const INITIAL_VISIBLE = 6;

export function DayPicker({ data, onSelect, primaryColor }: DayPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Only show available days
  const availableDays = data.days.filter(day => day.hasAvailability);
  const visibleDays = showAll ? availableDays : availableDays.slice(0, INITIAL_VISIBLE);
  const hasMore = availableDays.length > INITIAL_VISIBLE;

  return (
    <div className="mt-2 space-y-2">
      {/* Location header */}
      <p className="text-xs text-muted-foreground">
        {data.locationName}
      </p>

      {/* Day grid - 3 columns */}
      <div className="grid grid-cols-3 gap-1.5">
        {visibleDays.map((day) => (
          <button
            key={day.date}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col items-center justify-center",
              "rounded-lg py-3 px-2 transition-all duration-150",
              "min-h-[52px]",
              "bg-card hover:bg-accent border border-border cursor-pointer active:scale-95"
            )}
            style={primaryColor ? { borderColor: `${primaryColor}30` } : undefined}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {day.dayName}
            </span>
            <span className="text-base font-semibold text-foreground">
              {day.dayNumber}
            </span>
          </button>
        ))}
      </div>

      {/* More dates button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          More dates ({availableDays.length - INITIAL_VISIBLE} more)
        </button>
      )}
    </div>
  );
}
