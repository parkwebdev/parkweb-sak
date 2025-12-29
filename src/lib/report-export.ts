/**
 * Report Export Utilities
 * 
 * Generates analytics reports in CSV and PDF formats for download.
 * Supports configurable sections including KPIs, conversation stats,
 * lead stats, agent performance, usage metrics, bookings, satisfaction,
 * AI performance, traffic sources, top pages, and visitor locations.
 * 
 * CSV exports include:
 * - UTF-8 BOM for universal compatibility (Excel, Google Sheets, Numbers, LibreOffice)
 * - Proper escaping for special characters
 * - Windows-compatible line endings (CRLF)
 * 
 * @module lib/report-export
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ReportConfig } from '@/components/analytics/BuildReportSheet';
import type { 
  ReportData, 
  ConversationStat, 
  LeadStat, 
  AgentPerformance, 
  UsageMetric,
  BookingStat,
  TrafficSourceStat,
  TopPageStat,
  LocationStat 
} from '@/types/report';

// =============================================================================
// CSV UTILITIES
// =============================================================================

/** UTF-8 BOM for Excel/Numbers compatibility */
const UTF8_BOM = '\uFEFF';

/**
 * Escapes a CSV value properly for universal compatibility.
 * Handles commas, quotes, newlines, and other special characters.
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, newline, or carriage return, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Creates a CSV row from an array of values with proper escaping.
 */
const createCSVRow = (...values: (string | number | null | undefined)[]): string => {
  return values.map(escapeCSV).join(',');
};

/**
 * Formats duration in milliseconds to human-readable string.
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// =============================================================================
// CSV GENERATION
// =============================================================================

/**
 * Generates a CSV report from analytics data and returns a Blob.
 * Uses UTF-8 BOM and Windows line endings for universal compatibility.
 */
