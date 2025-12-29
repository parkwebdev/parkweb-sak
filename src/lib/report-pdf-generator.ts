/**
 * Beautiful PDF Report Generator
 * 
 * Generates branded PDF reports with embedded chart images and styled tables.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ChartImage } from './pdf-chart-capture';

// Colors (RGB tuples)
const C = {
  primary: [15, 23, 42] as const,
  secondary: [100, 116, 139] as const,
  accent: [59, 130, 246] as const,
  success: [34, 197, 94] as const,
  danger: [239, 68, 68] as const,
  muted: [148, 163, 184] as const,
  bg: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface PDFData {
  totalConversations?: number;
  conversationsChange?: number;
  totalLeads?: number;
  leadsChange?: number;
  conversionRate?: number;
  conversationStats?: Array<{ date: string; total: number; active: number; closed: number }>;
  conversationFunnel?: Array<{ name: string; count: number; percentage: number; dropOffPercent: number }>;
  peakActivity?: { peakDay: string; peakTime: string; peakValue: number };
  leadStats?: Array<{ date: string; total: number; [k: string]: string | number }>;
  leadSourceBreakdown?: Array<{ source: string; leads: number; sessions: number; cvr: number }>;
  bookingStats?: Array<{ location: string; total: number; confirmed: number; completed: number; no_show: number; show_rate: number }>;
  bookingTrend?: Array<{ date: string; confirmed: number; completed: number; cancelled: number; noShow: number }>;
  satisfactionStats?: { average_rating: number; total_ratings: number };
  recentFeedback?: Array<{ rating: number; feedback: string | null; createdAt: string; triggerType: string }>;
  aiPerformanceStats?: { containment_rate: number; resolution_rate: number; ai_handled: number; human_takeover: number; total_conversations: number };
  trafficSources?: Array<{ source: string; visitors: number; percentage: number }>;
  topPages?: Array<{ page: string; visits: number; bounce_rate: number; conversations: number }>;
  pageEngagement?: { bounceRate: number; avgPagesPerSession: number; totalSessions: number; overallCVR: number };
  pageDepthDistribution?: Array<{ depth: string; count: number; percentage: number }>;
  visitorLocations?: Array<{ country: string; visitors: number; percentage: number }>;
}

interface PDFConfig {
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
  includeCustomerFeedback?: boolean;
  includeAIPerformance?: boolean;
  includeTrafficSources?: boolean;
  includeTrafficSourceTrend?: boolean;
  includeTopPages?: boolean;
  includePageEngagement?: boolean;
  includePageDepth?: boolean;
  includeVisitorLocations?: boolean;
}

interface GenerateOptions {
  data: PDFData;
  config: PDFConfig;
  startDate: Date;
  endDate: Date;
  orgName: string;
  charts?: Map<string, ChartImage>;
}

export async function generateBeautifulPDF(opts: GenerateOptions): Promise<Blob> {
  const { data, config, startDate, endDate, orgName, charts } = opts;
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN;

  // Header
  y = addHeader(pdf, orgName, startDate, endDate, y);

  // KPIs
  if (config.includeKPIs) {
    y = addKPIs(pdf, data, y);
  }

  // Conversations
  if (config.includeConversations) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Conversations', y);
    if (config.includeCharts && charts?.has('conversation-volume')) {
      y = addImage(pdf, charts.get('conversation-volume')!, y);
    }
    if (config.includeTables && data.conversationStats?.length) {
      y = checkBreak(pdf, y, 80);
      autoTable(pdf, {
        startY: y,
        head: [['Date', 'Total', 'Active', 'Closed']],
        body: data.conversationStats.slice(0, 15).map(s => [s.date, s.total, s.active, s.closed]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Funnel
  if (config.includeConversationFunnel && data.conversationFunnel?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Conversation Funnel', y);
    if (config.includeCharts && charts?.has('conversation-funnel')) {
      y = addImage(pdf, charts.get('conversation-funnel')!, y, 80);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Stage', 'Count', 'Percentage', 'Drop-off']],
        body: data.conversationFunnel.map(s => [s.name, s.count.toLocaleString(), `${s.percentage.toFixed(1)}%`, `${s.dropOffPercent.toFixed(1)}%`]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Peak Activity
  if (config.includePeakActivity && data.peakActivity) {
    y = checkBreak(pdf, y, 120);
    y = addTitle(pdf, 'Peak Activity', y);
    if (config.includeCharts && charts?.has('peak-activity')) {
      y = addImage(pdf, charts.get('peak-activity')!, y, 90);
    }
    y = checkBreak(pdf, y, 40);
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [['Peak Day', data.peakActivity.peakDay], ['Peak Time', data.peakActivity.peakTime], ['Peak Value', `${data.peakActivity.peakValue}`]],
      ...tableStyle(),
    });
    y = tableEnd(pdf) + 10;
  }

  // Leads
  if (config.includeLeads && data.leadStats?.length) {
    y = checkBreak(pdf, y, 80);
    y = addTitle(pdf, 'Leads', y);
    autoTable(pdf, {
      startY: y,
      head: [['Date', 'Total']],
      body: data.leadStats.slice(0, 15).map(s => [s.date, s.total]),
      ...tableStyle(),
    });
    y = tableEnd(pdf) + 10;
  }

  // Lead Source Breakdown
  if (config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Lead Source Breakdown', y);
    if (config.includeCharts && charts?.has('lead-source-breakdown')) {
      y = addImage(pdf, charts.get('lead-source-breakdown')!, y, 80);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Source', 'Leads', 'Sessions', 'CVR']],
        body: data.leadSourceBreakdown.map(s => [s.source, s.leads, s.sessions, `${s.cvr.toFixed(1)}%`]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Lead Conversion Trend
  if (config.includeLeadConversionTrend && charts?.has('lead-conversion-trend')) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Lead Conversion Trend', y);
    y = addImage(pdf, charts.get('lead-conversion-trend')!, y);
  }

  // Bookings
  if (config.includeBookings && data.bookingStats?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Bookings', y);
    if (config.includeCharts && charts?.has('bookings-by-location')) {
      y = addImage(pdf, charts.get('bookings-by-location')!, y);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Location', 'Total', 'Confirmed', 'Completed', 'No-Show', 'Show Rate']],
        body: data.bookingStats.map(s => [s.location, s.total, s.confirmed, s.completed, s.no_show, `${s.show_rate}%`]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Booking Trend
  if (config.includeBookingTrend && data.bookingTrend?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Booking Trend', y);
    if (config.includeCharts && charts?.has('booking-trend')) {
      y = addImage(pdf, charts.get('booking-trend')!, y);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Date', 'Confirmed', 'Completed', 'Cancelled', 'No-Show']],
        body: data.bookingTrend.slice(0, 15).map(i => [i.date, i.confirmed, i.completed, i.cancelled, i.noShow]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Satisfaction
  if (config.includeSatisfaction && data.satisfactionStats) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Customer Satisfaction', y);
    if (config.includeCharts && charts?.has('csat-distribution')) {
      y = addImage(pdf, charts.get('csat-distribution')!, y, 80);
    }
    y = checkBreak(pdf, y, 40);
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [['Average Rating', `${data.satisfactionStats.average_rating.toFixed(1)} / 5`], ['Total Ratings', data.satisfactionStats.total_ratings.toLocaleString()]],
      ...tableStyle(),
    });
    y = tableEnd(pdf) + 10;
  }

  // Feedback
  if (config.includeCustomerFeedback && data.recentFeedback?.length) {
    y = checkBreak(pdf, y, 80);
    y = addTitle(pdf, 'Recent Feedback', y);
    autoTable(pdf, {
      startY: y,
      head: [['Date', 'Rating', 'Feedback', 'Trigger']],
      body: data.recentFeedback.slice(0, 10).map(f => [
        format(new Date(f.createdAt), 'MMM d, yyyy'),
        `${f.rating} ★`,
        (f.feedback || '-').substring(0, 40) + ((f.feedback?.length || 0) > 40 ? '...' : ''),
        f.triggerType
      ]),
      ...tableStyle(),
      columnStyles: { 2: { cellWidth: 60 } },
    });
    y = tableEnd(pdf) + 10;
  }

  // AI Performance
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    y = checkBreak(pdf, y, 80);
    y = addTitle(pdf, 'Ari Performance', y);
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Containment Rate', `${data.aiPerformanceStats.containment_rate}%`],
        ['Resolution Rate', `${data.aiPerformanceStats.resolution_rate}%`],
        ['AI Handled', data.aiPerformanceStats.ai_handled.toLocaleString()],
        ['Human Takeover', data.aiPerformanceStats.human_takeover.toLocaleString()],
        ['Total Conversations', data.aiPerformanceStats.total_conversations.toLocaleString()],
      ],
      ...tableStyle(),
    });
    y = tableEnd(pdf) + 10;
  }

  // Traffic Sources
  if (config.includeTrafficSources && data.trafficSources?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Traffic Sources', y);
    if (config.includeCharts && charts?.has('traffic-sources')) {
      y = addImage(pdf, charts.get('traffic-sources')!, y);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Source', 'Visitors', 'Percentage']],
        body: data.trafficSources.slice(0, 10).map(s => [s.source, s.visitors.toLocaleString(), `${s.percentage}%`]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Traffic Source Trend
  if (config.includeTrafficSourceTrend && charts?.has('traffic-source-trend')) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Traffic Source Trend', y);
    y = addImage(pdf, charts.get('traffic-source-trend')!, y);
  }

  // Top Pages
  if (config.includeTopPages && data.topPages?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Top Pages', y);
    if (config.includeCharts && charts?.has('top-pages')) {
      y = addImage(pdf, charts.get('top-pages')!, y);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Page', 'Visits', 'Bounce Rate', 'Conversations']],
        body: data.topPages.slice(0, 10).map(p => [
          p.page.length > 35 ? p.page.substring(0, 35) + '...' : p.page,
          p.visits.toLocaleString(),
          `${p.bounce_rate}%`,
          p.conversations
        ]),
        ...tableStyle(),
        columnStyles: { 0: { cellWidth: 70 } },
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Page Engagement
  if (config.includePageEngagement && data.pageEngagement) {
    y = checkBreak(pdf, y, 60);
    y = addTitle(pdf, 'Page Engagement', y);
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Bounce Rate', `${data.pageEngagement.bounceRate.toFixed(1)}%`],
        ['Avg Pages/Session', data.pageEngagement.avgPagesPerSession.toFixed(1)],
        ['Total Sessions', data.pageEngagement.totalSessions.toLocaleString()],
        ['Conversion Rate', `${data.pageEngagement.overallCVR.toFixed(1)}%`],
      ],
      ...tableStyle(),
    });
    y = tableEnd(pdf) + 10;
  }

  // Page Depth
  if (config.includePageDepth && data.pageDepthDistribution?.length) {
    y = checkBreak(pdf, y, 100);
    y = addTitle(pdf, 'Page Depth Distribution', y);
    if (config.includeCharts && charts?.has('page-depth')) {
      y = addImage(pdf, charts.get('page-depth')!, y, 80);
    }
    if (config.includeTables) {
      y = checkBreak(pdf, y, 60);
      autoTable(pdf, {
        startY: y,
        head: [['Pages Viewed', 'Sessions', 'Percentage']],
        body: data.pageDepthDistribution.map(d => [d.depth, d.count.toLocaleString(), `${d.percentage.toFixed(1)}%`]),
        ...tableStyle(),
      });
      y = tableEnd(pdf) + 10;
    }
  }

  // Visitor Locations
  if (config.includeVisitorLocations && data.visitorLocations?.length) {
    y = checkBreak(pdf, y, 80);
    y = addTitle(pdf, 'Visitor Locations', y);
    autoTable(pdf, {
      startY: y,
      head: [['Country', 'Visitors', 'Percentage']],
      body: data.visitorLocations.slice(0, 10).map(l => [l.country, l.visitors.toLocaleString(), `${l.percentage}%`]),
      ...tableStyle(),
    });
    y = tableEnd(pdf) + 10;
  }

  // Footer on all pages
  addFooters(pdf);

  return pdf.output('blob');
}

// Helper functions
function addHeader(pdf: jsPDF, org: string, start: Date, end: Date, y: number): number {
  pdf.setFillColor(...C.primary);
  pdf.rect(0, 0, PAGE_W, 40, 'F');
  pdf.setTextColor(...C.white);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${org} - Analytics Report`, MARGIN, 20);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Period: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`, MARGIN, 30);
  pdf.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, PAGE_W - MARGIN - 60, 30);
  pdf.setTextColor(...C.primary);
  return 50;
}

function addKPIs(pdf: jsPDF, data: PDFData, y: number): number {
  const kpis = [
    { label: 'Conversations', value: data.totalConversations?.toLocaleString() || '0', change: data.conversationsChange },
    { label: 'Leads', value: data.totalLeads?.toLocaleString() || '0', change: data.leadsChange },
    { label: 'Conversion Rate', value: `${(data.conversionRate || 0).toFixed(1)}%`, change: null },
  ];
  
  const cardW = (CONTENT_W - 10) / 3;
  const cardH = 25;
  
  kpis.forEach((kpi, i) => {
    const x = MARGIN + i * (cardW + 5);
    pdf.setFillColor(...C.bg);
    pdf.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
    pdf.setTextColor(...C.primary);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 5, y + 12);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.secondary);
    pdf.text(kpi.label, x + 5, y + 20);
    if (kpi.change !== null && kpi.change !== undefined) {
      const isPos = kpi.change >= 0;
      pdf.setTextColor(isPos ? C.success[0] : C.danger[0], isPos ? C.success[1] : C.danger[1], isPos ? C.success[2] : C.danger[2]);
      pdf.text(`${isPos ? '↑' : '↓'} ${Math.abs(kpi.change).toFixed(1)}%`, x + cardW - 25, y + 12);
    }
  });
  
  return y + cardH + 15;
}

function addTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFillColor(...C.accent);
  pdf.rect(MARGIN, y, 4, 8, 'F');
  pdf.setTextColor(...C.primary);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGIN + 8, y + 6);
  return y + 15;
}

function addImage(pdf: jsPDF, chart: ChartImage, y: number, maxH = 70): number {
  const ratio = chart.width / chart.height;
  let imgW = Math.min(CONTENT_W, chart.width * 0.25);
  let imgH = imgW / ratio;
  if (imgH > maxH) { imgH = maxH; imgW = imgH * ratio; }
  pdf.addImage(chart.dataUrl, 'PNG', MARGIN, y, imgW, imgH);
  return y + imgH + 10;
}

function checkBreak(pdf: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) {
    pdf.addPage();
    return MARGIN + 10;
  }
  return y;
}

function tableStyle() {
  return {
    theme: 'striped' as const,
    headStyles: { fillColor: C.primary as [number, number, number], textColor: C.white as [number, number, number], fontStyle: 'bold' as const, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: C.primary as [number, number, number] },
    alternateRowStyles: { fillColor: C.bg as [number, number, number] },
    margin: { left: MARGIN, right: MARGIN },
    tableLineColor: C.muted as [number, number, number],
  };
}

function tableEnd(pdf: jsPDF): number {
  return (pdf as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || MARGIN;
}

function addFooters(pdf: jsPDF): void {
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(...C.muted);
    pdf.text(`Page ${i} of ${pages}`, PAGE_W / 2, PAGE_H - 10, { align: 'center' });
    pdf.text('Powered by Ari Analytics', PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
  }
}