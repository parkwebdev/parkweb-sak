/**
 * Preview Email Template Edge Function
 * 
 * Renders email templates without sending them, for use by the email test page.
 * This ensures preview matches production by using the same generators as actual email functions.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  colors,
  heading, 
  paragraph, 
  button, 
  spacer, 
  detailRow,
  alertBox,
  generateWrapper 
} from '../_shared/email-template.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// SUPPORTED TEMPLATE TYPES
// =============================================================================

type TemplateType = 
  | 'team-invitation'
  | 'booking-confirmation'
  | 'weekly-report'
  | 'scheduled-report'
  | 'new-lead'
  | 'welcome'
  | 'webhook-failure'
  | 'team-member-removed';

// =============================================================================
// TEMPLATE GENERATORS (matching production edge functions)
// =============================================================================

function generateTeamInvitationPreview(data: {
  invitedBy: string;
  companyName: string;
  signupUrl: string;
}): string {
  const content = `
    ${heading(`You're invited to join ${data.companyName}`)}
    ${paragraph('Hi there,')}
    ${paragraph(`<strong>${data.invitedBy}</strong> has invited you to collaborate on Pilot as part of ${data.companyName}.`)}
    ${paragraph('Pilot helps teams manage conversations, leads, and customer interactions with AI-powered assistance.', true)}
    ${spacer(8)}
    ${button('Accept Invitation', data.signupUrl)}
    ${spacer(24)}
    ${paragraph("If you weren't expecting this invitation, you can safely ignore this email.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `${data.invitedBy} invited you to join ${data.companyName} on Pilot`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#team-emails',
  });
}

function generateBookingConfirmationPreview(data: {
  visitorName: string;
  eventType: string;
  date: string;
  time: string;
  timezone: string;
  location?: string;
  notes?: string;
}): string {
  const content = `
    ${heading('Your booking is confirmed')}
    ${paragraph(`Hi <strong>${data.visitorName}</strong>, your appointment has been scheduled.`)}
    
    <!-- Event Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text};">${data.eventType}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Date', data.date)}
            ${detailRow('Time', `${data.time} (${data.timezone})`)}
            ${data.location ? detailRow('Location', data.location) : ''}
            ${data.notes ? detailRow('Notes', data.notes) : ''}
          </table>
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('Add to Calendar', '#')}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.eventType} is confirmed for ${data.date} at ${data.time}`,
    content,
    footer: 'simple',
  });
}

function generateWeeklyReportPreview(data: {
  reportName: string;
  dateRange: string;
  metrics: { label: string; value: string; change?: string }[];
  viewReportUrl: string;
}): string {
  const metricsHtml = data.metrics.map(m => {
    const changeColor = m.change?.startsWith('+') ? colors.success 
      : m.change?.startsWith('-') ? colors.error 
      : colors.textMuted;
    
    return `
      <td width="50%" style="padding: 6px; vertical-align: top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p class="email-text" style="margin: 0 0 4px 0; font-size: 24px; font-weight: 600; color: ${colors.text};">${m.value}</p>
              <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">${m.label}</p>
              ${m.change ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: ${changeColor};">${m.change}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    `;
  });
  
  const rows: string[] = [];
  for (let i = 0; i < metricsHtml.length; i += 2) {
    const cell1 = metricsHtml[i] || '';
    const cell2 = metricsHtml[i + 1] || '<td width="50%"></td>';
    rows.push(`<tr>${cell1}${cell2}</tr>`);
  }
  
  const content = `
    ${heading(data.reportName)}
    ${paragraph(`Here's your report for ${data.dateRange}.`)}
    
    <!-- Metrics Grid -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${rows.join('')}
    </table>
    
    ${spacer(24)}
    ${button('Review Analytics', data.viewReportUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.reportName} for ${data.dateRange} is ready`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#report-emails',
  });
}

function generateScheduledReportPreview(data: {
  reportName: string;
  dateRange: string;
  format?: 'pdf' | 'csv';
  viewReportUrl: string;
}): string {
  const formatBadge = data.format ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 4px 10px; font-size: 12px; font-weight: 600; color: ${colors.textMuted}; background-color: ${colors.background}; border-radius: 4px; text-transform: uppercase;">
          ${data.format.toUpperCase()} Report
        </td>
      </tr>
    </table>
  ` : '';

  const content = `
    ${heading('Your Report is Ready')}
    ${formatBadge}
    ${paragraph(`Your <strong>${data.reportName}</strong> covering <strong>${data.dateRange}</strong> has been generated and is ready to download.`)}
    ${spacer(8)}
    ${button('Download Report', data.viewReportUrl)}
    ${spacer(24)}
    ${paragraph("This report was automatically generated based on your scheduled report settings.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.reportName} for ${data.dateRange} is ready to download`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#report-emails',
  });
}

function generateNewLeadPreview(data: {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  source?: string;
  message?: string;
  viewLeadUrl: string;
}): string {
  const source = data.source || 'Ari Agent';
  
  const content = `
    ${heading('You have a new lead')}
    ${paragraph('View the lead to see more details.')}
    
    <!-- Lead Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text};">${data.leadName}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${data.leadEmail ? detailRow('Email', data.leadEmail) : ''}
            ${data.leadPhone ? detailRow('Phone', data.leadPhone) : ''}
            ${detailRow('Source', source)}
          </table>
          ${data.message ? `
            ${spacer(12)}
            <p class="email-text-muted" style="margin: 0; font-size: 14px; font-style: italic; color: ${colors.textMuted};">"${data.message}"</p>
          ` : ''}
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('View Lead', data.viewLeadUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `New lead: ${data.leadName} from ${source}`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#lead-emails',
  });
}

function generateWelcomePreview(data: {
  userName: string;
  companyName?: string;
  getStartedUrl: string;
}): string {
  const companyNote = data.companyName 
    ? ` We're excited to have ${data.companyName} on board.`
    : '';
  
  const content = `
    ${heading(`Welcome to Pilot, ${data.userName}!`)}
    ${paragraph(`Thanks for joining Pilot.${companyNote}`)}
    ${paragraph('Pilot helps you manage conversations, capture leads, and provide AI-powered customer support—all in one place.', true)}
    
    <!-- Quick Start -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${colors.text};">Get started in 3 steps:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">1. Set up your AI agent</td>
            </tr>
            <tr>
              <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">2. Add your knowledge base</td>
            </tr>
            <tr>
              <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">3. Install the widget on your site</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('Get Started', data.getStartedUrl)}
    ${spacer(16)}
    ${paragraph("Need help? Reply to this email and we'll get back to you.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `Welcome to Pilot, ${data.userName}! Let's get you set up.`,
    content,
    footer: 'social',
  });
}

function generateWebhookFailurePreview(data: {
  webhookName: string;
  endpoint: string;
  errorCode: number;
  errorMessage: string;
  failedAt: string;
  retryCount: number;
  configureUrl: string;
}): string {
  const content = `
    ${heading('Webhook delivery failed')}
    ${alertBox(`Failed to deliver to <strong>${data.webhookName}</strong> after ${data.retryCount} retries.`, 'error')}
    ${spacer(16)}
    
    <!-- Error Details -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Endpoint', data.endpoint)}
            ${detailRow('Error Code', String(data.errorCode))}
            ${detailRow('Failed At', data.failedAt)}
            ${detailRow('Retries', String(data.retryCount))}
          </table>
          ${spacer(12)}
          <p class="email-text-muted" style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textMuted};">Error Message</p>
          <p class="email-text-error" style="margin: 0; font-size: 13px; font-family: monospace; padding: 8px; background-color: ${colors.card}; border-radius: 4px; color: ${colors.error};">${data.errorMessage}</p>
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('Configure Webhook', data.configureUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `Webhook failed: ${data.webhookName} - Error ${data.errorCode}`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#agent-emails',
  });
}

function generateTeamMemberRemovedPreview(data: {
  adminFirstName: string;
  memberFullName: string;
  companyName: string;
}): string {
  const content = `
    ${heading('Team member removed')}
    ${paragraph(`Hi <strong>${data.adminFirstName}</strong>, your team member <strong>${data.memberFullName}</strong> has been removed from <strong>${data.companyName}</strong>.`)}
    ${spacer(8)}
    ${paragraph('This team member no longer has access to your Pilot account.', true)}
  `;
  
  return generateWrapper({
    preheaderText: `${data.memberFullName} has been removed from ${data.companyName}`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#team-emails',
  });
}

// =============================================================================
// HANDLER
// =============================================================================

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateType, data } = await req.json() as { 
      templateType: TemplateType; 
      data: Record<string, unknown>;
    };

    console.log(`Rendering preview for template: ${templateType}`);

    let html: string;

    switch (templateType) {
      case 'team-invitation':
        html = generateTeamInvitationPreview(data as Parameters<typeof generateTeamInvitationPreview>[0]);
        break;
      case 'booking-confirmation':
        html = generateBookingConfirmationPreview(data as Parameters<typeof generateBookingConfirmationPreview>[0]);
        break;
      case 'weekly-report':
        html = generateWeeklyReportPreview(data as Parameters<typeof generateWeeklyReportPreview>[0]);
        break;
      case 'scheduled-report':
        html = generateScheduledReportPreview(data as Parameters<typeof generateScheduledReportPreview>[0]);
        break;
      case 'new-lead':
        html = generateNewLeadPreview(data as Parameters<typeof generateNewLeadPreview>[0]);
        break;
      case 'welcome':
        html = generateWelcomePreview(data as Parameters<typeof generateWelcomePreview>[0]);
        break;
      case 'webhook-failure':
        html = generateWebhookFailurePreview(data as Parameters<typeof generateWebhookFailurePreview>[0]);
        break;
      case 'team-member-removed':
        html = generateTeamMemberRemovedPreview(data as Parameters<typeof generateTeamMemberRemovedPreview>[0]);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown template type: ${templateType}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in preview-email-template:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
