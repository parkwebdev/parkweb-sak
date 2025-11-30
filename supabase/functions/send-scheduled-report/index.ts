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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current day and time info
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
    const currentDayOfMonth = now.getDate();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    console.log('Checking for scheduled reports at:', currentTime);

    // Query for reports that should run now
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
      // Check if this report should run now
      const shouldRun = checkShouldRun(report, currentDayOfWeek, currentDayOfMonth, currentTime);
      
      if (!shouldRun) {
        console.log(`Skipping report ${report.id} - not scheduled for this time`);
        continue;
      }

      const userName = report.profiles?.display_name || 'User';
      console.log(`Processing report: ${report.name} for user: ${userName}`);

      try {
        // Fetch analytics data based on report config
        const analyticsData = await fetchAnalyticsData(supabase, report);
        
        // Generate report content
        const reportContent = generateReportHTML(report, analyticsData, userName);

        // Send email to all recipients
        for (const recipient of report.recipients) {
          await resend.emails.send({
            from: "ChatPad Analytics <reports@resend.dev>",
            to: [recipient],
            subject: `${report.name} - ${report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} Report`,
            html: reportContent,
          });
        }

        // Update last_sent_at
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

function checkShouldRun(
  report: any,
  currentDayOfWeek: number,
  currentDayOfMonth: number,
  currentTime: string
): boolean {
  const reportTime = report.time_of_day.substring(0, 5); // Get HH:MM from time
  
  // Check if time matches (within same hour)
  const currentHour = parseInt(currentTime.split(':')[0]);
  const reportHour = parseInt(reportTime.split(':')[0]);
  
  if (currentHour !== reportHour) {
    return false;
  }

  // Check frequency-specific conditions
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

  // Fetch conversation stats
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

  // Fetch lead stats
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
    convertedLeads: leads?.filter(l => l.status === 'converted').length || 0,
  };
}

function generateReportHTML(report: ScheduledReport, data: any, userName: string): string {
  const conversionRate = data.totalLeads > 0 
    ? ((data.convertedLeads / data.totalLeads) * 100).toFixed(1) 
    : '0';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          .metric-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #6c757d;
            margin-bottom: 8px;
          }
          .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #212529;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.name}</h1>
          <p>${report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} Analytics Report for ${userName}</p>
        </div>

        <div class="metrics">
          <div class="metric-card">
            <div class="metric-label">Total Conversations</div>
            <div class="metric-value">${data.totalConversations}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Leads</div>
            <div class="metric-value">${data.totalLeads}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Converted Leads</div>
            <div class="metric-value">${data.convertedLeads}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Conversion Rate</div>
            <div class="metric-value">${conversionRate}%</div>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated report from ChatPad Analytics</p>
          <p>Report generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;
}
