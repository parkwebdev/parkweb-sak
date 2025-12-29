/**
 * Beautiful PDF Report Generator
 * 
 * Generates branded PDF reports with embedded chart images,
 * styled KPI cards, and professional formatting.
 * 
 * @module lib/report-pdf-generator
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ReportConfig } from '@/components/analytics/BuildReportSheet';
import type { ReportData } from '@/types/report';
import type { CapturedChart } from './chart-capture-utils';

// Brand colors
const COLORS = {
  primary: [15, 23, 42] as [number, number, number], // Slate-900
  secondary: [100, 116, 139] as [number, number, number], // Slate-500
  accent: [59, 130, 246] as [number, number, number], // Blue-500
  success: [34, 197, 94] as [number, number, number], // Green-500
  danger: [239, 68, 68] as [number, number, number], // Red-500
  muted: [148, 163, 184] as [number, number, number], // Slate-400
  background: [248, 250, 252] as [number, number, number], // Slate-50
  white: [255, 255, 255] as [number, number, number],
};

// Page dimensions
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

interface GeneratePDFOptions {
  data: ReportData;
  config: ReportConfig;
  startDate: Date;
  endDate: Date;
  orgName: string;
  charts?: Map<string, CapturedChart>;
}

/**
 * Generates a beautiful branded PDF report with optional chart images.
 */
