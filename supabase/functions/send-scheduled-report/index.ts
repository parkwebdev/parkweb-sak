/**
 * Scheduled Report Email Edge Function
 * 
 * Sends scheduled analytics reports using the professional Pilot template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  recipients: string[];
  frequency: string;
  report_config: any;
  profiles?: {
    display_name: string | null;
  };
}

// =============================================================================
// DESIGN TOKENS & TEMPLATE COMPONENTS
// =============================================================================

const LOGO_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/widget/66b72b29-fce5-4029-b9ab-8bb8e2adc482/Pilot%20Email%20Logo%20@%20481px.png';

const colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#171717',
  textMuted: '#737373',
  border: '#e5e5e5',
  buttonBg: '#171717',
  buttonText: '#ffffff',
  success: '#22c55e',
  error: '#ef4444',
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

interface WrapperOptions {
  preheaderText: string;
  content: string;
  unsubscribeUrl?: string;
}

const generateWrapper = ({ preheaderText, content, unsubscribeUrl }: WrapperOptions): string => {
  const year = new Date().getFullYear();
  
  const unsubscribeSection = unsubscribeUrl 
    ? `<p class="email-text-muted" style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};"><a href="${unsubscribeUrl}" style="color: ${colors.textMuted}; text-decoration: underline;">Manage notification preferences</a></p>`
    : '';
  
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
              ${unsubscribeSection}
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

// =============================================================================
// REPORT HELPERS
// =============================================================================

function checkShouldRun(
  report: any,
  currentDayOfWeek: number,
  currentDayOfMonth: number,
  currentTime: string
): boolean {
  const reportTime = report.time_of_day.substring(0, 5);
  
  const currentHour = parseInt(currentTime.split(':')[0]);
  const reportHour = parseInt(reportTime.split(':')[0]);
  
  if (currentHour !== reportHour) {
    return false;
  }

  switch (report.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return currentDayOfWeek === report.day_of_week;
    case 'monthly':
      return currentDayOfMonth === report.day_of_month;
    default:
      return false;
  }
}

async function fetchAnalyticsData(supabase: any, report: ScheduledReport) {
  const config = report.report_config;
  const { startDate, endDate, filters } = config;

  let convQuery = supabase
    .from('conversations')
    .select('created_at, status')
    .eq('user_id', report.user_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (filters?.agentId && filters.agentId !== 'all') {
    convQuery = convQuery.eq('agent_id', filters.agentId);
  }

  const { data: conversations } = await convQuery;

  let leadQuery = supabase
    .from('leads')
    .select('created_at, status')
    .eq('user_id', report.user_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (filters?.leadStatus && filters.leadStatus !== 'all') {
    leadQuery = leadQuery.eq('status', filters.leadStatus);
  }

  const { data: leads } = await leadQuery;

  return {
    conversations: conversations || [],
    leads: leads || [],
    totalConversations: conversations?.length || 0,
    totalLeads: leads?.length || 0,
    convertedLeads: leads?.filter((l: any) => l.status === 'converted').length || 0,
  };
}

function generateReportHTML(report: ScheduledReport, data: any, userName: string): string {
  const conversionRate = data.totalLeads > 0 
    ? ((data.convertedLeads / data.totalLeads) * 100).toFixed(1) 
    : '0';

  const appUrl = Deno.env.get("APP_URL") || "https://getpilot.io";
  const unsubscribeUrl = `${appUrl}/settings?tab=notifications#report-emails`;

  // Metrics as a table for email compatibility
  const metricsHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 16px; text-align: center; width: 50%;">
          <p class="email-text" style="margin: 0 0 4px 0; font-size: 28px; font-weight: 600; color: ${colors.text};">${data.totalConversations}</p>
          <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">Conversations</p>
        </td>
        <td style="padding: 16px; text-align: center; width: 50%;">
          <p class="email-text" style="margin: 0 0 4px 0; font-size: 28px; font-weight: 600; color: ${colors.text};">${data.totalLeads}</p>
          <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">Leads</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px; text-align: center; width: 50%;">
          <p class="email-text" style="margin: 0 0 4px 0; font-size: 28px; font-weight: 600; color: ${colors.text};">${data.convertedLeads}</p>
          <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">Converted</p>
        </td>
        <td style="padding: 16px; text-align: center; width: 50%;">
          <p class="email-text" style="margin: 0 0 4px 0; font-size: 28px; font-weight: 600; color: ${colors.text};">${conversionRate}%</p>
          <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">Conversion Rate</p>
        </td>
      </tr>
    </table>
  `;

  const frequencyLabel = report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1);

  const content = `
    ${heading(report.name)}
    ${paragraph(`Here's your ${frequencyLabel.toLowerCase()} analytics report for ${userName}.`)}
    ${metricsHtml}
    ${spacer(16)}
    ${paragraph(`Report generated on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })}`, true)}
  `;

  return generateWrapper({
    preheaderText: `Your ${report.name} is ready - ${data.totalConversations} conversations, ${data.totalLeads} leads`,
    content,
    unsubscribeUrl,
  });
}

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentDayOfMonth = now.getDate();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    console.log('Checking for scheduled reports at:', currentTime);

    const { data: reports, error } = await supabase
      .from('scheduled_reports')
      .select(`
        *,
        profiles!scheduled_reports_user_id_fkey(display_name)
      `)
      .eq('active', true);

    if (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }

    console.log(`Found ${reports?.length || 0} active scheduled reports`);

    const processedReports: string[] = [];

    for (const report of reports || []) {
      const shouldRun = checkShouldRun(report, currentDayOfWeek, currentDayOfMonth, currentTime);
      
      if (!shouldRun) {
        console.log(`Skipping report ${report.id} - not scheduled for this time`);
        continue;
      }

      const userName = report.profiles?.display_name || 'User';
      console.log(`Processing report: ${report.name} for user: ${userName}`);

      try {
        const analyticsData = await fetchAnalyticsData(supabase, report);
        const reportContent = generateReportHTML(report, analyticsData, userName);

        for (const recipient of report.recipients) {
          await resend.emails.send({
            from: "Pilot Analytics <reports@getpilot.io>",
            to: [recipient],
            subject: `${report.name} - ${report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} Report`,
            html: reportContent,
          });
        }

        await supabase
          .from('scheduled_reports')
          .update({ last_sent_at: now.toISOString() })
          .eq('id', report.id);

        processedReports.push(report.id);
        console.log(`Successfully sent report ${report.id}`);
      } catch (error) {
        console.error(`Error processing report ${report.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedCount: processedReports.length,
        reportIds: processedReports 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-scheduled-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
