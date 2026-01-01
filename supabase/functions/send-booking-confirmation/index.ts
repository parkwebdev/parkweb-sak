/**
 * Booking Confirmation Email Edge Function
 * 
 * Sends booking confirmation emails with calendar invites using the professional Pilot template.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { 
  colors, 
  fonts,
  heading, 
  paragraph, 
  spacer, 
  detailRow,
  generateWrapper 
} from '../_shared/email-template.ts';

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
  start_time: string;
  end_time: string;
  timezone: string;
  confirmation_id: string;
  organizer_email?: string;
}

// =============================================================================
// CALENDAR HELPERS
// =============================================================================

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

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
    'METHOD:REQUEST',
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

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generateEmailHtml(data: BookingEmailRequest): string {
  const displayDateTime = formatDisplayDateTime(data.start_time, data.timezone);
  const tzAbbr = getTimezoneAbbr(new Date(data.start_time), data.timezone);
  
  const content = `
    ${heading('Your booking is confirmed')}
    ${paragraph(`Hi <strong>${data.visitor_name}</strong>, your tour has been scheduled. We're looking forward to meeting you!`)}
    
    <!-- Event Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Location', data.location_name)}
            ${data.location_address ? detailRow('Address', data.location_address) : ''}
            ${detailRow('Date & Time', `${displayDateTime} ${tzAbbr}`)}
            ${detailRow('Confirmation', data.confirmation_id)}
          </table>
        </td>
      </tr>
    </table>
    
    ${data.location_phone ? `${spacer(16)}${paragraph(`Questions? Call us at <a href="tel:${data.location_phone}" style="color: ${colors.text}; text-decoration: underline; font-weight: 500;">${data.location_phone}</a>`, true)}` : ''}
    ${spacer(8)}
    ${paragraph('Need to reschedule? Just reply to this email or start a new chat with us.', true)}
  `;
  
  return generateWrapper({
    preheaderText: `Your tour at ${data.location_name} is confirmed for ${displayDateTime}`,
    content,
    footer: 'simple',
  });
}

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const icsContent = generateCalendarInvite(data);
    const icsBase64 = btoa(icsContent);

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