export const generateBeautifulPDF = async ({
  data,
  config,
  startDate,
  endDate,
  orgName,
  charts,
}: GeneratePDFOptions): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yPosition = MARGIN;

  // =========================================================================
  // HEADER
  // =========================================================================
  yPosition = addHeader(pdf, orgName, startDate, endDate, yPosition);

  // =========================================================================
  // EXECUTIVE SUMMARY (KPIs)
  // =========================================================================
  if (config.includeKPIs) {
    yPosition = addKPISection(pdf, data, yPosition);
  }

  // =========================================================================
  // CONVERSATIONS SECTION
  // =========================================================================
  if (config.includeConversations) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Conversations', yPosition);

    // Add chart image if available
    if (config.includeCharts && charts?.has('conversation-volume')) {
      yPosition = addChartImage(pdf, charts.get('conversation-volume')!, yPosition);
    }

    // Add table
    if (config.includeTables && data.conversationStats?.length) {
      yPosition = checkPageBreak(pdf, yPosition, 80);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Date', 'Total', 'Active', 'Closed']],
        body: data.conversationStats.slice(0, 15).map(stat => [
          stat.date,
          stat.total,
          stat.active,
          stat.closed,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // CONVERSATION FUNNEL
  // =========================================================================
  if (config.includeConversationFunnel && data.conversationFunnel?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Conversation Funnel', yPosition);

    if (config.includeCharts && charts?.has('conversation-funnel')) {
      yPosition = addChartImage(pdf, charts.get('conversation-funnel')!, yPosition, 80);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Stage', 'Count', 'Percentage', 'Drop-off']],
        body: data.conversationFunnel.map(stage => [
          stage.name,
          stage.count.toLocaleString(),
          `${stage.percentage.toFixed(1)}%`,
          `${stage.dropOffPercent.toFixed(1)}%`,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // PEAK ACTIVITY
  // =========================================================================
  if (config.includePeakActivity && data.peakActivity) {
    yPosition = checkPageBreak(pdf, yPosition, 120);
    yPosition = addSectionTitle(pdf, 'Peak Activity', yPosition);

    if (config.includeCharts && charts?.has('peak-activity')) {
      yPosition = addChartImage(pdf, charts.get('peak-activity')!, yPosition, 90);
    }

    // Peak summary
    yPosition = checkPageBreak(pdf, yPosition, 40);
    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Peak Day', data.peakActivity.peakDay],
        ['Peak Time', data.peakActivity.peakTime],
        ['Peak Conversations', `${data.peakActivity.peakValue}`],
      ],
      ...getTableStyles(),
    });
    yPosition = getTableEndY(pdf) + 10;
  }

  // =========================================================================
  // LEADS SECTION
  // =========================================================================
  if (config.includeLeads) {
    yPosition = checkPageBreak(pdf, yPosition, 80);
    yPosition = addSectionTitle(pdf, 'Leads', yPosition);

    if (config.includeTables && data.leadStats?.length) {
      autoTable(pdf, {
        startY: yPosition,
        head: [['Date', 'Total', 'New', 'Contacted', 'Qualified', 'Converted']],
        body: data.leadStats.slice(0, 15).map(stat => [
          stat.date,
          stat.total,
          stat.new || 0,
          stat.contacted || 0,
          stat.qualified || 0,
          stat.converted || stat.won || 0,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // LEAD SOURCE BREAKDOWN
  // =========================================================================
  if (config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Lead Source Breakdown', yPosition);

    if (config.includeCharts && charts?.has('lead-source-breakdown')) {
      yPosition = addChartImage(pdf, charts.get('lead-source-breakdown')!, yPosition, 80);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Source', 'Leads', 'Sessions', 'Conversion Rate']],
        body: data.leadSourceBreakdown.map(source => [
          source.source,
          source.leads,
          source.sessions,
          `${source.cvr.toFixed(1)}%`,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // LEAD CONVERSION TREND
  // =========================================================================
  if (config.includeLeadConversionTrend && data.leadConversionTrend?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Lead Conversion Trend', yPosition);

    if (config.includeCharts && charts?.has('lead-conversion-trend')) {
      yPosition = addChartImage(pdf, charts.get('lead-conversion-trend')!, yPosition);
    }
  }

  // =========================================================================
  // BOOKINGS SECTION
  // =========================================================================
  if (config.includeBookings && data.bookingStats?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Bookings', yPosition);

    if (config.includeCharts && charts?.has('bookings-by-location')) {
      yPosition = addChartImage(pdf, charts.get('bookings-by-location')!, yPosition);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Location', 'Total', 'Confirmed', 'Completed', 'No-Show', 'Show Rate']],
        body: data.bookingStats.map(stat => [
          stat.location,
          stat.total,
          stat.confirmed,
          stat.completed,
          stat.no_show,
          `${stat.show_rate}%`,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // BOOKING TREND
  // =========================================================================
  if (config.includeBookingTrend && data.bookingTrend?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Booking Trend', yPosition);

    if (config.includeCharts && charts?.has('booking-trend')) {
      yPosition = addChartImage(pdf, charts.get('booking-trend')!, yPosition);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Date', 'Confirmed', 'Completed', 'Cancelled', 'No-Show']],
        body: data.bookingTrend.slice(0, 15).map(item => [
          item.date,
          item.confirmed,
          item.completed,
          item.cancelled,
          item.noShow,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // SATISFACTION SECTION
  // =========================================================================
  if (config.includeSatisfaction && data.satisfactionStats) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Customer Satisfaction', yPosition);

    if (config.includeCharts && charts?.has('csat-distribution')) {
      yPosition = addChartImage(pdf, charts.get('csat-distribution')!, yPosition, 80);
    }

    // Summary stats
    yPosition = checkPageBreak(pdf, yPosition, 40);
    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Average Rating', `${data.satisfactionStats.average_rating.toFixed(1)} / 5`],
        ['Total Ratings', data.satisfactionStats.total_ratings.toLocaleString()],
      ],
      ...getTableStyles(),
    });
    yPosition = getTableEndY(pdf) + 10;
  }

  // =========================================================================
  // CUSTOMER FEEDBACK
  // =========================================================================
  if (config.includeCustomerFeedback && data.recentFeedback?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 80);
    yPosition = addSectionTitle(pdf, 'Recent Feedback', yPosition);

    autoTable(pdf, {
      startY: yPosition,
      head: [['Date', 'Rating', 'Feedback', 'Trigger']],
      body: data.recentFeedback.slice(0, 10).map(item => [
        format(new Date(item.createdAt), 'MMM d, yyyy'),
        `${item.rating} ★`,
        (item.feedback || '-').substring(0, 40) + ((item.feedback?.length || 0) > 40 ? '...' : ''),
        item.triggerType,
      ]),
      ...getTableStyles(),
      columnStyles: { 2: { cellWidth: 60 } },
    });
    yPosition = getTableEndY(pdf) + 10;
  }

  // =========================================================================
  // AI PERFORMANCE
  // =========================================================================
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    yPosition = checkPageBreak(pdf, yPosition, 80);
    yPosition = addSectionTitle(pdf, 'Ari Performance', yPosition);

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Containment Rate', `${data.aiPerformanceStats.containment_rate}%`],
        ['Resolution Rate', `${data.aiPerformanceStats.resolution_rate}%`],
        ['AI Handled', data.aiPerformanceStats.ai_handled.toLocaleString()],
        ['Human Takeover', data.aiPerformanceStats.human_takeover.toLocaleString()],
        ['Total Conversations', data.aiPerformanceStats.total_conversations.toLocaleString()],
      ],
      ...getTableStyles(),
    });
    yPosition = getTableEndY(pdf) + 10;
  }

  // =========================================================================
  // TRAFFIC SOURCES
  // =========================================================================
  if (config.includeTrafficSources && data.trafficSources?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Traffic Sources', yPosition);

    if (config.includeCharts && charts?.has('traffic-sources')) {
      yPosition = addChartImage(pdf, charts.get('traffic-sources')!, yPosition);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Source', 'Visitors', 'Percentage']],
        body: data.trafficSources.slice(0, 10).map(source => [
          source.source,
          source.visitors.toLocaleString(),
          `${source.percentage}%`,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // TRAFFIC SOURCE TREND
  // =========================================================================
  if (config.includeTrafficSourceTrend && data.trafficSourceTrend?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Traffic Source Trend', yPosition);

    if (config.includeCharts && charts?.has('traffic-source-trend')) {
      yPosition = addChartImage(pdf, charts.get('traffic-source-trend')!, yPosition);
    }
  }

  // =========================================================================
  // TOP PAGES
  // =========================================================================
  if (config.includeTopPages && data.topPages?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Top Pages', yPosition);

    if (config.includeCharts && charts?.has('top-pages')) {
      yPosition = addChartImage(pdf, charts.get('top-pages')!, yPosition);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Page', 'Visits', 'Bounce Rate', 'Conversations']],
        body: data.topPages.slice(0, 10).map(page => [
          page.page.length > 35 ? page.page.substring(0, 35) + '...' : page.page,
          page.visits.toLocaleString(),
          `${page.bounce_rate}%`,
          page.conversations,
        ]),
        ...getTableStyles(),
        columnStyles: { 0: { cellWidth: 70 } },
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // PAGE ENGAGEMENT
  // =========================================================================
  if (config.includePageEngagement && data.pageEngagement) {
    yPosition = checkPageBreak(pdf, yPosition, 60);
    yPosition = addSectionTitle(pdf, 'Page Engagement', yPosition);

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Bounce Rate', `${data.pageEngagement.bounceRate.toFixed(1)}%`],
        ['Avg Pages/Session', data.pageEngagement.avgPagesPerSession.toFixed(1)],
        ['Total Sessions', data.pageEngagement.totalSessions.toLocaleString()],
        ['Conversion Rate', `${data.pageEngagement.overallCVR.toFixed(1)}%`],
      ],
      ...getTableStyles(),
    });
    yPosition = getTableEndY(pdf) + 10;
  }

  // =========================================================================
  // PAGE DEPTH
  // =========================================================================
  if (config.includePageDepth && data.pageDepthDistribution?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 100);
    yPosition = addSectionTitle(pdf, 'Page Depth Distribution', yPosition);

    if (config.includeCharts && charts?.has('page-depth')) {
      yPosition = addChartImage(pdf, charts.get('page-depth')!, yPosition, 80);
    }

    if (config.includeTables) {
      yPosition = checkPageBreak(pdf, yPosition, 60);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Pages Viewed', 'Sessions', 'Percentage']],
        body: data.pageDepthDistribution.map(item => [
          item.depth,
          item.count.toLocaleString(),
          `${item.percentage.toFixed(1)}%`,
        ]),
        ...getTableStyles(),
      });
      yPosition = getTableEndY(pdf) + 10;
    }
  }

  // =========================================================================
  // VISITOR LOCATIONS
  // =========================================================================
  if (config.includeVisitorLocations && data.visitorLocations?.length) {
    yPosition = checkPageBreak(pdf, yPosition, 80);
    yPosition = addSectionTitle(pdf, 'Visitor Locations', yPosition);

    autoTable(pdf, {
      startY: yPosition,
      head: [['Country', 'Visitors', 'Percentage']],
      body: data.visitorLocations.slice(0, 10).map(loc => [
        loc.country,
        loc.visitors.toLocaleString(),
        `${loc.percentage}%`,
      ]),
      ...getTableStyles(),
    });
    yPosition = getTableEndY(pdf) + 10;
  }

  // =========================================================================
  // FOOTER
  // =========================================================================
  addFooter(pdf);

  return pdf.output('blob');
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function addHeader(
  pdf: jsPDF,
  orgName: string,
  startDate: Date,
  endDate: Date,
  yPosition: number
): number {
  // Background bar
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, PAGE_WIDTH, 40, 'F');

  // Organization name
  pdf.setTextColor(...COLORS.white);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(orgName, MARGIN, 18);

  // Report title
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Analytics Report', MARGIN, 28);

  // Date range
  const dateRange = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  pdf.setFontSize(10);
  pdf.text(dateRange, PAGE_WIDTH - MARGIN - pdf.getTextWidth(dateRange), 18);

  // Generated timestamp
  const generated = `Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`;
  pdf.text(generated, PAGE_WIDTH - MARGIN - pdf.getTextWidth(generated), 28);

  return 55; // New Y position after header
}

function addKPISection(pdf: jsPDF, data: ReportData, yPosition: number): number {
  pdf.setTextColor(...COLORS.primary);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', MARGIN, yPosition);
  yPosition += 10;

  // KPI cards
  const kpis = [
    { 
      label: 'Conversations', 
      value: data.totalConversations?.toLocaleString() || '0',
      change: data.conversationsChange || 0,
    },
    { 
      label: 'Leads', 
      value: data.totalLeads?.toLocaleString() || '0',
      change: data.leadsChange || 0,
    },
    { 
      label: 'Conversion Rate', 
      value: `${data.conversionRate || 0}%`,
      change: data.conversionChange || 0,
    },
    { 
      label: 'Messages', 
      value: data.totalMessages?.toLocaleString() || '0',
      change: data.messagesChange || 0,
    },
  ];

  const cardWidth = (CONTENT_WIDTH - 15) / 4;
  const cardHeight = 28;

  kpis.forEach((kpi, index) => {
    const x = MARGIN + index * (cardWidth + 5);

    // Card background
    pdf.setFillColor(...COLORS.background);
    pdf.roundedRect(x, yPosition, cardWidth, cardHeight, 2, 2, 'F');

    // Value
    pdf.setTextColor(...COLORS.primary);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 5, yPosition + 12);

    // Label
    pdf.setTextColor(...COLORS.secondary);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(kpi.label, x + 5, yPosition + 20);

    // Change indicator
    const changeColor = kpi.change >= 0 ? COLORS.success : COLORS.danger;
    pdf.setTextColor(...changeColor);
    pdf.setFontSize(8);
    const changeText = `${kpi.change >= 0 ? '↑' : '↓'} ${Math.abs(kpi.change)}%`;
    pdf.text(changeText, x + cardWidth - pdf.getTextWidth(changeText) - 5, yPosition + 12);
  });

  return yPosition + cardHeight + 15;
}

function addSectionTitle(pdf: jsPDF, title: string, yPosition: number): number {
  // Section divider line
  pdf.setDrawColor(...COLORS.muted);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, yPosition - 5, PAGE_WIDTH - MARGIN, yPosition - 5);

  // Title
  pdf.setTextColor(...COLORS.primary);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGIN, yPosition + 5);

  return yPosition + 15;
}

function addChartImage(
  pdf: jsPDF,
  chart: CapturedChart,
  yPosition: number,
  maxHeight: number = 100
): number {
  // Calculate dimensions to fit within page width
  const aspectRatio = chart.width / chart.height;
  let imgWidth = CONTENT_WIDTH;
  let imgHeight = imgWidth / aspectRatio;

  // Cap height
  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = imgHeight * aspectRatio;
  }

  // Center horizontally
  const x = MARGIN + (CONTENT_WIDTH - imgWidth) / 2;

  pdf.addImage(chart.imageData, 'PNG', x, yPosition, imgWidth, imgHeight);

  return yPosition + imgHeight + 10;
}

function addFooter(pdf: jsPDF): void {
  const totalPages = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(...COLORS.muted);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15);

    // Page number
    pdf.setTextColor(...COLORS.secondary);
    pdf.setFontSize(9);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 8,
      { align: 'center' }
    );

    // Branding
    pdf.text('Powered by Ari', MARGIN, PAGE_HEIGHT - 8);
  }
}

function checkPageBreak(pdf: jsPDF, yPosition: number, requiredSpace: number): number {
  if (yPosition + requiredSpace > PAGE_HEIGHT - 30) {
    pdf.addPage();
    return MARGIN + 10;
  }
  return yPosition;
}

function getTableEndY(pdf: jsPDF): number {
  const pdfWithAutoTable = pdf as jsPDF & { lastAutoTable?: { finalY: number } };
  return pdfWithAutoTable.lastAutoTable?.finalY || MARGIN;
}

function getTableStyles() {
  return {
    theme: 'striped' as const,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: COLORS.primary,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    margin: { left: MARGIN, right: MARGIN },
  };
}
