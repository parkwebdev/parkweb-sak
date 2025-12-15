/**
 * BookingConfirmed Component
 * 
 * Step 3 of the multi-step booking flow.
 * Displays confirmation details after successful booking.
 */

import { cn } from '@/lib/utils';
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
        "bg-gradient-to-br from-primary/10 to-primary/5",
        "border border-primary/20"
      )}
      style={primaryColor ? {
        background: `linear-gradient(to bottom right, ${primaryColor}15, ${primaryColor}08)`,
        borderColor: `${primaryColor}30`
      } : undefined}
    >
      {/* Success header */}
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: primaryColor ? `${primaryColor}20` : 'hsl(var(--primary) / 0.2)' }}
        >
          ✓
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Booking Confirmed!</p>
          {data.confirmationId && (
            <p className="text-xs text-muted-foreground">#{data.confirmationId}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📍</span>
          <span className="font-medium">{data.locationName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📅</span>
          <span>{data.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">🕐</span>
          <span>{data.time}</span>
        </div>
      </div>

      {/* Add to Calendar button */}
      {data.calendarUrl && (
        <a
          href={data.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "block w-full text-center py-2 px-4 rounded-lg",
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
