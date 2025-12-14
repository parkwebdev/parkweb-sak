/**
 * useCalendarEvents Hook
 * 
 * Fetches and manages calendar events from the database with real-time updates.
 * Transforms database calendar_events to the CalendarEvent format used by the Planner.
 * 
 * @module hooks/useCalendarEvents
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import type { CalendarEvent, EventType, EventStatus } from '@/types/calendar';

interface UseCalendarEventsOptions {
  agentId?: string;
  locationId?: string;
}

export const useCalendarEvents = (options: UseCalendarEventsOptions = {}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      // Build query to fetch calendar events
      let query = supabase
        .from('calendar_events')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          event_type,
          visitor_name,
          visitor_email,
          visitor_phone,
          notes,
          metadata,
          location_id,
          lead_id,
          conversation_id,
          connected_account_id,
          locations(id, name)
        `)
        .order('start_time', { ascending: true });

      // Filter by location if provided
      if (options.locationId) {
        query = query.eq('location_id', options.locationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calendar events:', error);
        return;
      }

      // Transform database records to CalendarEvent format
      const calendarEvents: CalendarEvent[] = (data || []).map((event) => {
        const metadata = event.metadata as Record<string, unknown> | null;
        
        // Map database event_type to CalendarEvent type
        const typeMap: Record<string, NonNullable<EventType>> = {
          tour: 'showing',
          showing: 'showing',
          move_in: 'move_in',
          inspection: 'inspection',
          maintenance: 'maintenance',
          meeting: 'meeting',
        };

        // Map database status to CalendarEvent status (exclude no_show)
        const statusMap: Record<string, NonNullable<EventStatus>> = {
          confirmed: 'confirmed',
          pending: 'pending',
          cancelled: 'cancelled',
          completed: 'completed',
          no_show: 'completed', // Map no_show to completed for UI
        };

        return {
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          type: typeMap[event.event_type || 'tour'] || 'showing',
          status: statusMap[event.status || 'confirmed'] || 'confirmed',
          lead_name: event.visitor_name || undefined,
          lead_email: event.visitor_email || undefined,
          lead_phone: event.visitor_phone || undefined,
          property: (metadata?.property_address as string) || undefined,
          community: (event.locations as { name: string } | null)?.name || undefined,
          notes: event.notes || undefined,
          allDay: false,
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, options.locationId]);

  // Cancel a booking
  const cancelEvent = useCallback(async (eventId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ 
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : undefined,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Booking cancelled');
      fetchEvents();
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast.error('Failed to cancel booking');
    }
  }, [fetchEvents]);

  // Mark booking as completed
  const completeEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'completed' })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Booking marked as complete');
      fetchEvents();
    } catch (error) {
      console.error('Error completing event:', error);
      toast.error('Failed to complete booking');
    }
  }, [fetchEvents]);

  // Reschedule a booking
  const rescheduleEvent = useCallback(async (
    eventId: string,
    newStart: Date,
    newEnd: Date,
    reason?: string
  ) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          metadata: reason ? { reschedule_reason: reason } : undefined,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Booking rescheduled');
      fetchEvents();
    } catch (error) {
      console.error('Error rescheduling event:', error);
      toast.error('Failed to reschedule booking');
    }
  }, [fetchEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time subscription for calendar event updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEvents]);

  return {
    events,
    isLoading,
    refetch: fetchEvents,
    cancelEvent,
    completeEvent,
    rescheduleEvent,
  };
};
