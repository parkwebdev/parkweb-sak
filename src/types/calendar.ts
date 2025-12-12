/**
 * Calendar Type Definitions
 * 
 * Type-safe interfaces for calendar events, recurrence rules,
 * and booking management features.
 * 
 * @module types/calendar
 */

/** Recurrence frequency options for repeating events */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** How a recurrence pattern ends */
export type RecurrenceEndType = 'never' | 'after' | 'on';

/**
 * Recurrence rule for repeating events.
 * Supports daily, weekly, monthly, and yearly patterns.
 */
export interface RecurrenceRule {
  /** How often the event repeats */
  frequency: RecurrenceFrequency;
  /** Interval between occurrences (e.g., every 2 weeks) */
  interval: number;
  /** How the recurrence ends */
  endType: RecurrenceEndType;
  /** Number of occurrences before ending (if endType is 'after') */
  endAfterOccurrences?: number;
  /** Date when recurrence ends (if endType is 'on') */
  endDate?: Date;
  /** Days of week for weekly recurrence (0=Sun, 6=Sat) */
  daysOfWeek?: number[];
}

/**
 * Record of a time change made to an event.
 * Used for tracking scheduling changes and audit logging.
 */
export interface TimeChangeRecord {
  timestamp: Date;
  previousStart: Date;
  previousEnd: Date;
  newStart: Date;
  newEnd: Date;
  reason?: string;
  changedBy?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  source?: 'google' | 'microsoft' | 'calendly' | 'calcom' | 'native';
  metadata?: Record<string, unknown>;
  
  // Recurrence fields
  recurrence?: RecurrenceRule;
  recurrence_id?: string; // Links recurring instances to parent
  is_recurring_instance?: boolean;
  
  // Booking-specific fields
  type?: 'showing' | 'move_in' | 'inspection' | 'maintenance' | 'meeting';
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  property?: string;
  community?: string;
  notes?: string;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  
  // Time change tracking
  time_change_history?: TimeChangeRecord[];
}

export type CalendarView = 'month' | 'week' | 'day';

export type EventType = CalendarEvent['type'];
export type EventStatus = CalendarEvent['status'];

export const EVENT_TYPE_CONFIG: Record<NonNullable<EventType>, { label: string; color: string }> = {
  showing: { label: 'Home Showing', color: '#3B82F6' },
  move_in: { label: 'Move-in', color: '#10B981' },
  inspection: { label: 'Inspection', color: '#F59E0B' },
  maintenance: { label: 'Maintenance', color: '#8B5CF6' },
  meeting: { label: 'Meeting', color: '#6366F1' },
};

export const EVENT_STATUS_CONFIG: Record<NonNullable<EventStatus>, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmed', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'outline' },
};
