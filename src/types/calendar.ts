export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  source?: 'google' | 'microsoft' | 'calendly' | 'calcom' | 'native';
  metadata?: Record<string, unknown>;
}

export type CalendarView = 'month' | 'week' | 'day';
