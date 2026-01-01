/**
 * Scheduled Report Email Edge Function
 * 
 * Generates PDF/CSV reports based on user configuration and sends them via email
 * with a professional template matching the Pilot design system.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";
import jsPDF from "npm:jspdf@2.5.1";
import autoTable from "npm:jspdf-autotable@3.8.2";
import { 
  colors, 
  heading, 
  paragraph, 
  button, 
  spacer, 
  generateWrapper 
} from '../_shared/email-template.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = Deno.env.get("APP_URL") || "https://app.getpilot.io";

// Used to securely invoke this function from pg_cron without exposing anon keys in SQL
const internalWebhookSecret = Deno.env.get("INTERNAL_WEBHOOK_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  recipients: string[];
  frequency: string;
  report_config: {
    format: 'csv' | 'pdf';
    startDate: string;
    endDate: string;
    filters?: {
      agentId?: string;
      leadStatus?: string;
    };
    includeConversations?: boolean;
    includeLeads?: boolean;
    includeSatisfaction?: boolean;
    includeAIPerformance?: boolean;
  };
  profiles?: {
    display_name: string | null;
    company_name: string | null;
  };
}

interface AnalyticsData {
  conversations: any[];
  leads: any[];
  ratings: any[];
  totalConversations: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgSatisfaction: number | null;
  previousPeriod?: {
    totalConversations: number;
    totalLeads: number;
    conversionRate: number;
    avgSatisfaction: number | null;
  };
}


// =============================================================================
// REPORT HELPERS
// =============================================================================

function checkShouldRun(
  report: any,
  utcNow: Date
): boolean {
  const timezone = report.timezone || 'America/New_York';
  
  // Get current time components in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'long',
    day: 'numeric',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(utcNow);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const currentHour = parseInt(getPart('hour'));
  const currentDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    .indexOf(getPart('weekday'));
  const currentDayOfMonth = parseInt(getPart('day'));
  
  const reportTime = report.time_of_day.substring(0, 5);
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

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function calculateChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

async function fetchAnalyticsData(supabase: any, report: ScheduledReport): Promise<AnalyticsData> {
  const config = report.report_config;
  const { startDate, endDate, filters } = config;

  // Calculate previous period for comparison
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const periodLength = endMs - startMs;
  const prevStartDate = new Date(startMs - periodLength).toISOString();
  const prevEndDate = startDate;

  // Current period - Conversations
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

  // Previous period - Conversations
  let prevConvQuery = supabase
    .from('conversations')
    .select('id')
    .eq('user_id', report.user_id)
    .gte('created_at', prevStartDate)
    .lt('created_at', prevEndDate);

  if (filters?.agentId && filters.agentId !== 'all') {
    prevConvQuery = prevConvQuery.eq('agent_id', filters.agentId);
  }

  const { data: prevConversations } = await prevConvQuery;

  // Current period - Leads
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

  // Previous period - Leads
  let prevLeadQuery = supabase
    .from('leads')
    .select('status')
    .eq('user_id', report.user_id)
    .gte('created_at', prevStartDate)
    .lt('created_at', prevEndDate);

  const { data: prevLeads } = await prevLeadQuery;

  // Current period - Satisfaction ratings
  const conversationIds = (conversations || []).map((c: any) => c.id).filter(Boolean);
  let ratings: any[] = [];
  
  if (conversationIds.length > 0) {
    const { data: ratingData } = await supabase
      .from('conversation_ratings')
      .select('rating, conversation_id')
      .in('conversation_id', conversationIds);
    ratings = ratingData || [];
  }

  // Also get ratings by date range for conversations we might have missed
  const { data: dateRangeRatings } = await supabase
    .from('conversation_ratings')
    .select('rating')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  const allRatings = [...ratings, ...(dateRangeRatings || [])];
  const uniqueRatings = allRatings.filter((r, i, arr) => 
    arr.findIndex(x => x.rating === r.rating && x.conversation_id === r.conversation_id) === i
  );

  // Previous period - Satisfaction
  const { data: prevRatings } = await supabase
    .from('conversation_ratings')
    .select('rating')
    .gte('created_at', prevStartDate)
    .lt('created_at', prevEndDate);

  // Calculate metrics
  const totalConversations = conversations?.length || 0;
  const totalLeads = leads?.length || 0;
  const convertedLeads = leads?.filter((l: any) => l.status === 'converted').length || 0;
  const conversionRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;
  
  const avgSatisfaction = uniqueRatings.length > 0
    ? uniqueRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / uniqueRatings.length
    : null;

  // Previous period metrics
  const prevTotalConversations = prevConversations?.length || 0;
  const prevTotalLeads = prevLeads?.length || 0;
  const prevConvertedLeads = prevLeads?.filter((l: any) => l.status === 'converted').length || 0;
  const prevConversionRate = prevTotalConversations > 0 ? (prevTotalLeads / prevTotalConversations) * 100 : 0;
  const prevAvgSatisfaction = (prevRatings?.length || 0) > 0
    ? prevRatings!.reduce((sum: number, r: any) => sum + r.rating, 0) / prevRatings!.length
    : null;

  return {
    conversations: conversations || [],
    leads: leads || [],
    ratings: uniqueRatings,
    totalConversations,
    totalLeads,
    convertedLeads,
    conversionRate,
    avgSatisfaction,
    previousPeriod: {
      totalConversations: prevTotalConversations,
      totalLeads: prevTotalLeads,
      conversionRate: prevConversionRate,
      avgSatisfaction: prevAvgSatisfaction,
    },
  };
}

// =============================================================================
// PDF GENERATION
// =============================================================================

function generatePDF(report: ScheduledReport, data: AnalyticsData, companyName: string): Uint8Array {
  const doc = new jsPDF();
  const config = report.report_config;
  const dateRange = formatDateRange(config.startDate, config.endDate);
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(report.name, 20, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`${dateRange} | ${companyName || 'Pilot'}`, 20, 33);
  
  doc.setTextColor(0);
  
  // KPIs Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Key Performance Indicators", 20, 50);
  
  const kpiData = [
    ["Metric", "Value", "Change"],
    ["Conversations", data.totalConversations.toLocaleString(), calculateChange(data.totalConversations, data.previousPeriod?.totalConversations || 0)],
    ["Leads", data.totalLeads.toLocaleString(), calculateChange(data.totalLeads, data.previousPeriod?.totalLeads || 0)],
    ["Conversion Rate", `${data.conversionRate.toFixed(1)}%`, calculateChange(data.conversionRate, data.previousPeriod?.conversionRate || 0)],
    ["Satisfaction", data.avgSatisfaction ? `${data.avgSatisfaction.toFixed(1)}/5` : "N/A", 
      data.avgSatisfaction && data.previousPeriod?.avgSatisfaction 
        ? `${(data.avgSatisfaction - data.previousPeriod.avgSatisfaction) >= 0 ? '+' : ''}${(data.avgSatisfaction - data.previousPeriod.avgSatisfaction).toFixed(1)}`
        : "—"
    ],
  ];
  
  autoTable(doc, {
    startY: 55,
    head: [kpiData[0]],
    body: kpiData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [23, 23, 23] },
    styles: { fontSize: 10 },
  });
  
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Conversations breakdown (if enabled)
  if (config.includeConversations !== false && data.conversations.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Conversation Statistics", 20, currentY);
    
    const statusCounts: Record<string, number> = {};
    data.conversations.forEach((c: any) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    
    const convData = Object.entries(statusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      count.toString(),
      `${((count / data.totalConversations) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Status", "Count", "Percentage"]],
      body: convData,
      theme: 'striped',
      headStyles: { fillColor: [23, 23, 23] },
      styles: { fontSize: 10 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Leads breakdown (if enabled)
  if (config.includeLeads !== false && data.leads.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 25;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Lead Statistics", 20, currentY);
    
    const leadStatusCounts: Record<string, number> = {};
    data.leads.forEach((l: any) => {
      leadStatusCounts[l.status] = (leadStatusCounts[l.status] || 0) + 1;
    });
    
    const leadData = Object.entries(leadStatusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      count.toString(),
      `${((count / data.totalLeads) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Status", "Count", "Percentage"]],
      body: leadData,
      theme: 'striped',
      headStyles: { fillColor: [23, 23, 23] },
      styles: { fontSize: 10 },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Generated by Pilot on ${new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })}`,
      20,
      285
    );
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
  }
  
  return doc.output('arraybuffer') as unknown as Uint8Array;
}

// =============================================================================
// CSV GENERATION
// =============================================================================

function generateCSV(report: ScheduledReport, data: AnalyticsData): string {
  const config = report.report_config;
  const dateRange = formatDateRange(config.startDate, config.endDate);
  
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const rows: string[] = [];
  
  // Header
  rows.push(`${report.name}`);
  rows.push(`Date Range,${dateRange}`);
  rows.push('');
  
  // KPIs
  rows.push('Key Performance Indicators');
  rows.push('Metric,Value,Change');
  rows.push(`Conversations,${data.totalConversations},${calculateChange(data.totalConversations, data.previousPeriod?.totalConversations || 0)}`);
  rows.push(`Leads,${data.totalLeads},${calculateChange(data.totalLeads, data.previousPeriod?.totalLeads || 0)}`);
  rows.push(`Conversion Rate,${data.conversionRate.toFixed(1)}%,${calculateChange(data.conversionRate, data.previousPeriod?.conversionRate || 0)}`);
  rows.push(`Satisfaction,${data.avgSatisfaction ? `${data.avgSatisfaction.toFixed(1)}/5` : 'N/A'},${
    data.avgSatisfaction && data.previousPeriod?.avgSatisfaction 
      ? `${(data.avgSatisfaction - data.previousPeriod.avgSatisfaction) >= 0 ? '+' : ''}${(data.avgSatisfaction - data.previousPeriod.avgSatisfaction).toFixed(1)}`
      : '—'
  }`);
  rows.push('');
  
  // Conversations breakdown
  if (config.includeConversations !== false && data.conversations.length > 0) {
    rows.push('Conversation Statistics');
    rows.push('Status,Count,Percentage');
    
    const statusCounts: Record<string, number> = {};
    data.conversations.forEach((c: any) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      rows.push(`${escapeCSV(status)},${count},${((count / data.totalConversations) * 100).toFixed(1)}%`);
    });
    rows.push('');
  }
  
  // Leads breakdown
  if (config.includeLeads !== false && data.leads.length > 0) {
    rows.push('Lead Statistics');
    rows.push('Status,Count,Percentage');
    
    const leadStatusCounts: Record<string, number> = {};
    data.leads.forEach((l: any) => {
      leadStatusCounts[l.status] = (leadStatusCounts[l.status] || 0) + 1;
    });
    
    Object.entries(leadStatusCounts).forEach(([status, count]) => {
      rows.push(`${escapeCSV(status)},${count},${((count / data.totalLeads) * 100).toFixed(1)}%`);
    });
    rows.push('');
  }
  
  // Footer
  rows.push('');
  rows.push(`Generated by Pilot on ${new Date().toISOString()}`);
  
  return rows.join('\n');
}

// =============================================================================
// EMAIL GENERATION (matching the preview template exactly)
// =============================================================================

function generateReportEmail(
  report: ScheduledReport, 
  _data: AnalyticsData, 
  downloadUrl: string
): string {
  const config = report.report_config;
  const dateRange = formatDateRange(config.startDate, config.endDate);
  const format = config.format || 'pdf';
  const unsubscribeUrl = `${appUrl}/settings?tab=notifications#report-emails`;
  
  // Format badge
  const formatBadge = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 4px 10px; font-size: 12px; font-weight: 600; color: ${colors.textMuted}; background-color: ${colors.background}; border-radius: 4px; text-transform: uppercase;">
          ${format.toUpperCase()} Report
        </td>
      </tr>
    </table>
  `;
  
  const content = `
    ${heading('Your Report is Ready')}
    ${formatBadge}
    ${paragraph(`Your <strong>${report.name}</strong> covering <strong>${dateRange}</strong> has been generated and is ready to download.`)}
    ${spacer(8)}
    ${button('Download Report', downloadUrl)}
    ${spacer(24)}
    ${paragraph("This report was automatically generated based on your scheduled report settings.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${report.name} for ${dateRange} is ready to download`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl,
  });
}

// =============================================================================
// STORAGE & EXPORT TRACKING
// =============================================================================

async function uploadReportToStorage(
  supabase: any,
  report: ScheduledReport,
  fileData: Uint8Array | string,
  format: 'pdf' | 'csv'
): Promise<{ filePath: string; signedUrl: string } | null> {
  const timestamp = Date.now();
  const fileName = `${report.user_id}/scheduled/${report.id}/${timestamp}.${format}`;
  
  const contentType = format === 'pdf' ? 'application/pdf' : 'text/csv';
  const data = format === 'pdf' ? fileData : new TextEncoder().encode(fileData as string);
  
  console.log(`Uploading ${format} to ${fileName}...`);
  
  const { error: uploadError } = await supabase.storage
    .from('report-exports')
    .upload(fileName, data, {
      contentType,
      upsert: false,
    });
  
  if (uploadError) {
    console.error('Error uploading report:', uploadError);
    return null;
  }
  
  // Create signed URL (7 days)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('report-exports')
    .createSignedUrl(fileName, 60 * 60 * 24 * 7);
  
  if (signedUrlError) {
    console.error('Error creating signed URL:', signedUrlError);
    return null;
  }
  
  return {
    filePath: fileName,
    signedUrl: signedUrlData.signedUrl,
  };
}

async function createExportRecord(
  supabase: any,
  report: ScheduledReport,
  filePath: string,
  fileSize: number
): Promise<void> {
  const config = report.report_config;
  
  await supabase.from('report_exports').insert({
    user_id: report.user_id,
    created_by: report.user_id,
    name: `${report.name} (Scheduled)`,
    format: config.format || 'pdf',
    file_path: filePath,
    file_size: fileSize,
    date_range_start: config.startDate,
    date_range_end: config.endDate,
    report_config: config,
  });
}

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Security: this function is intended to run on a schedule (pg_cron), not from the browser.
  // Require the INTERNAL_WEBHOOK_SECRET header to prevent public abuse.
  const providedSecret = req.headers.get('x-internal-secret') || '';
  if (!internalWebhookSecret || providedSecret !== internalWebhookSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    console.log('Checking for scheduled reports at:', now.toISOString());

    // Fetch active scheduled reports
    const { data: reports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }

    // Enrich with profile data (no FK exists, so we fetch separately)
    for (const report of reports || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, company_name')
        .eq('user_id', report.user_id)
        .maybeSingle();
      
      report.profiles = profile;
    }

    console.log(`Found ${reports?.length || 0} active scheduled reports`);

    const processedReports: string[] = [];

    for (const report of reports || []) {
      const shouldRun = checkShouldRun(report, now);
      
      if (!shouldRun) {
        console.log(`Skipping report ${report.id} - not scheduled for this time`);
        continue;
      }

      const companyName = report.profiles?.company_name || 'Pilot';
      console.log(`Processing report: ${report.name} for company: ${companyName}`);

      try {
        // Fetch analytics data with comparison period
        const analyticsData = await fetchAnalyticsData(supabase, report);
        console.log(`Analytics data fetched: ${analyticsData.totalConversations} convos, ${analyticsData.totalLeads} leads`);
        
        // Generate the report file based on format
        const format = report.report_config?.format || 'pdf';
        let fileData: Uint8Array | string;
        
        if (format === 'pdf') {
          fileData = generatePDF(report, analyticsData, companyName);
        } else {
          fileData = generateCSV(report, analyticsData);
        }
        
        // Upload to storage
        const uploadResult = await uploadReportToStorage(supabase, report, fileData, format);
        
        if (!uploadResult) {
          console.error(`Failed to upload report ${report.id}, skipping...`);
          continue;
        }
        
        console.log(`Report uploaded to ${uploadResult.filePath}`);
        
        // Create export record
        const fileSize = typeof fileData === 'string' ? fileData.length : fileData.byteLength;
        await createExportRecord(supabase, report, uploadResult.filePath, fileSize);
        
        // Generate email with download link
        const emailContent = generateReportEmail(report, analyticsData, uploadResult.signedUrl);

        // Send to all recipients
        for (const recipient of report.recipients) {
          console.log(`Sending report to ${recipient}...`);
          
          await resend.emails.send({
            from: "Pilot Analytics <reports@getpilot.io>",
            to: [recipient],
            subject: `${report.name} - ${report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} Report`,
            html: emailContent,
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
