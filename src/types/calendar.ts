export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  source?: 'google' | 'microsoft' | 'calendly' | 'calcom' | 'native';
  metadata?: Record<string, unknown>;
  
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
