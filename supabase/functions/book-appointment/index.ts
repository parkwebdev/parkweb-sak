import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  location_id: string;
  conversation_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  property_address?: string;
  event_type?: string;
  notes?: string;
}

// Refresh OAuth token if needed
async function refreshTokenIfNeeded(
  supabase: any, 
  account: any
): Promise<string> {
  const now = new Date();
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  
  // If token expires in less than 5 minutes, refresh it
  if (expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Token expiring soon, refreshing...');
    
    if (account.provider === 'google_calendar') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh Google token');
      }
      
      const tokens = await response.json();
      
      await supabase
        .from('connected_accounts')
        .update({
          access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
      
      return tokens.access_token;
    } else if (account.provider === 'outlook_calendar') {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID') || '',
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET') || '',
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Calendars.ReadWrite offline_access',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh Microsoft token');
      }
      
      const tokens = await response.json();
      
      await supabase
        .from('connected_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || account.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
      
      return tokens.access_token;
    }
  }
  
  return account.access_token;
}

// Create event on Google Calendar
async function createGoogleEvent(
  accessToken: string,
  calendarId: string | null,
  event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    timezone: string;
    attendeeEmail?: string;
  }
): Promise<string> {
  const calId = calendarId || 'primary';
  
  const eventBody: any = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startTime,
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime,
      timeZone: event.timezone,
    },
  };
  
  // Add attendee if email provided
  if (event.attendeeEmail) {
    eventBody.attendees = [{ email: event.attendeeEmail }];
  }
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Google Calendar create event error:', error);
    throw new Error('Failed to create Google Calendar event');
  }
  
  const data = await response.json();
  return data.id;
}

// Create event on Outlook Calendar
async function createOutlookEvent(
  accessToken: string,
  event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    timezone: string;
    attendeeEmail?: string;
  }
): Promise<string> {
  const eventBody: any = {
    subject: event.title,
    body: {
      contentType: 'text',
      content: event.description,
    },
    start: {
      dateTime: event.startTime.replace('Z', ''),
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime.replace('Z', ''),
      timeZone: event.timezone,
    },
  };
  
  // Add attendee if email provided
  if (event.attendeeEmail) {
    eventBody.attendees = [{
      emailAddress: { address: event.attendeeEmail },
      type: 'required',
    }];
  }
  
  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Outlook Calendar create event error:', error);
    throw new Error('Failed to create Outlook Calendar event');
  }
  
  const data = await response.json();
  return data.id;
}

// Check if time slot is still available
async function isSlotAvailable(
  supabase: any,
  accessToken: string,
  account: any,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    if (account.provider === 'google_calendar') {
      const calId = account.calendar_id || 'primary';
      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: calId }],
        }),
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      const busy = data.calendars?.[calId]?.busy || [];
      return busy.length === 0;
    } else if (account.provider === 'outlook_calendar') {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedules: ['me'],
          startTime: { dateTime: startTime.toISOString(), timeZone: 'UTC' },
          endTime: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
        }),
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      const scheduleItems = data.value?.[0]?.scheduleItems || [];
      const busyItems = scheduleItems.filter((item: any) => item.status !== 'free');
      return busyItems.length === 0;
    }
  } catch (error) {
    console.error('Error checking slot availability:', error);
  }
  
  return true; // Assume available if check fails
}

