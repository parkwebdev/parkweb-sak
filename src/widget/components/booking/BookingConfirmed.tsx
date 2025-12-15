/**
 * BookingConfirmed Component
 * 
 * Step 3 of the multi-step booking flow.
 * Displays confirmation details after successful booking.
 * Uses smart platform detection for optimal calendar integration.
 */

import { cn } from '@/lib/utils';
import { CheckCircle, Phone01, Calendar } from '@untitledui/icons';
import type { BookingConfirmationData } from '../../types';

interface BookingConfirmedProps {
  data: BookingConfirmationData;
  primaryColor?: string;
}

type CalendarPlatform = 'google' | 'outlook' | 'apple' | 'other';

/**
 * Detect user's calendar platform based on browser/device
 */
function detectCalendarPlatform(): CalendarPlatform {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // Apple devices (iOS, macOS) → .ics works best with native Calendar
  if (/iphone|ipad|ipod|mac/.test(platform) || (/safari/.test(ua) && !/chrome/.test(ua))) {
    return 'apple';
  }
  
  // Microsoft Edge users likely have Outlook
  if (/edg/.test(ua)) {
    return 'outlook';
  }
  
  // Chrome/Android users → Google Calendar URL
  if (/chrome/.test(ua) || /android/.test(ua)) {
    return 'google';
  }
  
  return 'other'; // Fallback to .ics
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarUrl(data: BookingConfirmationData): string | null {
  if (!data.startDateTime || !data.endDateTime) return null;
  
  const startDate = new Date(data.startDateTime);
  const endDate = new Date(data.endDateTime);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Tour at ${data.locationName}`,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: [
      data.confirmationId ? `Confirmation: ${data.confirmationId}` : '',
      data.phoneNumber ? `Contact: ${data.phoneNumber}` : '',
    ].filter(Boolean).join('\n'),
    location: data.address || data.locationName,
  });
  
  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * Generate Outlook Web Calendar URL
 */
function generateOutlookCalendarUrl(data: BookingConfirmationData): string | null {
  if (!data.startDateTime || !data.endDateTime) return null;
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `Tour at ${data.locationName}`,
    startdt: data.startDateTime,
    enddt: data.endDateTime,
    body: [
      data.confirmationId ? `Confirmation: ${data.confirmationId}` : '',
      data.phoneNumber ? `Contact: ${data.phoneNumber}` : '',
    ].filter(Boolean).join('\n'),
    location: data.address || data.locationName,
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

/**
 * Format date for .ics file (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate an .ics file content for universal calendar support
 */
function generateIcsContent(data: BookingConfirmationData): string {
  const eventTitle = `Tour at ${data.locationName}`;
  const eventLocation = data.address || data.locationName;
  const uid = `${data.confirmationId || Date.now()}@chatpad`;
  const now = new Date();
  const dtstamp = formatIcsDate(now);
  
  // Use ISO datetimes if available, otherwise fall back to current time placeholder
  const startDt = data.startDateTime ? formatIcsDate(new Date(data.startDateTime)) : dtstamp;
  const endDt = data.endDateTime ? formatIcsDate(new Date(data.endDateTime)) : dtstamp;
  
  const description = [
    data.confirmationId ? `Confirmation: ${data.confirmationId}` : '',
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
    `DTSTART:${startDt}`,
    `DTEND:${endDt}`,
    `SUMMARY:${eventTitle}`,
    `LOCATION:${eventLocation}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
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
    const platform = detectCalendarPlatform();
    
    switch (platform) {
      case 'google': {
        const url = generateGoogleCalendarUrl(data);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          downloadIcsFile(data);
        }
        break;
      }
      case 'outlook': {
        const url = generateOutlookCalendarUrl(data);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          downloadIcsFile(data);
        }
        break;
      }
      case 'apple':
      default:
        downloadIcsFile(data);
        break;
    }
  };

  return (
    <div 
      className={cn(
        "mt-2 rounded-xl p-4 space-y-3",
        "bg-card border border-border"
      )}
    >
      {/* Success header - muted background with icon badge */}
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black flex-shrink-0">
          <CheckCircle 
            size={18} 
            className="text-status-active"
            aria-hidden="true"
          />
        </div>
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

      {/* Add to Calendar button - smart platform detection */}
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
