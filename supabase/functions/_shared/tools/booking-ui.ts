/**
 * Booking UI Transform Functions
 * Transform tool results into widget-compatible UI data structures.
 * 
 * @module _shared/tools/booking-ui
 * @description Transforms calendar availability and booking data for widget display.
 * 
 * @example
 * ```typescript
 * import { 
 *   transformToDayPickerData, 
 *   transformToTimePickerData, 
 *   transformToBookingConfirmedData,
 *   detectSelectedDateFromMessages 
 * } from "../_shared/tools/booking-ui.ts";
 * 
 * const dayPicker = transformToDayPickerData(toolResult);
 * const timePicker = transformToTimePickerData(toolResult, selectedDate);
 * const confirmation = transformToBookingConfirmedData(bookingResult);
 * ```
 */

// ============================================
// TYPES - Must match src/widget/types.ts
// ============================================

export interface BookingDay {
  date: string;
  dayName: string;
  dayNumber: number;
  hasAvailability: boolean;
  isToday?: boolean;
}

export interface BookingTime {
  time: string;
  datetime: string;
  available: boolean;
}

export interface DayPickerData {
  locationName: string;
  locationId: string;
  phoneNumber?: string;
  days: BookingDay[];
}

export interface TimePickerData {
  locationName: string;
  locationId: string;
  phoneNumber?: string;
  selectedDate: string;
  selectedDayDisplay: string;
  times: BookingTime[];
}

export interface BookingConfirmationData {
  locationName: string;
  address?: string;
  phoneNumber?: string;
  date: string;
  time: string;
  startDateTime?: string;
  endDateTime?: string;
  confirmationId?: string;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

/**
 * Transform check_calendar_availability result to DayPicker format
 * Groups available slots by date and returns days with availability
 * 
 * @param toolResult - Result from check_calendar_availability tool
 * @returns DayPickerData or null if no available slots
 */
export function transformToDayPickerData(toolResult: any): DayPickerData | null {
  if (!toolResult?.available_slots?.length || !toolResult?.location) return null;
  
  const today = new Date().toISOString().split('T')[0];
  const dayMap = new Map<string, BookingDay>();
  
  for (const slot of toolResult.available_slots) {
    const date = new Date(slot.start);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        hasAvailability: true,
        isToday: dateKey === today,
      });
    }
  }
  
  // Sort by date and limit to 14 days
  const days = Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 14);
  
  return {
    locationName: toolResult.location.name || 'Office',
    locationId: toolResult.location.id || '',
    phoneNumber: toolResult.location.phone || undefined,
    days,
  };
}

/**
 * Transform check_calendar_availability result to TimePicker format for a specific date
 * 
 * @param toolResult - Result from check_calendar_availability tool
 * @param selectedDate - Date to show times for (YYYY-MM-DD format)
 * @returns TimePickerData or null if no times available for date
 */
export function transformToTimePickerData(toolResult: any, selectedDate: string): TimePickerData | null {
  if (!toolResult?.available_slots?.length || !toolResult?.location) return null;
  
  const times = toolResult.available_slots
    .filter((slot: any) => slot.start.startsWith(selectedDate))
    .map((slot: any) => ({
      time: new Date(slot.start).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      datetime: slot.start,
      available: true,
    }));
  
  if (times.length === 0) return null;
  
  const date = new Date(selectedDate);
  return {
    locationName: toolResult.location.name || 'Office',
    locationId: toolResult.location.id || '',
    phoneNumber: toolResult.location.phone || undefined,
    selectedDate,
    selectedDayDisplay: date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    }),
    times,
  };
}

/**
 * Transform book_appointment result to BookingConfirmed format
 * 
 * @param toolResult - Result from book_appointment tool
 * @returns BookingConfirmationData or null if no booking data
 */
export function transformToBookingConfirmedData(toolResult: any): BookingConfirmationData | null {
  if (!toolResult?.booking) return null;
  
  const booking = toolResult.booking;
  const startDate = new Date(booking.start_time);
  
  return {
    locationName: booking.location_name || 'Office',
    address: booking.location_address || undefined,
    phoneNumber: booking.location_phone || undefined,
    date: startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    startDateTime: booking.start_time,
    endDateTime: booking.end_time,
    confirmationId: booking.id,
  };
}

/**
 * Detect if user has selected a specific date from recent messages
 * Looks for patterns like "Monday, December 16" or "Dec 16" in recent user messages
 * 
 * @param messages - Recent conversation messages
 * @returns Selected date in YYYY-MM-DD format or null
 */
export function detectSelectedDateFromMessages(messages: any[]): string | null {
  // Get last 3 user messages
  const recentUserMessages = messages
    .filter((m: any) => m.role === 'user')
    .slice(-3)
    .map((m: any) => m.content?.toLowerCase() || '');
  
  const fullContent = recentUserMessages.join(' ');
  
  // Pattern 1: "Monday, December 16" or "December 16"
  const monthDayPattern = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i;
  const match = fullContent.match(monthDayPattern);
  
  if (match) {
    const monthName = match[1];
    const dayNum = parseInt(match[2], 10);
    const monthIndex = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december']
      .indexOf(monthName.toLowerCase());
    
    if (monthIndex !== -1) {
      const year = new Date().getFullYear();
      const selectedDate = new Date(year, monthIndex, dayNum);
      return selectedDate.toISOString().split('T')[0];
    }
  }
  
  // Pattern 2: Day of week (e.g., "monday" or "this monday")
  const dayOfWeekPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
  const dayMatch = fullContent.match(dayOfWeekPattern);
  
  if (dayMatch) {
    const dayName = dayMatch[1].toLowerCase();
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .indexOf(dayName);
    
    if (targetDay !== -1) {
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      
      const selectedDate = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      return selectedDate.toISOString().split('T')[0];
    }
  }
  
  return null;
}
