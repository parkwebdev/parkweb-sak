export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceEndType = 'never' | 'after' | 'on';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 weeks
  endType: RecurrenceEndType;
  endAfterOccurrences?: number;
  endDate?: Date;
  daysOfWeek?: number[]; // 0-6 for Sun-Sat (for weekly)
}

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
