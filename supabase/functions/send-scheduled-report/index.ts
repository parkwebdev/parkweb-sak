/**
 * Scheduled Report Email Edge Function
 * 
 * Generates PDF/CSV reports using @react-pdf/renderer (matching the builder)
 * and sends them via email with a professional template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";
// @ts-ignore
import React from 'npm:react@18.3.1';
// @ts-ignore
import { renderToBuffer } from 'npm:@react-pdf/renderer@4.3.0';

import { 
  colors, 
  heading, 
  paragraph, 
  button, 
  spacer, 
  generateWrapper 
} from '../_shared/email-template.ts';
import { AnalyticsReportPDF, sanitizePDFData, normalizePDFConfig } from '../_shared/pdf/index.ts';
import { buildPDFDataFromSupabase } from '../_shared/build-pdf-data.ts';
import type { PDFData, PDFConfig } from '../_shared/pdf/types.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = Deno.env.get("APP_URL") || "https://app.getpilot.io";

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
  timezone?: string;
  time_of_day: string;
  day_of_week?: number;
  day_of_month?: number;
  report_config: {
    format: 'csv' | 'pdf';
    startDate: string;
    endDate: string;
    type?: 'summary' | 'detailed' | 'comparison';
    grouping?: 'day' | 'week' | 'month';
    filters?: {
      agentId?: string;
      leadStatus?: string;
    };
    // Section toggles
    includeKPIs?: boolean;
    includeCharts?: boolean;
    includeTables?: boolean;
    includeConversations?: boolean;
    includeConversationFunnel?: boolean;
    includePeakActivity?: boolean;
    includeLeads?: boolean;
    includeLeadSourceBreakdown?: boolean;
    includeLeadConversionTrend?: boolean;
    includeBookings?: boolean;
    includeBookingTrend?: boolean;
    includeSatisfaction?: boolean;
    includeCSATDistribution?: boolean;
    includeCustomerFeedback?: boolean;
    includeAIPerformance?: boolean;
    includeAIPerformanceTrend?: boolean;
    includeTrafficSources?: boolean;
    includeTrafficSourceTrend?: boolean;
    includeTopPages?: boolean;
    includePageEngagement?: boolean;
    includePageDepth?: boolean;
    includeVisitorLocations?: boolean;
    includeVisitorCities?: boolean;
    includeUsageMetrics?: boolean;
    includeAgentPerformance?: boolean;
  };
  profiles?: {
    display_name: string | null;
    company_name: string | null;
  };
}

// =============================================================================
// SCHEDULE HELPERS
// =============================================================================

function checkShouldRun(report: any, utcNow: Date): boolean {
  const timezone = report.timezone || 'America/New_York';
  
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

// =============================================================================
// PDF GENERATION (using @react-pdf/renderer - matches builder exactly)
// =============================================================================

async function generatePDF(
  report: ScheduledReport, 
  data: PDFData, 
  companyName: string
): Promise<Uint8Array> {
  const config = report.report_config;
  
  // Normalize config to ensure all boolean flags have defaults
  const normalizedConfig = normalizePDFConfig(config as Partial<PDFConfig>);
  
  // Sanitize data to prevent NaN, Infinity, oversized arrays
  const sanitizedData = sanitizePDFData(data);
  
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  
  console.log(`[generatePDF] Creating PDF with @react-pdf/renderer for ${companyName}`);
  console.log(`[generatePDF] Config: type=${normalizedConfig.type}, charts=${normalizedConfig.includeCharts}, tables=${normalizedConfig.includeTables}`);
  
  // Create the PDF document
  const doc = React.createElement(AnalyticsReportPDF, {
    data: sanitizedData,
    config: normalizedConfig,
    startDate,
    endDate,
    orgName: companyName,
  });

  try {
    // Render to buffer
    const buffer = await renderToBuffer(doc);
    console.log(`[generatePDF] Successfully generated PDF, size: ${buffer.byteLength} bytes`);
    return new Uint8Array(buffer);
  } catch (error) {
    console.error('[generatePDF] Error rendering PDF:', error);
    throw error;
  }
}

// =============================================================================
// CSV GENERATION (unchanged)
// =============================================================================

function generateCSV(report: ScheduledReport, data: PDFData): string {
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
  
  rows.push(`${report.name}`);
  rows.push(`Date Range,${dateRange}`);
  rows.push('');
  
  // KPIs
  rows.push('Key Performance Indicators');
  rows.push('Metric,Value');
  rows.push(`Conversations,${data.totalConversations || 0}`);
  rows.push(`Leads,${data.totalLeads || 0}`);
  rows.push(`Conversion Rate,${(data.conversionRate || 0).toFixed(1)}%`);
  rows.push(`Satisfaction,${data.satisfactionStats?.average_rating ? `${data.satisfactionStats.average_rating.toFixed(1)}/5` : 'N/A'}`);
  rows.push('');
  
  // Conversations by date
  if (data.conversationStats?.length) {
    rows.push('Conversation Statistics');
    rows.push('Date,Total,Active,Closed');
    for (const stat of data.conversationStats) {
      rows.push(`${stat.date},${stat.total},${stat.active},${stat.closed}`);
    }
    rows.push('');
  }
  
  // Leads by date
  if (data.leadStats?.length) {
    rows.push('Lead Statistics');
    rows.push('Date,Total');
    for (const stat of data.leadStats) {
      rows.push(`${stat.date},${stat.total}`);
    }
    rows.push('');
  }

  // Lead sources
  if (data.leadSourceBreakdown?.length) {
    rows.push('Lead Sources');
    rows.push('Source,Leads,CVR');
    for (const source of data.leadSourceBreakdown) {
      rows.push(`${escapeCSV(source.source)},${source.leads},${source.cvr.toFixed(1)}%`);
    }
    rows.push('');
  }

  // Bookings
  if (data.bookingStats?.length) {
    rows.push('Booking Statistics');
    rows.push('Location,Total,Confirmed,Completed,No-Show,Show Rate');
    for (const stat of data.bookingStats) {
      rows.push(`${escapeCSV(stat.location)},${stat.total},${stat.confirmed},${stat.completed},${stat.no_show},${stat.show_rate}%`);
    }
    rows.push('');
  }

  // Traffic sources
  if (data.trafficSources?.length) {
    rows.push('Traffic Sources');
    rows.push('Source,Visitors,Percentage');
    for (const source of data.trafficSources) {
      rows.push(`${escapeCSV(source.source)},${source.visitors},${source.percentage}%`);
    }
    rows.push('');
  }

  // Top pages
  if (data.topPages?.length) {
    rows.push('Top Pages');
    rows.push('Page,Visits,Bounce Rate,Conversions');
    for (const page of data.topPages.slice(0, 20)) {
      rows.push(`${escapeCSV(page.page)},${page.visits},${page.bounce_rate}%,${page.conversations}`);
    }
    rows.push('');
  }
  
  rows.push('');
  rows.push(`Generated by Pilot on ${new Date().toISOString()}`);
  
  return rows.join('\n');
}

// =============================================================================
// EMAIL GENERATION
// =============================================================================

function generateReportEmail(
  report: ScheduledReport, 
  downloadUrl: string
): string {
  const config = report.report_config;
  const dateRange = formatDateRange(config.startDate, config.endDate);
  const format = config.format || 'pdf';
  const unsubscribeUrl = `${appUrl}/settings?tab=notifications#report-emails`;
  
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
  
  console.log(`[uploadReportToStorage] Uploading ${format} to ${fileName}...`);
  
  const { error: uploadError } = await supabase.storage
    .from('report-exports')
    .upload(fileName, data, {
      contentType,
      upsert: false,
    });
  
  if (uploadError) {
    console.error('[uploadReportToStorage] Error uploading report:', uploadError);
    return null;
  }
  
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('report-exports')
    .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days
  
  if (signedUrlError) {
    console.error('[uploadReportToStorage] Error creating signed URL:', signedUrlError);
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

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    
    // Parse request body for optional forceReportId
    let forceReportId: string | null = null;
    try {
      const body = await req.json();
      forceReportId = body.forceReportId || null;
    } catch {
      // No body or invalid JSON
    }

    console.log('[send-scheduled-report] Checking for scheduled reports at:', now.toISOString());
    if (forceReportId) {
      console.log(`[send-scheduled-report] Force sending specific report: ${forceReportId}`);
    }

    // Fetch active scheduled reports
    let query = supabase
      .from('scheduled_reports')
      .select('*')
      .eq('active', true);
    
    if (forceReportId) {
      query = query.eq('id', forceReportId);
    }
    
    const { data: reports, error } = await query;

    if (error) {
      console.error('[send-scheduled-report] Error fetching scheduled reports:', error);
      throw error;
    }

    // Enrich with profile data
    for (const report of reports || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, company_name')
        .eq('user_id', report.user_id)
        .maybeSingle();
      
      report.profiles = profile;
    }

    console.log(`[send-scheduled-report] Found ${reports?.length || 0} active scheduled reports`);

    const processedReports: string[] = [];

    for (const report of reports || []) {
      // Skip schedule check if forcing
      if (!forceReportId) {
        const shouldRun = checkShouldRun(report, now);
        if (!shouldRun) {
          console.log(`[send-scheduled-report] Skipping report ${report.id} - not scheduled for this time`);
          continue;
        }
      }

      const companyName = report.profiles?.company_name || 'Pilot';
      console.log(`[send-scheduled-report] Processing report: ${report.name} for company: ${companyName}`);

      try {
        // Fetch comprehensive analytics data using new builder
        const pdfData = await buildPDFDataFromSupabase(supabase, report.user_id, report.report_config);
        console.log(`[send-scheduled-report] Data fetched: ${pdfData.totalConversations} convos, ${pdfData.totalLeads} leads`);
        
        // Generate the report file
        const format = report.report_config?.format || 'pdf';
        let fileData: Uint8Array | string;
        
        if (format === 'pdf') {
          fileData = await generatePDF(report, pdfData, companyName);
        } else {
          fileData = generateCSV(report, pdfData);
        }
        
        // Upload to storage
        const uploadResult = await uploadReportToStorage(supabase, report, fileData, format);
        
        if (!uploadResult) {
          console.error(`[send-scheduled-report] Failed to upload report ${report.id}, skipping...`);
          continue;
        }
        
        console.log(`[send-scheduled-report] Report uploaded to ${uploadResult.filePath}`);
        
        // Create export record
        const fileSize = typeof fileData === 'string' ? fileData.length : fileData.byteLength;
        await createExportRecord(supabase, report, uploadResult.filePath, fileSize);
        
        // Generate and send email
        const emailContent = generateReportEmail(report, uploadResult.signedUrl);

        for (const recipient of report.recipients) {
          console.log(`[send-scheduled-report] Sending report to ${recipient}...`);
          
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
        console.log(`[send-scheduled-report] Successfully sent report ${report.id}`);
      } catch (error) {
        console.error(`[send-scheduled-report] Error processing report ${report.id}:`, error);
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
    console.error("[send-scheduled-report] Error in function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
