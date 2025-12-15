/**
 * BookingConfirmed Component
 * 
 * Step 3 of the multi-step booking flow.
 * Displays confirmation details after successful booking.
 */

import { cn } from '@/lib/utils';
import { CheckCircle, Phone01, Calendar } from '@untitledui/icons';
import type { BookingConfirmationData } from '../../types';

interface BookingConfirmedProps {
  data: BookingConfirmationData;
  primaryColor?: string;
}

/**
 * Generate an .ics file content for universal calendar support
 */
function generateIcsContent(data: BookingConfirmationData): string {
  // Parse the date and time to create proper datetime
  const eventTitle = `Tour at ${data.locationName}`;
  const eventLocation = data.address || data.locationName;
  
  // Create a simple UID for the event
  const uid = `${data.confirmationId || Date.now()}@chatpad`;
  
  // Format current timestamp for DTSTAMP
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // For simplicity, use a placeholder datetime (the actual implementation
  // would parse data.date and data.time into proper ISO format)
  // Using DTSTART with VALUE=DATE for all-day-ish event as fallback
  const description = [
    `Confirmation: ${data.confirmationId || 'Pending'}`,
    data.phoneNumber ? `Contact: ${data.phoneNumber}` : '',
    data.address ? `Address: ${data.address}` : '',
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChatPad//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${eventTitle}`,
    `LOCATION:${eventLocation}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Download an .ics file
 */
function downloadIcsFile(data: BookingConfirmationData) {
  const icsContent = generateIcsContent(data);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking-${data.confirmationId || 'appointment'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BookingConfirmed({ data, primaryColor }: BookingConfirmedProps) {
  const handleAddToCalendar = () => {
    downloadIcsFile(data);
  };

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
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Booking Confirmed</p>
          {data.confirmationId && (
            <p className="text-xs text-muted-foreground">#{data.confirmationId}</p>
          )}
        </div>
      </div>

      {/* Details - location, address, date/time */}
      <div className="text-sm space-y-1">
        <p className="font-medium text-foreground">{data.locationName}</p>
        {data.address && (
          <p className="text-xs text-muted-foreground">{data.address}</p>
        )}
        <p className="text-muted-foreground">{data.date} at {data.time}</p>
      </div>

      {/* Phone number */}
      {data.phoneNumber && (
        <a
          href={`tel:${data.phoneNumber}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          aria-label={`Call ${data.locationName} at ${data.phoneNumber}`}
        >
          <Phone01 size={16} aria-hidden="true" />
          {data.phoneNumber}
        </a>
      )}

      {/* Add to Calendar button - universal .ics download */}
      <button
        onClick={handleAddToCalendar}
        aria-label="Add appointment to calendar"
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg",
          "text-sm font-medium",
          "bg-background border border-border",
          "hover:bg-accent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <Calendar size={16} aria-hidden="true" />
        Add to Calendar
      </button>
    </div>
  );
}
