import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface BookingEmailRequest {
  to: string;
  visitor_name: string;
  location_name: string;
  location_address?: string;
  location_phone?: string;
  start_time: string;      // ISO datetime
  end_time: string;        // ISO datetime
  timezone: string;
  confirmation_id: string;
  organizer_email?: string;
}

/**
 * Format date for .ics file (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate .ics content with METHOD:REQUEST for Accept/Decline in email clients
 */
function generateCalendarInvite(data: BookingEmailRequest): string {
  const uid = `${data.confirmation_id}@getpilot.io`;
  const now = new Date();
  const startDate = new Date(data.start_time);
  const endDate = new Date(data.end_time);
  const organizerEmail = data.organizer_email || 'bookings@getpilot.io';
  
  const description = [
    `Confirmation: ${data.confirmation_id}`,
    data.location_phone ? `Contact: ${data.location_phone}` : '',
    data.location_address ? `Address: ${data.location_address}` : '',
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pilot//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',  // Enables Accept/Decline in email clients
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:Tour at ${data.location_name}`,
    `LOCATION:${data.location_address || data.location_name}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER;CN=${data.location_name}:mailto:${organizerEmail}`,
    `ATTENDEE;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${data.to}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Format datetime for display in email
 */
function formatDisplayDateTime(isoString: string, timezone: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Get timezone abbreviation
 */
function getTimezoneAbbr(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Generate HTML email template
 */
function generateEmailHtml(data: BookingEmailRequest): string {
  const displayDateTime = formatDisplayDateTime(data.start_time, data.timezone);
  const tzAbbr = getTimezoneAbbr(new Date(data.start_time), data.timezone);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tour Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Tour Confirmed ✓</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.5;">
                Hi ${data.visitor_name},
              </p>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.5;">
                Your tour has been scheduled. We're looking forward to meeting you!
              </p>
              
              <!-- Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
                    <p style="margin: 0 0 16px; color: #18181b; font-size: 16px; font-weight: 600;">${data.location_name}</p>
                    
                    ${data.location_address ? `
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Address</p>
                    <p style="margin: 0 0 16px; color: #3f3f46; font-size: 14px;">${data.location_address}</p>
                    ` : ''}
                    
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
                    <p style="margin: 0 0 16px; color: #18181b; font-size: 16px; font-weight: 600;">${displayDateTime} ${tzAbbr}</p>
                    
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Confirmation</p>
                    <p style="margin: 0; color: #3f3f46; font-size: 14px; font-family: monospace;">${data.confirmation_id}</p>
                  </td>
                </tr>
              </table>
              
              ${data.location_phone ? `
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 14px;">
                Questions? Call us at <a href="tel:${data.location_phone}" style="color: #8b5cf6; text-decoration: none; font-weight: 500;">${data.location_phone}</a>
              </p>
              ` : ''}
              
              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                Need to reschedule? Just reply to this email or start a new chat with us.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e4e4e7; text-align: center;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                Powered by Pilot
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret for security
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
    
    if (!internalSecret || internalSecret !== expectedSecret) {
      console.error('Unauthorized: Invalid internal secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: BookingEmailRequest = await req.json();
    console.log('Sending booking confirmation email:', { 
      to: data.to, 
      location: data.location_name,
      confirmation_id: data.confirmation_id 
    });

    // Validate required fields
    if (!data.to || !data.visitor_name || !data.location_name || !data.start_time || !data.end_time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Generate calendar invite
    const icsContent = generateCalendarInvite(data);
    const icsBase64 = btoa(icsContent);

    // Send email with .ics attachment
    const emailResponse = await resend.emails.send({
      from: `${data.location_name} <bookings@getpilot.io>`,
      to: [data.to],
      subject: `Your tour at ${data.location_name} is confirmed`,
      html: generateEmailHtml(data),
      attachments: [
        {
          filename: 'invite.ics',
          content: icsBase64,
          content_type: 'text/calendar; method=REQUEST',
        }
      ],
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send confirmation email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
