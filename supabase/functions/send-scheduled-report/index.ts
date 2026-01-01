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
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="${LOGO_URL}" alt="Pilot" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 6px;">
                    <span class="email-text" style="font-size: 18px; font-weight: 700; color: ${colors.text};">Pilot</span>
                  </td>
                </tr>
              </table>
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
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-text-muted" style="font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot</td>
                  <td style="padding: 0 12px;">
                    <div style="width: 1px; height: 16px; background-color: ${colors.border};"></div>
                  </td>
                  <td>
                    <a href="https://www.linkedin.com/company/getpilot" target="_blank" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/LinkedIn%20Icon@4x.png" alt="LinkedIn" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
                    </a>
                    <a href="https://www.facebook.com/getpilot" target="_blank" style="display: inline-block; vertical-align: middle;">
                      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Facebook%20Icon@4x.png" alt="Facebook" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
                    </a>
                  </td>
                </tr>
              </table>
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

const button = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-btn" style="border-radius: 6px; background-color: ${colors.buttonBg};">
        <a href="${url}" target="_blank" class="email-btn-text" style="display: inline-block; font-family: ${fonts.stack}; font-size: 14px; font-weight: 600; color: ${colors.buttonText}; text-decoration: none; padding: 12px 24px; border-radius: 6px;">${text}</a>
      </td>
    </tr>
  </table>
`;

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
        profiles!scheduled_reports_user_id_fkey(display_name, company_name)
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
