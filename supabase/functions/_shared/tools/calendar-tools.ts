/**
 * Calendar Tools Module
 * Calendar availability checking and appointment booking.
 * 
 * @module _shared/tools/calendar-tools
 * @description Implements calendar availability and booking via edge functions.
 * 
 * @example
 * ```typescript
 * import { checkCalendarAvailability, bookAppointment } from "../_shared/tools/calendar-tools.ts";
 * 
 * const availability = await checkCalendarAvailability(supabaseUrl, { location_id: "..." });
 * const booking = await bookAppointment(supabaseUrl, conversationId, metadata, { ... });
 * ```
 */

import type { ToolResult } from './property-tools.ts';

// ============================================
// TYPES
// ============================================

export interface CheckAvailabilityArgs {
  location_id: string;
  date_from?: string;
  date_to?: string;
  duration_minutes?: number;
}

export interface BookAppointmentArgs {
  location_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  property_address?: string;
  notes?: string;
}

// ============================================
// CALENDAR AVAILABILITY
// ============================================

/**
 * Check available appointment times for property tours/visits
 * 
 * @param supabaseUrl - Supabase project URL
 * @param args - Availability check parameters
 * @returns Available time slots
 */
export async function checkCalendarAvailability(
  supabaseUrl: string,
  args: CheckAvailabilityArgs
): Promise<ToolResult> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-calendar-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || errorData.error || 'Failed to check availability' 
      };
    }

    const data = await response.json();
    
    if (data.available_slots && data.available_slots.length > 0) {
      return { 
        success: true, 
        result: {
          location: data.location,
          available_slots: data.available_slots,
          message: `I found ${data.available_slots.length} available times at ${data.location.name}. Here are some options:`
        }
      };
    } else {
      return { 
        success: true, 
        result: {
          location: data.location,
          available_slots: [],
          message: data.message || 'No available times found for the selected dates. Would you like to check different dates?'
        }
      };
    }
  } catch (error: any) {
    console.error('checkCalendarAvailability error:', error);
    return { success: false, error: error.message || 'Failed to check availability' };
  }
}

// ============================================
// APPOINTMENT BOOKING
// ============================================

/**
 * Book/confirm a tour or appointment
 * 
 * @param supabaseUrl - Supabase project URL
 * @param conversationId - Conversation UUID
 * @param conversationMetadata - Current conversation metadata for visitor info fallback
 * @param args - Booking parameters
 * @returns Booking confirmation
 */
export async function bookAppointment(
  supabaseUrl: string,
  conversationId: string,
  conversationMetadata: any,
  args: BookAppointmentArgs
): Promise<ToolResult> {
  try {
    // Try to fill in visitor info from conversation metadata if not provided
    const visitorName = args.visitor_name || conversationMetadata?.lead_name || 'Guest';
    const visitorEmail = args.visitor_email || conversationMetadata?.lead_email;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/book-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        ...args,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.slot_taken) {
        return { 
          success: false, 
          error: 'This time slot is no longer available. Please choose another time.',
          result: { slot_taken: true }
        };
      }
      
      if (errorData.fallback) {
        return { 
          success: false, 
          error: errorData.error,
          result: { no_calendar: true }
        };
      }
      
      return { 
        success: false, 
        error: errorData.error || 'Failed to book appointment' 
      };
    }

    const data = await response.json();
    
    return { 
      success: true, 
      result: {
        booking: data.booking,
        message: data.booking.confirmation_message
      }
    };
  } catch (error: any) {
    console.error('bookAppointment error:', error);
    return { success: false, error: error.message || 'Failed to book appointment' };
  }
}
