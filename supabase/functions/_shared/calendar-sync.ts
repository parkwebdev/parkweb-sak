/**
 * Shared Calendar Sync Utilities
 * 
 * Common helper functions for calendar event synchronization across
 * Google Calendar and Outlook webhook handlers.
 * 
 * @module _shared/calendar-sync
 * @verified Phase 4 Complete - December 2025
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export type CalendarEventStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface CalendarEventUpdate {
  status?: CalendarEventStatus;
  title?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  updated_at: string;
}

/**
 * Determine if an event should be auto-completed based on end time
 * 
 * @param endTime - ISO timestamp of event end time
 * @param currentStatus - Current status of the event
 * @returns true if event should be marked as completed
 */
export function shouldAutoComplete(
  endTime: string | undefined | null,
  currentStatus: string
): boolean {
  if (!endTime) return false;
  
  // Don't auto-complete if already in a terminal state
  if (currentStatus === 'cancelled' || currentStatus === 'no_show' || currentStatus === 'completed') {
    return false;
  }
  
  // Auto-complete if event end time is in the past
  return new Date(endTime) < new Date();
}

/**
 * Map external calendar status to our internal status
 * 
 * @param externalStatus - Status from external calendar provider
 * @param provider - Calendar provider ('google' | 'outlook')
 * @returns Our internal status or null if no mapping
 */
export function mapExternalStatus(
  externalStatus: string,
  provider: 'google' | 'outlook'
): CalendarEventStatus | null {
  if (provider === 'google') {
    switch (externalStatus) {
      case 'cancelled':
        return 'cancelled';
      case 'confirmed':
      case 'tentative':
        return null; // Keep current status
      default:
        return null;
    }
  }
  
  if (provider === 'outlook') {
    // Outlook uses isCancelled boolean and responseStatus
    if (externalStatus === 'cancelled' || externalStatus === 'declined') {
      return 'cancelled';
    }
    return null;
  }
  
  return null;
}

/**
 * Sync a calendar event status based on external provider data
 * 
 * @param supabase - Supabase client
 * @param eventId - Our internal event ID
 * @param currentStatus - Current status in our database
 * @param externalData - Data from external provider
 * @param provider - Calendar provider
 */
export async function syncEventStatus(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  currentStatus: string,
  externalData: {
    status?: string;
    isCancelled?: boolean;
    endTime?: string;
    title?: string;
    startTime?: string;
  },
  provider: 'google' | 'outlook'
): Promise<{ updated: boolean; newStatus?: string }> {
  const updateData: CalendarEventUpdate = {
    updated_at: new Date().toISOString(),
  };

  // Determine new status
  let newStatus: CalendarEventStatus | null = null;

  // Check for cancellation first
  if (externalData.isCancelled || externalData.status === 'cancelled') {
    newStatus = 'cancelled';
  } else if (provider === 'outlook' && externalData.status === 'declined') {
    newStatus = 'cancelled';
  } else if (shouldAutoComplete(externalData.endTime, currentStatus)) {
    newStatus = 'completed';
  }

  // Only update status if it changed
  if (newStatus && newStatus !== currentStatus) {
    updateData.status = newStatus;
  }

  // Update other fields if provided
  if (externalData.title) {
    updateData.title = externalData.title;
  }
  if (externalData.startTime) {
    updateData.start_time = externalData.startTime;
  }
  if (externalData.endTime) {
    updateData.end_time = externalData.endTime;
  }

  // Perform update
  const { error } = await supabase
    .from('calendar_events')
    .update(updateData)
    .eq('id', eventId);

  if (error) {
    console.error('[calendar-sync] Error updating event:', error);
    return { updated: false };
  }

  return { 
    updated: true, 
    newStatus: newStatus || undefined 
  };
}

/**
 * Find calendar event by external ID
 * 
 * @param supabase - Supabase client
 * @param accountId - Connected account ID
 * @param externalEventId - External calendar event ID
 */
export async function findEventByExternalId(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  externalEventId: string
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, status')
    .eq('connected_account_id', accountId)
    .eq('external_event_id', externalEventId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Mark multiple past events as completed
 * Used by scheduled job to auto-complete events that weren't updated via webhook
 * 
 * @param supabase - Supabase client
 * @param cutoffTime - Events ending before this time will be marked complete
 * @param limit - Maximum number of events to process
 */
export async function autoCompletePastEvents(
  supabase: ReturnType<typeof createClient>,
  cutoffTime: Date = new Date(),
  limit: number = 100
): Promise<{ processed: number; updated: number }> {
  // Find confirmed events that ended before cutoff
  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('status', 'confirmed')
    .lt('end_time', cutoffTime.toISOString())
    .limit(limit);

  if (error) {
    console.error('[calendar-sync] Error fetching past events:', error);
    return { processed: 0, updated: 0 };
  }

  if (!events || events.length === 0) {
    return { processed: 0, updated: 0 };
  }

  const eventIds = events.map(e => e.id);

  // Batch update all matching events
  const { error: updateError } = await supabase
    .from('calendar_events')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .in('id', eventIds);

  if (updateError) {
    console.error('[calendar-sync] Error updating past events:', updateError);
    return { processed: events.length, updated: 0 };
  }

  console.log(`[calendar-sync] Auto-completed ${events.length} past events`);
  return { processed: events.length, updated: events.length };
}
