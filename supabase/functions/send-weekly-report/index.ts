import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = Deno.env.get("APP_URL") || "https://app.getpilot.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// EMAIL TEMPLATE (matches preview exactly)
// =============================================================================

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
};

const fonts = {
  stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

function generateWeeklyReportEmail(data: {
  reportName: string;
  dateRange: string;
  metrics: { label: string; value: string; change?: string }[];
  viewReportUrl: string;
}): string {
  const year = new Date().getFullYear();
  
  const metricsHtml = data.metrics.map(m => {
    const changeColor = m.change?.startsWith('+') ? colors.success 
      : m.change?.startsWith('-') ? colors.error 
      : colors.textMuted;
    
    return `
      <td width="50%" style="padding: 6px; vertical-align: top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${colors.background}; border-radius: 8px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 24px; font-weight: 600; color: ${colors.text};">${m.value}</p>
              <p style="margin: 0; font-size: 13px; color: ${colors.textMuted};">${m.label}</p>
              ${m.change ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: ${changeColor};">${m.change}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    `;
  });
  
  // Build 2x2 grid rows
  const rows: string[] = [];
  for (let i = 0; i < metricsHtml.length; i += 2) {
    const cell1 = metricsHtml[i] || '';
    const cell2 = metricsHtml[i + 1] || '<td width="50%"></td>';
    rows.push(`<tr>${cell1}${cell2}</tr>`);
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <title>Weekly Report</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: ${colors.background}; font-family: ${fonts.stack};">
  <div style="display: none; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">Your weekly analytics report for ${data.dateRange}</div>
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: ${colors.card}; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Pilot%20Email%20Logo%20%40%20481px.png" alt="Pilot" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 6px;">
                    <span style="font-size: 18px; font-weight: 700; color: ${colors.text};">Pilot</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3; color: ${colors.text};">${data.reportName}</h1>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${colors.text};">Here's your report for ${data.dateRange}.</p>
              
              <!-- Metrics Grid -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${rows.join('')}
              </table>
              
              <!-- Spacer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
              </table>
              
              <!-- Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius: 6px; background-color: ${colors.buttonBg};">
                    <a href="${data.viewReportUrl}" target="_blank" style="display: inline-block; font-family: ${fonts.stack}; font-size: 14px; font-weight: 600; color: ${colors.buttonText}; text-decoration: none; padding: 12px 24px; border-radius: 6px;">Review Analytics</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid ${colors.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot</td>
                  <td style="padding: 0 12px;">
                    <div style="width: 1px; height: 16px; background-color: ${colors.border};"></div>
                  </td>
                  <td>
                    <a href="https://www.linkedin.com/company/getpilot" target="_blank" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/LinkedIn%20Icon@4x.png" alt="LinkedIn" height="18" style="display: block; height: 18px; width: auto;" />
                    </a>
                    <a href="https://www.facebook.com/getpilot" target="_blank" style="display: inline-block; vertical-align: middle;">
                      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Facebook%20Icon@4x.png" alt="Facebook" height="18" style="display: block; height: 18px; width: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};"><a href="${appUrl}/settings?tab=notifications#report-emails" style="color: ${colors.textMuted}; text-decoration: underline;">Manage notification preferences</a></p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =============================================================================
// ANALYTICS HELPERS
// =============================================================================

interface WeeklyMetrics {
  conversations: number;
  leads: number;
  conversionRate: number;
  satisfaction: number | null;
}

function calculatePercentChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const formatted = Math.abs(change).toFixed(1);
  return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
}

function calculatePointChange(current: number | null, previous: number | null): string {
  if (current === null) return '';
  if (previous === null) return '';
  const change = current - previous;
  const formatted = Math.abs(change).toFixed(1);
  return change >= 0 ? `+${formatted}` : `-${formatted}`;
}

async function fetchWeeklyMetrics(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyMetrics> {
  // Get conversations for the week (using user_id from agent ownership)
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', userId);
  
  const agentIds = agents?.map(a => a.id) || [];
  
  if (agentIds.length === 0) {
    return { conversations: 0, leads: 0, conversionRate: 0, satisfaction: null };
  }

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .in('agent_id', agentIds)
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd);
  
  const conversationCount = conversations?.length || 0;
  const conversationIds = conversations?.map(c => c.id) || [];

  // Fetch leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd);
  
  const leadCount = leads?.length || 0;

  // Calculate conversion rate
  const conversionRate = conversationCount > 0 
    ? (leadCount / conversationCount) * 100 
    : 0;

  // Fetch satisfaction ratings for conversations in this week
  let satisfaction: number | null = null;
  if (conversationIds.length > 0) {
    const { data: ratings } = await supabase
      .from('conversation_ratings')
      .select('rating')
      .in('conversation_id', conversationIds);
    
    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      satisfaction = Math.round(avgRating * 10) / 10; // Round to 1 decimal
    }
  }

  return {
    conversations: conversationCount,
    leads: leadCount,
    conversionRate: Math.round(conversionRate * 10) / 10,
    satisfaction,
  };
}

function getLastWeekRange(): { start: string; end: string; displayRange: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  
  // Get last Sunday (end of previous week)
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  lastSunday.setHours(23, 59, 59, 999);
  
  // Get last Monday (start of previous week)
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);
  lastMonday.setHours(0, 0, 0, 0);
  
  // Format for display
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const yearOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  
  const startStr = lastMonday.toLocaleDateString('en-US', options);
  const endStr = lastSunday.toLocaleDateString('en-US', yearOptions);
  
  return {
    start: lastMonday.toISOString(),
    end: lastSunday.toISOString(),
    displayRange: `${startStr} - ${endStr}`,
  };
}

