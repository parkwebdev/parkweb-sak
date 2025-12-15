/**
 * TimePicker Component
 * 
 * Step 2 of the multi-step booking flow.
 * Displays available time slots for the selected day.
 */

import { cn } from '@/lib/utils';
import type { TimePickerData, BookingTime } from '../../types';

interface TimePickerProps {
  data: TimePickerData;
  onSelect: (time: BookingTime) => void;
  primaryColor?: string;
}

export function TimePicker({ data, onSelect, primaryColor }: TimePickerProps) {
  return (
    <div className="mt-2 space-y-2">
      {/* Context header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>📅</span>
        <span className="font-medium">{data.selectedDayDisplay}</span>
        <span className="text-muted-foreground/60">•</span>
        <span>{data.locationName}</span>
      </div>

      {/* Time grid - flexible wrap like quick replies */}
      <div className="flex flex-wrap gap-1.5">
        {data.times.map((slot) => (
          <button
            key={slot.datetime}
            onClick={() => slot.available && onSelect(slot)}
            disabled={!slot.available}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              slot.available
                ? "bg-card hover:bg-accent border border-border cursor-pointer active:scale-95"
                : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
            )}
            style={slot.available && primaryColor ? {
              borderColor: `${primaryColor}40`
            } : undefined}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
}
