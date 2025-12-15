/**
 * BookingConfirmed Component
 * 
 * Step 3 of the multi-step booking flow.
 * Displays confirmation details after successful booking.
 * Uses smart platform detection for optimal calendar integration.
 */

import { cn } from '@/lib/utils';
import { Phone01, Calendar } from '@untitledui/icons';
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
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-status-active flex-shrink-0">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 12L11 14L15.5 9.5M17.9012 4.99851C18.1071 5.49653 18.5024 5.8924 19.0001 6.09907L20.7452 6.82198C21.2433 7.02828 21.639 7.42399 21.8453 7.92206C22.0516 8.42012 22.0516 8.97974 21.8453 9.47781L21.1229 11.2218C20.9165 11.7201 20.9162 12.2803 21.1236 12.7783L21.8447 14.5218C21.9469 14.7685 21.9996 15.0329 21.9996 15.2999C21.9997 15.567 21.9471 15.8314 21.8449 16.0781C21.7427 16.3249 21.5929 16.549 21.4041 16.7378C21.2152 16.9266 20.991 17.0764 20.7443 17.1785L19.0004 17.9009C18.5023 18.1068 18.1065 18.5021 17.8998 18.9998L17.1769 20.745C16.9706 21.2431 16.575 21.6388 16.0769 21.8451C15.5789 22.0514 15.0193 22.0514 14.5212 21.8451L12.7773 21.1227C12.2792 20.9169 11.7198 20.9173 11.2221 21.1239L9.47689 21.8458C8.97912 22.0516 8.42001 22.0514 7.92237 21.8453C7.42473 21.6391 7.02925 21.2439 6.82281 20.7464L6.09972 19.0006C5.8938 18.5026 5.49854 18.1067 5.00085 17.9L3.25566 17.1771C2.75783 16.9709 2.36226 16.5754 2.15588 16.0777C1.94951 15.5799 1.94923 15.0205 2.1551 14.5225L2.87746 12.7786C3.08325 12.2805 3.08283 11.7211 2.8763 11.2233L2.15497 9.47678C2.0527 9.2301 2.00004 8.96568 2 8.69863C1.99996 8.43159 2.05253 8.16715 2.15472 7.92043C2.25691 7.67372 2.40671 7.44955 2.59557 7.26075C2.78442 7.07195 3.00862 6.92222 3.25537 6.8201L4.9993 6.09772C5.49687 5.89197 5.89248 5.4972 6.0993 5.00006L6.82218 3.25481C7.02848 2.75674 7.42418 2.36103 7.92222 2.15473C8.42027 1.94842 8.97987 1.94842 9.47792 2.15473L11.2218 2.87712C11.7199 3.08291 12.2793 3.08249 12.7771 2.87595L14.523 2.15585C15.021 1.94966 15.5804 1.9497 16.0784 2.15597C16.5763 2.36223 16.972 2.75783 17.1783 3.25576L17.9014 5.00153L17.9012 4.99851Z"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Booking Confirmed</p>
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
