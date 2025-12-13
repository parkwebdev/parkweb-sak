import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  location_id: string;
  date_from?: string;  // YYYY-MM-DD
  date_to?: string;    // YYYY-MM-DD
  duration_minutes?: number;
}

interface TimeSlot {
  start: string;
  end: string;
  formatted: string;
}

interface BusyPeriod {
  start: Date;
  end: Date;
}

// Parse business hours from location metadata
function parseBusinessHours(businessHours: any, timezone: string): Map<number, { open: string; close: string } | null> {
  const hours = new Map<number, { open: string; close: string } | null>();
  
  // Days: 0=Sunday, 1=Monday, ... 6=Saturday
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
    thursday: 4, friday: 5, saturday: 6
  };
  
  if (!businessHours || typeof businessHours !== 'object') {
    // Default: Mon-Fri 9am-5pm
    for (let i = 1; i <= 5; i++) {
      hours.set(i, { open: '09:00', close: '17:00' });
    }
    hours.set(0, null); // Sunday closed
    hours.set(6, null); // Saturday closed
    return hours;
  }
  
  for (const [day, schedule] of Object.entries(businessHours)) {
    const dayNum = dayMap[day.toLowerCase()];
    if (dayNum === undefined) continue;
    
    if (!schedule || (schedule as any).closed) {
      hours.set(dayNum, null);
    } else {
      hours.set(dayNum, {
        open: (schedule as any).open || '09:00',
        close: (schedule as any).close || '17:00',
      });
    }
  }
  
  // Fill in any missing days as closed
  for (let i = 0; i < 7; i++) {
    if (!hours.has(i)) hours.set(i, null);
  }
  
  return hours;
}

// Format date for display
function formatSlotTime(date: Date, timezone: string): string {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
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
        const error = await response.text();
        console.error('Google token refresh failed:', error);
        throw new Error('Failed to refresh Google token');
      }
      
      const tokens = await response.json();
      
      // Update tokens in database
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
        const error = await response.text();
        console.error('Microsoft token refresh failed:', error);
        throw new Error('Failed to refresh Microsoft token');
      }
      
      const tokens = await response.json();
      
      // Update tokens in database
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

// Query Google Calendar free/busy API
async function getGoogleBusyTimes(
  accessToken: string, 
  calendarId: string | null,
  dateFrom: Date, 
  dateTo: Date
): Promise<BusyPeriod[]> {
  const calId = calendarId || 'primary';
  
  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: dateFrom.toISOString(),
      timeMax: dateTo.toISOString(),
      items: [{ id: calId }],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Google free/busy API error:', error);
    throw new Error('Failed to get Google calendar availability');
  }
  
  const data = await response.json();
  const busy = data.calendars?.[calId]?.busy || [];
  
  return busy.map((period: any) => ({
    start: new Date(period.start),
    end: new Date(period.end),
  }));
}

// Query Microsoft Graph free/busy API
async function getOutlookBusyTimes(
  accessToken: string, 
  dateFrom: Date, 
  dateTo: Date
): Promise<BusyPeriod[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schedules: ['me'],
      startTime: {
        dateTime: dateFrom.toISOString(),
        timeZone: 'UTC',
      },
      endTime: {
        dateTime: dateTo.toISOString(),
        timeZone: 'UTC',
      },
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Microsoft Graph schedule API error:', error);
    throw new Error('Failed to get Outlook calendar availability');
  }
  
  const data = await response.json();
  const scheduleItems = data.value?.[0]?.scheduleItems || [];
  
  return scheduleItems
    .filter((item: any) => item.status !== 'free')
    .map((item: any) => ({
      start: new Date(item.start.dateTime + 'Z'),
      end: new Date(item.end.dateTime + 'Z'),
    }));
}