function getPreviousWeekRange(currentStart: string): { start: string; end: string } {
  const startDate = new Date(currentStart);
  const prevEnd = new Date(startDate);
  prevEnd.setDate(startDate.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - 6);
  prevStart.setHours(0, 0, 0, 0);
  
  return {
    start: prevStart.toISOString(),
    end: prevEnd.toISOString(),
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly report generation...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all account owners (users with agents)
    const { data: accountOwners, error: ownersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        display_name,
        notification_preferences!inner(report_email_notifications)
      `)
      .not('email', 'is', null);
    
    if (ownersError) {
      console.error("Error fetching account owners:", ownersError);
      throw ownersError;
    }

    // Filter to only users who have report email notifications enabled
    const eligibleUsers = accountOwners?.filter(owner => 
      owner.notification_preferences?.report_email_notifications !== false
    ) || [];

    console.log(`Found ${eligibleUsers.length} eligible users for weekly reports`);

    // Get date ranges
    const { start: weekStart, end: weekEnd, displayRange } = getLastWeekRange();
    const { start: prevStart, end: prevEnd } = getPreviousWeekRange(weekStart);

    console.log(`Processing week: ${displayRange}`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of eligibleUsers) {
      try {
        // Check if user has any agents (actual account owner)
        const { data: userAgents } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.user_id)
          .limit(1);

        if (!userAgents || userAgents.length === 0) {
          console.log(`Skipping user ${user.user_id} - no agents`);
          continue;
        }

        // Fetch current and previous week metrics
        const currentMetrics = await fetchWeeklyMetrics(supabase, user.user_id, weekStart, weekEnd);
        const previousMetrics = await fetchWeeklyMetrics(supabase, user.user_id, prevStart, prevEnd);

        // Skip if no activity at all
        if (currentMetrics.conversations === 0 && currentMetrics.leads === 0 && previousMetrics.conversations === 0) {
          console.log(`Skipping user ${user.user_id} - no activity`);
          continue;
        }

        // Build metrics array matching the preview template
        const metrics = [
          {
            label: 'Conversations',
            value: currentMetrics.conversations.toLocaleString(),
            change: calculatePercentChange(currentMetrics.conversations, previousMetrics.conversations),
          },
          {
            label: 'Leads',
            value: currentMetrics.leads.toLocaleString(),
            change: calculatePercentChange(currentMetrics.leads, previousMetrics.leads),
          },
          {
            label: 'Conversion Rate',
            value: `${currentMetrics.conversionRate}%`,
            change: calculatePercentChange(currentMetrics.conversionRate, previousMetrics.conversionRate),
          },
          {
            label: 'Satisfaction',
            value: currentMetrics.satisfaction !== null ? `${currentMetrics.satisfaction}/5` : 'N/A',
            change: currentMetrics.satisfaction !== null 
              ? calculatePointChange(currentMetrics.satisfaction, previousMetrics.satisfaction)
              : undefined,
          },
        ];

        // Generate email HTML
        const emailHtml = generateWeeklyReportEmail({
          reportName: 'Weekly Report',
          dateRange: displayRange,
          metrics,
          viewReportUrl: `${appUrl}/analytics`,
        });

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
          from: 'Pilot <reports@getpilot.io>',
          to: [user.email!],
          subject: `Weekly Report: ${displayRange}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send to ${user.email}:`, emailError);
          errorCount++;
        } else {
          console.log(`Sent weekly report to ${user.email}`);
          successCount++;
        }

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        errorCount++;
      }
    }

    console.log(`Weekly report complete: ${successCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        errors: errorCount,
        dateRange: displayRange,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in send-weekly-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
