/**
 * Calendar Event Recurrence Utilities
 * 
 * Handles expansion of recurring calendar events into individual instances.
 * Supports daily, weekly, monthly, and yearly recurrence patterns.
 * 
 * @module lib/recurrence
 */

import { 
  addDays, addWeeks, addMonths, addYears,
  isBefore, isAfter, isSameDay, startOfDay,
  differenceInMinutes, getDay
} from 'date-fns';
import type { CalendarEvent, RecurrenceRule } from '@/types/calendar';

/**
 * Calculate the next date in a recurrence sequence based on frequency.
 * 
 * @param date - Current date in sequence
 * @param rule - Recurrence rule with frequency and interval
 * @returns Next date in the recurrence pattern
 * @internal
 */
const getNextDate = (date: Date, rule: RecurrenceRule): Date => {
  switch (rule.frequency) {
    case 'daily':
      return addDays(date, rule.interval);
    case 'weekly':
      return addWeeks(date, rule.interval);
    case 'monthly':
      return addMonths(date, rule.interval);
    case 'yearly':
      return addYears(date, rule.interval);
    default:
      return addDays(date, 1);
  }
};

/**
 * Check if a date falls on one of the selected days of week.
 * 
 * @param date - Date to check
 * @param daysOfWeek - Array of day indices (0=Sunday, 6=Saturday)
 * @returns True if date matches selected days or no days specified
 * @internal
 */
const matchesDaysOfWeek = (date: Date, daysOfWeek?: number[]): boolean => {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(getDay(date));
};

/**
 * Expand a single recurring event into individual instances within a date range.
 * Non-recurring events are returned as-is if they fall within the range.
 * 
 * @param event - Calendar event (may or may not be recurring)
 * @param rangeStart - Start of the date range to expand into
 * @param rangeEnd - End of the date range to expand into
 * @returns Array of event instances within the range
 * 
 * @example
 * const instances = expandRecurringEvent(weeklyMeeting, startOfMonth, endOfMonth);
 * // Returns 4-5 instances for a weekly meeting
 */
export const expandRecurringEvent = (
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] => {
  if (!event.recurrence) {
    // Check if event falls within range
    const eventStart = new Date(event.start);
    if (isAfter(eventStart, rangeEnd) || isBefore(eventStart, rangeStart)) {
      // Still include if event started before range but might overlap
      if (!isBefore(new Date(event.end), rangeStart)) {
        return [event];
      }
      return [];
    }
    return [event];
  }

  const instances: CalendarEvent[] = [];
  const rule = event.recurrence;
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const duration = differenceInMinutes(eventEnd, eventStart);
  
  let currentDate = startOfDay(eventStart);
  let occurrenceCount = 0;
  const maxOccurrences = rule.endType === 'after' ? (rule.endAfterOccurrences || 100) : 365;
  const endDate = rule.endType === 'on' && rule.endDate ? new Date(rule.endDate) : addYears(rangeEnd, 1);
  
  // Start from the original event date
  while (
    occurrenceCount < maxOccurrences &&
    isBefore(currentDate, rangeEnd) &&
    (rule.endType === 'never' || isBefore(currentDate, endDate))
  ) {
    // For weekly recurrence with specific days, we need to check each day
    if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      // Generate events for each selected day in the week
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = addDays(currentDate, dayOffset);
        if (matchesDaysOfWeek(checkDate, rule.daysOfWeek)) {
          if (!isBefore(checkDate, rangeStart) && isBefore(checkDate, rangeEnd)) {
            const instanceStart = new Date(checkDate);
            instanceStart.setHours(eventStart.getHours(), eventStart.getMinutes());
            const instanceEnd = new Date(instanceStart);
            instanceEnd.setMinutes(instanceEnd.getMinutes() + duration);
            
            instances.push({
              ...event,
              id: `${event.id}_${checkDate.toISOString().split('T')[0]}`,
              start: instanceStart,
              end: instanceEnd,
              recurrence_id: event.id,
              is_recurring_instance: !isSameDay(checkDate, eventStart),
            });
            occurrenceCount++;
          }
        }
      }
      currentDate = addWeeks(currentDate, rule.interval);
    } else {
      // Standard recurrence (daily, monthly, yearly, or weekly without specific days)
      if (!isBefore(currentDate, rangeStart) && isBefore(currentDate, rangeEnd)) {
        const instanceStart = new Date(currentDate);
        instanceStart.setHours(eventStart.getHours(), eventStart.getMinutes());
        const instanceEnd = new Date(instanceStart);
        instanceEnd.setMinutes(instanceEnd.getMinutes() + duration);
        
        instances.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString().split('T')[0]}`,
          start: instanceStart,
          end: instanceEnd,
          recurrence_id: event.id,
          is_recurring_instance: !isSameDay(currentDate, eventStart),
        });
        occurrenceCount++;
      }
      currentDate = getNextDate(currentDate, rule);
    }
  }
  
  return instances;
};

/**
 * Expand all events (including recurring) for a date range.
 * 
 * @param events - Array of calendar events
 * @param rangeStart - Start of the date range
 * @param rangeEnd - End of the date range
 * @returns Array of all event instances within the range
 * 
 * @example
 * const allInstances = expandRecurringEvents(events, startOfMonth, endOfMonth);
 */
export const expandRecurringEvents = (
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] => {
  const expandedEvents: CalendarEvent[] = [];
  
  for (const event of events) {
    const instances = expandRecurringEvent(event, rangeStart, rangeEnd);
    expandedEvents.push(...instances);
  }
  
  return expandedEvents;
};

/**
 * Generate a human-readable description of a recurrence rule.
 * 
 * @param rule - Recurrence rule to describe
 * @returns Human-readable description string
 * 
 * @example
 * getRecurrenceDescription({ frequency: 'weekly', interval: 2, daysOfWeek: [1, 3, 5] })
 * // Returns: "Repeats every 2 weeks on Mon, Wed, Fri"
 */
export const getRecurrenceDescription = (rule: RecurrenceRule): string => {
  const intervalText = rule.interval === 1 ? '' : `${rule.interval} `;
  
  let frequencyText = '';
  switch (rule.frequency) {
    case 'daily':
      frequencyText = rule.interval === 1 ? 'day' : 'days';
      break;
    case 'weekly':
      frequencyText = rule.interval === 1 ? 'week' : 'weeks';
      break;
    case 'monthly':
      frequencyText = rule.interval === 1 ? 'month' : 'months';
      break;
    case 'yearly':
      frequencyText = rule.interval === 1 ? 'year' : 'years';
      break;
  }
  
  let description = `Repeats every ${intervalText}${frequencyText}`;
  
  if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = rule.daysOfWeek.map(d => dayNames[d]).join(', ');
    description += ` on ${days}`;
  }
  
  if (rule.endType === 'after' && rule.endAfterOccurrences) {
    description += `, ${rule.endAfterOccurrences} times`;
  } else if (rule.endType === 'on' && rule.endDate) {
    description += ` until ${new Date(rule.endDate).toLocaleDateString()}`;
  }
  
  return description;
};