export const generateCSVReport = (
  data: ReportData,
  config: ReportConfig,
  startDate: Date,
  endDate: Date,
  orgName: string
): Blob => {
  const lines: string[] = [];
  
  // Header
  lines.push(escapeCSV(`${orgName} Analytics Report`));
  lines.push(createCSVRow(`Period: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`));
  lines.push(createCSVRow(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`));
  lines.push('');

  // KPIs Section
  if (config.includeKPIs) {
    lines.push('KEY PERFORMANCE INDICATORS');
    lines.push(createCSVRow('Metric', 'Value', 'Change'));
    lines.push(createCSVRow('Total Conversations', data.totalConversations || 0, `${data.conversationsChange || 0}%`));
    lines.push(createCSVRow('Total Leads', data.totalLeads || 0, `${data.leadsChange || 0}%`));
    lines.push(createCSVRow('Conversion Rate', `${data.conversionRate || 0}%`, `${data.conversionChange || 0}%`));
    lines.push(createCSVRow('Total Messages', data.totalMessages || 0, `${data.messagesChange || 0}%`));
    lines.push('');
  }

  // Conversations Data
  if (config.includeConversations && config.includeTables && data.conversationStats) {
    lines.push('CONVERSATION STATISTICS');
    lines.push(createCSVRow('Date', 'Total', 'Active', 'Closed'));
    data.conversationStats.forEach((stat: ConversationStat) => {
      lines.push(createCSVRow(stat.date, stat.total, stat.active, stat.closed));
    });
    lines.push('');
  }

  // Conversation Funnel (NEW)
  if (config.includeConversationFunnel && data.conversationFunnel?.length) {
    lines.push('CONVERSATION FUNNEL');
    lines.push(createCSVRow('Stage', 'Count', 'Percentage', 'Drop-off'));
    data.conversationFunnel.forEach((stage) => {
      lines.push(createCSVRow(
        stage.name,
        stage.count,
        `${stage.percentage.toFixed(1)}%`,
        `${stage.dropOffPercent.toFixed(1)}%`
      ));
    });
    lines.push('');
  }

  // Peak Activity Summary (NEW)
  if (config.includePeakActivity && data.peakActivity) {
    lines.push('PEAK ACTIVITY SUMMARY');
    lines.push(createCSVRow('Metric', 'Value'));
    lines.push(createCSVRow('Peak Day', data.peakActivity.peakDay));
    lines.push(createCSVRow('Peak Time Block', data.peakActivity.peakTime));
    lines.push(createCSVRow('Peak Conversations', data.peakActivity.peakValue));
    lines.push('');
    
    // Heatmap data
    if (data.peakActivity.data?.length) {
      lines.push('PEAK ACTIVITY HEATMAP');
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timeBlocks = ['12a-4a', '4a-8a', '8a-12p', '12p-4p', '4p-8p', '8p-12a'];
      lines.push(createCSVRow('Time Block', ...days));
      timeBlocks.forEach((block, blockIdx) => {
        const rowValues = days.map((_, dayIdx) => data.peakActivity!.data[dayIdx]?.[blockIdx] || 0);
        lines.push(createCSVRow(block, ...rowValues));
      });
      lines.push('');
    }
  }

  // Leads Data
  if (config.includeLeads && config.includeTables && data.leadStats) {
    lines.push('LEAD STATISTICS');
    lines.push(createCSVRow('Date', 'Total', 'New', 'Contacted', 'Qualified', 'Converted'));
    data.leadStats.forEach((stat: LeadStat) => {
      const newCount = (stat.new as number) || 0;
      const contacted = (stat.contacted as number) || 0;
      const qualified = (stat.qualified as number) || 0;
      const converted = (stat.converted as number) || (stat.won as number) || 0;
      lines.push(createCSVRow(stat.date, stat.total, newCount, contacted, qualified, converted));
    });
    lines.push('');
  }

  // Lead Source Breakdown (NEW)
  if (config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length) {
    lines.push('LEAD SOURCE BREAKDOWN');
    lines.push(createCSVRow('Source', 'Leads', 'Sessions', 'Conversion Rate'));
    data.leadSourceBreakdown.forEach((source) => {
      lines.push(createCSVRow(source.source, source.leads, source.sessions, `${source.cvr.toFixed(1)}%`));
    });
    lines.push('');
  }

  // Lead Conversion Trend (NEW)
  if (config.includeLeadConversionTrend && data.leadConversionTrend?.length) {
    lines.push('LEAD CONVERSION TREND');
    // Get all unique stage keys from the first item
    const firstItem = data.leadConversionTrend[0];
    const stageKeys = Object.keys(firstItem).filter(k => k !== 'date');
    lines.push(createCSVRow('Date', ...stageKeys));
    data.leadConversionTrend.forEach((item) => {
      const values = stageKeys.map(key => item[key] as number);
      lines.push(createCSVRow(item.date as string, ...values));
    });
    lines.push('');
  }

  // Agent Performance
  if (config.includeAgentPerformance && config.includeTables && data.agentPerformance) {
    lines.push('AGENT PERFORMANCE');
    lines.push(createCSVRow('Agent', 'Conversations', 'Avg Response Time', 'Satisfaction Score'));
    data.agentPerformance.forEach((agent: AgentPerformance) => {
      lines.push(createCSVRow(
        agent.agent_name,
        agent.total_conversations,
        agent.avg_response_time,
        agent.satisfaction_score
      ));
    });
    lines.push('');
  }

  // Usage Metrics
  if (config.includeUsageMetrics && config.includeTables && data.usageMetrics) {
    lines.push('USAGE METRICS');
    lines.push(createCSVRow('Date', 'Conversations', 'Messages', 'API Calls'));
    data.usageMetrics.forEach((metric: UsageMetric) => {
      lines.push(createCSVRow(metric.date, metric.conversations, metric.messages, metric.api_calls));
    });
    lines.push('');
  }

  // Booking Statistics
  if (config.includeBookings && config.includeTables && data.bookingStats) {
    lines.push('BOOKING STATISTICS');
    lines.push(createCSVRow('Location', 'Total', 'Confirmed', 'Cancelled', 'Completed', 'No-Show', 'Show Rate'));
    data.bookingStats.forEach((stat: BookingStat) => {
      lines.push(createCSVRow(
        stat.location,
        stat.total,
        stat.confirmed,
        stat.cancelled,
        stat.completed,
        stat.no_show,
        `${stat.show_rate}%`
      ));
    });
    lines.push('');
  }

  // Booking Trend (NEW)
  if (config.includeBookingTrend && data.bookingTrend?.length) {
    lines.push('BOOKING TREND');
    lines.push(createCSVRow('Date', 'Confirmed', 'Completed', 'Cancelled', 'No-Show', 'Total'));
    data.bookingTrend.forEach((item) => {
      lines.push(createCSVRow(
        item.date,
        item.confirmed,
        item.completed,
        item.cancelled,
        item.noShow,
        item.total
      ));
    });
    lines.push('');
  }

  // Satisfaction Metrics
  if (config.includeSatisfaction && data.satisfactionStats) {
    lines.push('SATISFACTION METRICS');
    lines.push(createCSVRow('Metric', 'Value'));
    lines.push(createCSVRow('Average Rating', data.satisfactionStats.average_rating.toFixed(1)));
    lines.push(createCSVRow('Total Ratings', data.satisfactionStats.total_ratings));
    lines.push('');
    
    if (config.includeTables && data.satisfactionStats.distribution) {
      lines.push('RATING DISTRIBUTION');
      lines.push(createCSVRow('Rating', 'Count', 'Percentage'));
      data.satisfactionStats.distribution.forEach((d) => {
        lines.push(createCSVRow(`${d.rating} Stars`, d.count, `${d.percentage}%`));
      });
      lines.push('');
    }
  }

  // Customer Feedback (NEW)
  if (config.includeCustomerFeedback && data.recentFeedback?.length) {
    lines.push('CUSTOMER FEEDBACK');
    lines.push(createCSVRow('Date', 'Rating', 'Feedback', 'Trigger'));
    data.recentFeedback.forEach((item) => {
      lines.push(createCSVRow(
        format(new Date(item.createdAt), 'MMM d, yyyy'),
        `${item.rating} Stars`,
        item.feedback || '',
        item.triggerType
      ));
    });
    lines.push('');
  }

  // AI Performance Metrics
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    lines.push('ARI PERFORMANCE');
    lines.push(createCSVRow('Metric', 'Value'));
    lines.push(createCSVRow('Containment Rate', `${data.aiPerformanceStats.containment_rate}%`));
    lines.push(createCSVRow('Resolution Rate', `${data.aiPerformanceStats.resolution_rate}%`));
    lines.push(createCSVRow('Ari Handled', data.aiPerformanceStats.ai_handled));
    lines.push(createCSVRow('Human Takeover', data.aiPerformanceStats.human_takeover));
    lines.push(createCSVRow('Total Conversations', data.aiPerformanceStats.total_conversations));
    lines.push('');
  }

  // Traffic Sources
  if (config.includeTrafficSources && config.includeTables && data.trafficSources) {
    lines.push('TRAFFIC SOURCES');
    lines.push(createCSVRow('Source', 'Visitors', 'Percentage'));
    data.trafficSources.forEach((source: TrafficSourceStat) => {
      lines.push(createCSVRow(source.source, source.visitors, `${source.percentage}%`));
    });
    lines.push('');
  }

  // Traffic Source Trend (NEW)
  if (config.includeTrafficSourceTrend && data.trafficSourceTrend?.length) {
    lines.push('TRAFFIC SOURCE TREND');
    lines.push(createCSVRow('Date', 'Direct', 'Organic', 'Paid', 'Social', 'Email', 'Referral', 'Total'));
    data.trafficSourceTrend.forEach((item) => {
      lines.push(createCSVRow(
        item.date,
        item.direct,
        item.organic,
        item.paid,
        item.social,
        item.email,
        item.referral,
        item.total
      ));
    });
    lines.push('');
  }

  // Top Pages
  if (config.includeTopPages && config.includeTables && data.topPages) {
    lines.push('TOP PAGES');
    lines.push(createCSVRow('Page', 'Visits', 'Bounce Rate', 'Conversations'));
    data.topPages.forEach((page: TopPageStat) => {
      lines.push(createCSVRow(page.page, page.visits, `${page.bounce_rate}%`, page.conversations));
    });
    lines.push('');
  }

  // Page Engagement Metrics (NEW)
  if (config.includePageEngagement && data.pageEngagement) {
    lines.push('PAGE ENGAGEMENT METRICS');
    lines.push(createCSVRow('Metric', 'Value'));
    lines.push(createCSVRow('Bounce Rate', `${data.pageEngagement.bounceRate.toFixed(1)}%`));
    lines.push(createCSVRow('Avg Pages/Session', data.pageEngagement.avgPagesPerSession.toFixed(1)));
    lines.push(createCSVRow('Avg Session Duration', formatDuration(data.pageEngagement.avgSessionDuration)));
    lines.push(createCSVRow('Total Sessions', data.pageEngagement.totalSessions));
    lines.push(createCSVRow('Conversion Rate', `${data.pageEngagement.overallCVR.toFixed(1)}%`));
    lines.push('');
  }

  // Page Depth Distribution (NEW)
  if (config.includePageDepth && data.pageDepthDistribution?.length) {
    lines.push('PAGE DEPTH DISTRIBUTION');
    lines.push(createCSVRow('Pages Viewed', 'Sessions', 'Percentage'));
    data.pageDepthDistribution.forEach((item) => {
      lines.push(createCSVRow(item.depth, item.count, `${item.percentage.toFixed(1)}%`));
    });
    lines.push('');
  }

  // Visitor Locations
  if (config.includeVisitorLocations && config.includeTables && data.visitorLocations) {
    lines.push('VISITOR LOCATIONS');
    lines.push(createCSVRow('Country', 'Visitors', 'Percentage'));
    data.visitorLocations.forEach((loc: LocationStat) => {
      lines.push(createCSVRow(loc.country, loc.visitors, `${loc.percentage}%`));
    });
  }

  // Join lines with Windows line endings (CRLF) for universal compatibility
  const csvContent = lines.join('\r\n');
  
  // Create blob with UTF-8 BOM prefix for Excel/Numbers compatibility
  const blob = new Blob([UTF8_BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  return blob;
};

/** Helper to get Y position from autoTable */
const getTableEndY = (pdf: jsPDF): number => {
  const pdfWithAutoTable = pdf as jsPDF & { lastAutoTable?: { finalY: number } };
  return pdfWithAutoTable.lastAutoTable?.finalY || 20;
};

/** Helper to add page break if needed */
const checkPageBreak = (pdf: jsPDF, yPosition: number, threshold = 250): number => {
  if (yPosition > threshold) {
    pdf.addPage();
    return 20;
  }
  return yPosition;
};

/**
 * Generates a PDF report from analytics data and returns a Blob.
 */
export const generatePDFReport = async (
  data: ReportData,
  config: ReportConfig,
  startDate: Date,
  endDate: Date,
  orgName: string
): Promise<Blob> => {
  const pdf = new jsPDF();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.text(`${orgName} Analytics Report`, 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.text(`Period: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`, 20, yPosition);
  yPosition += 7;
  pdf.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 20, yPosition);
  yPosition += 15;

  // KPIs Section
  if (config.includeKPIs) {
    pdf.setFontSize(14);
    pdf.text('Key Performance Indicators', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value', 'Change']],
      body: [
        ['Total Conversations', `${data.totalConversations || 0}`, `${data.conversationsChange || 0}%`],
        ['Total Leads', `${data.totalLeads || 0}`, `${data.leadsChange || 0}%`],
        ['Conversion Rate', `${data.conversionRate || 0}%`, `${data.conversionChange || 0}%`],
        ['Total Messages', `${data.totalMessages || 0}`, `${data.messagesChange || 0}%`],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Conversations Table
  if (config.includeConversations && config.includeTables && data.conversationStats?.length) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Conversation Statistics', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Date', 'Total', 'Active', 'Closed']],
      body: data.conversationStats.slice(0, 20).map((stat: ConversationStat) => [
        stat.date,
        stat.total,
        stat.active,
        stat.closed,
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Agent Performance Table
  if (config.includeAgentPerformance && config.includeTables && data.agentPerformance?.length) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Agent Performance', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Agent', 'Conversations', 'Avg Response Time', 'Satisfaction']],
      body: data.agentPerformance.map((agent: AgentPerformance) => [
        agent.agent_name,
        agent.total_conversations,
        `${agent.avg_response_time}s`,
        agent.satisfaction_score?.toFixed(1) || '-',
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Booking Statistics Table
  if (config.includeBookings && config.includeTables && data.bookingStats?.length) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Booking Statistics', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Location', 'Total', 'Confirmed', 'Completed', 'No-Show', 'Show Rate']],
      body: data.bookingStats.map((stat: BookingStat) => [
        stat.location,
        stat.total,
        stat.confirmed,
        stat.completed,
        stat.no_show,
        `${stat.show_rate}%`,
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Satisfaction Metrics
  if (config.includeSatisfaction && data.satisfactionStats) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Satisfaction Metrics', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Average Rating', `${data.satisfactionStats.average_rating.toFixed(1)} / 5`],
        ['Total Ratings', `${data.satisfactionStats.total_ratings}`],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    yPosition = getTableEndY(pdf) + 10;

    if (config.includeTables && data.satisfactionStats.distribution?.length) {
      autoTable(pdf, {
        startY: yPosition,
        head: [['Rating', 'Count', 'Percentage']],
        body: data.satisfactionStats.distribution.map((d) => [
          `${d.rating} Stars`,
          d.count,
          `${d.percentage}%`,
        ]),
        theme: 'grid',
        styles: { fontSize: 9 },
      });

      yPosition = getTableEndY(pdf) + 15;
    }
  }

  // AI Performance Metrics
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Ari Performance', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Containment Rate', `${data.aiPerformanceStats.containment_rate}%`],
        ['Resolution Rate', `${data.aiPerformanceStats.resolution_rate}%`],
        ['AI Handled', `${data.aiPerformanceStats.ai_handled}`],
        ['Human Takeover', `${data.aiPerformanceStats.human_takeover}`],
        ['Total Conversations', `${data.aiPerformanceStats.total_conversations}`],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Traffic Sources Table
  if (config.includeTrafficSources && config.includeTables && data.trafficSources?.length) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Traffic Sources', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Source', 'Visitors', 'Percentage']],
      body: data.trafficSources.slice(0, 15).map((source: TrafficSourceStat) => [
        source.source,
        source.visitors,
        `${source.percentage}%`,
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Top Pages Table
  if (config.includeTopPages && config.includeTables && data.topPages?.length) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Top Pages', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Page', 'Visits', 'Bounce Rate', 'Conversations']],
      body: data.topPages.slice(0, 15).map((page: TopPageStat) => [
        page.page.length > 40 ? page.page.substring(0, 40) + '...' : page.page,
        page.visits,
        `${page.bounce_rate}%`,
        page.conversations,
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    yPosition = getTableEndY(pdf) + 15;
  }

  // Visitor Locations Table
  if (config.includeVisitorLocations && config.includeTables && data.visitorLocations?.length) {
    yPosition = checkPageBreak(pdf, yPosition);

    pdf.setFontSize(14);
    pdf.text('Visitor Locations', 20, yPosition);
    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [['Country', 'Visitors', 'Percentage']],
      body: data.visitorLocations.slice(0, 15).map((loc: LocationStat) => [
        loc.country,
        loc.visitors,
        `${loc.percentage}%`,
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });
  }

  // Return PDF as blob
  return pdf.output('blob');
};
