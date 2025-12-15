/**
 * BookingConfirmed Component
 * 
 * Step 3 of the multi-step booking flow.
 * Displays confirmation details after successful booking.
 */

import { cn } from '@/lib/utils';
import { CheckCircle } from '@untitledui/icons';
import type { BookingConfirmationData } from '../../types';

interface BookingConfirmedProps {
  data: BookingConfirmationData;
  primaryColor?: string;
}

export function BookingConfirmed({ data, primaryColor }: BookingConfirmedProps) {
  return (
    <div 
      className={cn(
        "mt-2 rounded-xl p-4 space-y-3",
        "bg-card border border-border"
      )}
    >
      {/* Success header */}
      <div className="flex items-center gap-2">
        <CheckCircle 
          size={20} 
          className="text-primary flex-shrink-0"
          style={primaryColor ? { color: primaryColor } : undefined}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Booking Confirmed</p>
          {data.confirmationId && (
            <p className="text-xs text-muted-foreground">#{data.confirmationId}</p>
          )}
        </div>
      </div>

      {/* Details - compact single block */}
      <div className="text-sm text-foreground space-y-0.5">
        <p className="font-medium">{data.locationName}</p>
        <p className="text-muted-foreground">{data.date} at {data.time}</p>
      </div>

      {/* Add to Calendar button */}
      {data.calendarUrl && (
        <a
          href={data.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "block w-full text-center py-2.5 px-4 rounded-lg",
            "text-sm font-medium",
            "bg-background border border-border",
            "hover:bg-accent transition-colors"
          )}
        >
          Add to Calendar
        </a>
      )}
    </div>
  );
}
