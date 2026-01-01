/**
 * Booking Confirmation Email Edge Function
 * 
 * Sends booking confirmation emails with calendar invites using the professional Pilot template.
 */

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
  start_time: string;
  end_time: string;
  timezone: string;
  confirmation_id: string;
  organizer_email?: string;
}

// =============================================================================
// DESIGN TOKENS & TEMPLATE COMPONENTS
// =============================================================================

const LOGO_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Pilot%20Email%20Logo%20%40%20481px.png';

const colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#171717',
  textMuted: '#737373',
  border: '#e5e5e5',
  buttonBg: '#171717',
  buttonText: '#ffffff',
  dark: {
    background: '#0a0a0a',
    card: '#171717',
    text: '#fafafa',
    textMuted: '#a3a3a3',
    border: '#262626',
    buttonBg: '#fafafa',
    buttonText: '#171717',
  },
};

const fonts = {
  stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const getBaseStyles = (): string => `
  body, table, td, p, a, li, blockquote {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }
  
  @media (prefers-color-scheme: dark) {
    .email-bg { background-color: ${colors.dark.background} !important; }
    .email-card { background-color: ${colors.dark.card} !important; }
    .email-text { color: ${colors.dark.text} !important; }
    .email-text-muted { color: ${colors.dark.textMuted} !important; }
    .email-border { border-color: ${colors.dark.border} !important; }
    .email-btn { background-color: ${colors.dark.buttonBg} !important; }
    .email-btn-text { color: ${colors.dark.buttonText} !important; }
    .email-detail-bg { background-color: ${colors.dark.background} !important; }
  }
  
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .email-content { padding: 24px !important; }
  }
`;

const generateWrapper = (preheaderText: string, content: string): string => {
  const year = new Date().getFullYear();
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Pilot</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">${getBaseStyles()}</style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; width: 100%; background-color: ${colors.background}; font-family: ${fonts.stack};">
  ${preheaderText ? `<div style="display: none; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${preheaderText}${'&nbsp;'.repeat(50)}</div>` : ''}
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-bg" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container email-card" style="max-width: 600px; width: 100%; background-color: ${colors.card}; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td class="email-content" style="padding: 32px 40px 0 40px;">
              <img src="${LOGO_URL}" alt="Pilot" width="40" height="40" style="display: block; width: 40px; height: 40px;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-content email-border" style="padding: 24px 40px; border-top: 1px solid ${colors.border};">
              <p class="email-text-muted" style="margin: 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const heading = (text: string): string => `
  <h1 class="email-text" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3; color: ${colors.text};">${text}</h1>
`;

const paragraph = (text: string, muted = false): string => {
  const color = muted ? colors.textMuted : colors.text;
  const className = muted ? 'email-text-muted' : 'email-text';
  return `<p class="${className}" style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${color};">${text}</p>`;
};

const spacer = (height = 24): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="height: ${height}px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
  </table>
`;

const detailRow = (label: string, value: string): string => `
  <tr>
    <td class="email-text-muted" style="padding: 8px 0; font-size: 14px; color: ${colors.textMuted}; width: 120px; vertical-align: top;">${label}</td>
    <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 500;">${value}</td>
  </tr>
`;

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
  
  return generateWrapper(`Your tour at ${data.location_name} is confirmed for ${displayDateTime}`, content);
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