// Generate available time slots
function generateAvailableSlots(
  dateFrom: Date,
  dateTo: Date,
  businessHours: Map<number, { open: string; close: string } | null>,
  busyPeriods: BusyPeriod[],
  durationMinutes: number,
  timezone: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = durationMinutes * 60 * 1000; // in milliseconds
  
  // Iterate day by day
  const currentDay = new Date(dateFrom);
  currentDay.setHours(0, 0, 0, 0);
  
  while (currentDay <= dateTo && slots.length < 20) { // Limit to 20 slots
    const dayOfWeek = currentDay.getDay();
    const hours = businessHours.get(dayOfWeek);
    
    if (hours) {
      // Parse open/close times
      const [openHour, openMin] = hours.open.split(':').map(Number);
      const [closeHour, closeMin] = hours.close.split(':').map(Number);
      
      // Create slot start time
      const slotStart = new Date(currentDay);
      slotStart.setHours(openHour, openMin, 0, 0);
      
      const dayEnd = new Date(currentDay);
      dayEnd.setHours(closeHour, closeMin, 0, 0);
      
      // Generate slots for this day
      while (slotStart.getTime() + slotDuration <= dayEnd.getTime() && slots.length < 20) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration);
        
        // Check if slot overlaps with any busy period
        const isAvailable = !busyPeriods.some(busy => 
          (slotStart < busy.end && slotEnd > busy.start)
        );
        
        // Check if slot is in the future (at least 1 hour from now)
        const minTime = new Date(Date.now() + 60 * 60 * 1000);
        
        if (isAvailable && slotStart >= minTime) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            formatted: formatSlotTime(slotStart, timezone),
          });
        }
        
        // Move to next slot (30 minute intervals)
        slotStart.setMinutes(slotStart.getMinutes() + 30);
      }
    }
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return slots;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location_id, date_from, date_to, duration_minutes = 30 }: AvailabilityRequest = await req.json();

    if (!location_id) {
      return new Response(
        JSON.stringify({ error: 'location_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking calendar availability:', { location_id, date_from, date_to, duration_minutes });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, timezone, business_hours, phone')
      .eq('id', location_id)
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
      .eq('location_id', location_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.log('No connected calendar for location:', location_id);
      return new Response(
        JSON.stringify({
          location: {
            id: location.id,
            name: location.name,
            timezone: location.timezone || 'America/New_York',
          },
          available_slots: [],
          has_calendar: false,
          message: "This community doesn't have online scheduling set up yet.",
          fallback_action: 'contact_directly',
          fallback_message: 'Please call us directly to schedule your tour.',
          contact_phone: location.phone || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse date range (default to next 7 days)
    const timezone = location.timezone || 'America/New_York';
    const now = new Date();
    const dateFromParsed = date_from ? new Date(date_from) : now;
    const dateToParsed = date_to ? new Date(date_to) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Ensure date range is reasonable (max 14 days)
    const maxDateTo = new Date(dateFromParsed.getTime() + 14 * 24 * 60 * 60 * 1000);
    const effectiveDateTo = dateToParsed > maxDateTo ? maxDateTo : dateToParsed;

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(supabase, account);

    // Get busy times from calendar
    let busyPeriods: BusyPeriod[] = [];
    
    try {
      if (account.provider === 'google_calendar') {
        busyPeriods = await getGoogleBusyTimes(
          accessToken, 
          account.calendar_id, 
          dateFromParsed, 
          effectiveDateTo
        );
      } else if (account.provider === 'outlook_calendar') {
        busyPeriods = await getOutlookBusyTimes(
          accessToken, 
          dateFromParsed, 
          effectiveDateTo
        );
      }
      
      console.log(`Found ${busyPeriods.length} busy periods`);
    } catch (calendarError) {
      console.error('Calendar API error:', calendarError);
      // Continue with empty busy periods - will show all slots as available
    }

    // Parse business hours
    const businessHours = parseBusinessHours(location.business_hours, timezone);

    // Generate available slots
    const availableSlots = generateAvailableSlots(
      dateFromParsed,
      effectiveDateTo,
      businessHours,
      busyPeriods,
      duration_minutes,
      timezone
    );

    console.log(`Generated ${availableSlots.length} available slots`);

    // Update last synced timestamp
    await supabase
      .from('connected_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', account.id);

    return new Response(
      JSON.stringify({
        location: {
          id: location.id,
          name: location.name,
          timezone,
        },
        available_slots: availableSlots,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check availability error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
