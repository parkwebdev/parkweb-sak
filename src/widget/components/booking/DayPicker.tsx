/**
 * DayPicker Component
 * 
 * Step 1 of the multi-step booking flow.
 * Displays a grid of days with availability indicators.
 */

import { cn } from '@/lib/utils';
import type { DayPickerData, BookingDay } from '../../types';

interface DayPickerProps {
  data: DayPickerData;
  onSelect: (day: BookingDay) => void;
  primaryColor?: string;
}

export function DayPicker({ data, onSelect, primaryColor }: DayPickerProps) {
  const accentStyle = primaryColor ? { 
    '--day-accent': primaryColor,
    '--day-accent-light': `${primaryColor}20`
  } as React.CSSProperties : {};

  return (
    <div className="mt-2 space-y-2">
      {/* Location header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>📍</span>
        <span className="font-medium">{data.locationName}</span>
      </div>

      {/* Day grid - 4 columns on mobile */}
      <div 
        className="grid grid-cols-4 gap-1.5"
        style={accentStyle}
      >
        {data.days.map((day) => (
          <button
            key={day.date}
            onClick={() => day.hasAvailability && onSelect(day)}
            disabled={!day.hasAvailability}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "rounded-lg py-2 px-1 transition-all duration-150",
              "min-h-[56px]",
              day.hasAvailability
                ? "bg-card hover:bg-accent border border-border cursor-pointer active:scale-95"
                : "bg-muted/50 cursor-not-allowed opacity-50",
              day.isToday && day.hasAvailability && "ring-2 ring-primary/30"
            )}
          >
            {/* Day name */}
            <span className={cn(
              "text-xs font-medium",
              day.hasAvailability ? "text-muted-foreground" : "text-muted-foreground/50"
            )}>
              {day.dayName}
            </span>
            
            {/* Day number */}
            <span className={cn(
              "text-base font-semibold",
              day.hasAvailability ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {day.dayNumber}
            </span>
            
            {/* Availability dot */}
            {day.hasAvailability && (
              <div 
                className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: primaryColor || 'hsl(var(--primary))' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
