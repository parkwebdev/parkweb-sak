/**
 * DayPicker Component
 * 
 * Step 1 of the multi-step booking flow.
 * Displays a 3-column grid of available days.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Phone01 } from '@untitledui/icons';
import type { DayPickerData, BookingDay } from '../../types';

interface DayPickerProps {
  data: DayPickerData;
  onSelect: (day: BookingDay) => void;
  primaryColor?: string;
}

const INITIAL_VISIBLE = 6;

/**
 * Format month and year from the first available day
 */
function getMonthYearDisplay(days: BookingDay[]): string {
  if (days.length === 0) return '';
  const date = new Date(days[0].date);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format full date for aria-label
 */
function getFullDateLabel(day: BookingDay): string {
  const date = new Date(day.date);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function DayPicker({ data, onSelect, primaryColor }: DayPickerProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Only show available days
  const availableDays = useMemo(
    () => data.days.filter(day => day.hasAvailability),
    [data.days]
  );
  const visibleDays = showAll ? availableDays : availableDays.slice(0, INITIAL_VISIBLE);
  const hasMore = availableDays.length > INITIAL_VISIBLE;
  const monthYear = useMemo(() => getMonthYearDisplay(availableDays), [availableDays]);

  const handleSelect = (day: BookingDay) => {
    setSelectedId(day.date);
    onSelect(day);
  };

  // Empty state
  if (availableDays.length === 0) {
    return (
      <div className="mt-2 rounded-xl p-4 bg-card border border-border text-center space-y-2">
        <p className="text-sm text-foreground font-medium">No availability this week</p>
        <p className="text-xs text-muted-foreground">
          Please check back soon or contact us directly.
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
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Location header with month context */}
      <p className="text-xs text-muted-foreground">
        {data.locationName} • {monthYear}
      </p>

      {/* Day grid - 3 columns */}
      <div 
        className="grid grid-cols-3 gap-1.5"
        role="group"
        aria-label="Available dates for booking"
      >
        {visibleDays.map((day) => {
          const isSelected = selectedId === day.date;
          return (
            <button
              key={day.date}
              onClick={() => handleSelect(day)}
              disabled={isSelected}
              aria-label={getFullDateLabel(day)}
              className={cn(
                "flex flex-col items-center justify-center",
                "rounded-lg py-2.5 px-1.5 sm:py-3 sm:px-2 transition-all duration-150",
                "min-h-[48px] sm:min-h-[52px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected 
                  ? "opacity-50 pointer-events-none" 
                  : "bg-card hover:bg-accent border border-border cursor-pointer active:scale-95"
              )}
              style={primaryColor && !isSelected ? { borderColor: `${primaryColor}30` } : undefined}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {day.dayName}
              </span>
              <span className="text-base font-semibold text-foreground">
                {day.dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* More dates button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          More dates ({availableDays.length - INITIAL_VISIBLE} more)
        </button>
      )}
    </div>
  );
}