// Format confirmation message
function formatConfirmation(
  locationName: string,
  startTime: Date,
  timezone: string,
  propertyAddress?: string
): string {
  const formatted = startTime.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
  
  const tzAbbr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  }).formatToParts(startTime).find(p => p.type === 'timeZoneName')?.value || timezone;
  
  let message = `Your tour at ${locationName} is confirmed for ${formatted} ${tzAbbr}.`;
  
  if (propertyAddress) {
    message += ` We'll meet you at ${propertyAddress}.`;
  }
  
  message += ' We look forward to seeing you!';
  
  return message;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const booking: BookingRequest = await req.json();

    // Validate required fields
    if (!booking.location_id) {
      return new Response(
        JSON.stringify({ error: 'location_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!booking.start_time) {
      return new Response(
        JSON.stringify({ error: 'start_time is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!booking.visitor_name) {
      return new Response(
        JSON.stringify({ error: 'visitor_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Booking appointment:', booking);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, timezone, agent_id')
      .eq('id', booking.location_id)
      .single();

    if (locationError || !location) {
      console.error('Location not found:', locationError);
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get connected calendar for this location
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('location_id', booking.location_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('No connected calendar for location:', booking.location_id);
      return new Response(
        JSON.stringify({ 
          error: 'No calendar connected to this location. Please contact us directly to schedule.',
          fallback: true,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timezone = location.timezone || 'America/New_York';
    const startTime = new Date(booking.start_time);
    const durationMs = (booking.duration_minutes || 30) * 60 * 1000;
    const endTime = booking.end_time ? new Date(booking.end_time) : new Date(startTime.getTime() + durationMs);

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(supabase, account);

    // Re-check availability to prevent double booking
    const isAvailable = await isSlotAvailable(supabase, accessToken, account, startTime, endTime);
    
    if (!isAvailable) {
      console.log('Time slot no longer available');
      return new Response(
        JSON.stringify({ 
          error: 'Sorry, this time slot is no longer available. Please choose another time.',
          slot_taken: true,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build event details
    const eventTitle = booking.property_address 
      ? `Tour: ${booking.property_address}` 
      : `Property Tour - ${booking.visitor_name}`;
    
    const eventDescription = [
      `Visitor: ${booking.visitor_name}`,
      booking.visitor_email ? `Email: ${booking.visitor_email}` : null,
      booking.visitor_phone ? `Phone: ${booking.visitor_phone}` : null,
      booking.property_address ? `Property: ${booking.property_address}` : null,
      booking.notes ? `Notes: ${booking.notes}` : null,
      '',
      'Booked via ChatPad AI',
    ].filter(Boolean).join('\n');

    // Create event on external calendar
    let externalEventId: string | null = null;
    
    try {
      if (account.provider === 'google_calendar') {
        externalEventId = await createGoogleEvent(accessToken, account.calendar_id, {
          title: eventTitle,
          description: eventDescription,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          timezone,
          attendeeEmail: booking.visitor_email,
        });
      } else if (account.provider === 'outlook_calendar') {
        externalEventId = await createOutlookEvent(accessToken, {
          title: eventTitle,
          description: eventDescription,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          timezone,
          attendeeEmail: booking.visitor_email,
        });
      }
      
      console.log('Created external calendar event:', externalEventId);
    } catch (calendarError) {
      console.error('Failed to create external calendar event:', calendarError);
      // Continue anyway - store in our system even if external fails
    }

    // Get lead_id from conversation if available
    let leadId: string | null = null;
    if (booking.conversation_id) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', booking.conversation_id)
        .single();
      
      leadId = conv?.metadata?.lead_id || null;
    }

    // Store booking in calendar_events table
    const { data: calendarEvent, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        connected_account_id: account.id,
        location_id: booking.location_id,
        conversation_id: booking.conversation_id || null,
        lead_id: leadId,
        external_event_id: externalEventId,
        title: eventTitle,
        description: eventDescription,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        timezone,
        visitor_name: booking.visitor_name,
        visitor_email: booking.visitor_email || null,
        visitor_phone: booking.visitor_phone || null,
        event_type: booking.event_type || 'tour',
        notes: booking.notes || null,
        status: 'confirmed',
        metadata: {
          property_address: booking.property_address,
          booked_via: 'chatpad_ai',
          booked_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to store booking:', insertError);
      // Don't fail the request - external calendar event was created
    }

    const bookingId = calendarEvent?.id || externalEventId || `booking_${Date.now()}`;
    const confirmationMessage = formatConfirmation(location.name, startTime, timezone, booking.property_address);

    // Trigger booking.created webhook (fire and forget)
    try {
      await fetch(`${supabaseUrl}/functions/v1/dispatch-webhook-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': Deno.env.get('INTERNAL_WEBHOOK_SECRET') || '',
        },
        body: JSON.stringify({
          type: 'insert',
          table: 'calendar_events',
          schema: 'public',
          record: {
            id: bookingId,
            location_id: booking.location_id,
            visitor_name: booking.visitor_name,
            visitor_email: booking.visitor_email,
            visitor_phone: booking.visitor_phone,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            event_type: booking.event_type || 'tour',
            property_address: booking.property_address,
            location_name: location.name,
          },
        }),
      });
    } catch (webhookError) {
      console.error('Webhook dispatch failed (non-critical):', webhookError);
    }

    console.log('Booking created successfully:', bookingId);

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: bookingId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location_name: location.name,
          confirmation_message: confirmationMessage,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while booking' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
