/**
 * Report Export Utilities
 * 
 * Generates analytics reports in CSV and PDF formats for download.
 * Supports configurable sections including KPIs, conversation stats,
 * lead stats, agent performance, usage metrics, bookings, satisfaction,
 * AI performance, traffic sources, top pages, and visitor locations.
 * 
 * @module lib/report-export
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ReportConfig } from '@/components/analytics/ReportBuilder';
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

/**
 * Generates a CSV report from analytics data and triggers download.
 */
export const generateCSVReport = (
  data: ReportData,
  config: ReportConfig,
  startDate: Date,
  endDate: Date,
  orgName: string
): void => {
  let csvContent = `${orgName} Analytics Report\n`;
  csvContent += `Period: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}\n`;
  csvContent += `Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}\n\n`;

  // KPIs Section
  if (config.includeKPIs) {
    csvContent += 'KEY PERFORMANCE INDICATORS\n';
    csvContent += 'Metric,Value,Change\n';
    csvContent += `Total Conversations,${data.totalConversations || 0},${data.conversationsChange || 0}%\n`;
    csvContent += `Total Leads,${data.totalLeads || 0},${data.leadsChange || 0}%\n`;
    csvContent += `Conversion Rate,${data.conversionRate || 0}%,${data.conversionChange || 0}%\n`;
    csvContent += `Total Messages,${data.totalMessages || 0},${data.messagesChange || 0}%\n\n`;
  }

  // Conversations Data
  if (config.includeConversations && config.includeTables && data.conversationStats) {
    csvContent += 'CONVERSATION STATISTICS\n';
    csvContent += 'Date,Total,Active,Closed\n';
    data.conversationStats.forEach((stat: ConversationStat) => {
      csvContent += `${stat.date},${stat.total},${stat.active},${stat.closed}\n`;
    });
    csvContent += '\n';
  }

  // Leads Data
  if (config.includeLeads && config.includeTables && data.leadStats) {
    csvContent += 'LEAD STATISTICS\n';
    csvContent += 'Date,Total,New,Contacted,Qualified,Converted\n';
    data.leadStats.forEach((stat: LeadStat) => {
      const newCount = (stat.new as number) || 0;
      const contacted = (stat.contacted as number) || 0;
      const qualified = (stat.qualified as number) || 0;
      const converted = (stat.converted as number) || (stat.won as number) || 0;
      csvContent += `${stat.date},${stat.total},${newCount},${contacted},${qualified},${converted}\n`;
    });
    csvContent += '\n';
  }

  // Agent Performance
  if (config.includeAgentPerformance && config.includeTables && data.agentPerformance) {
    csvContent += 'AGENT PERFORMANCE\n';
    csvContent += 'Agent,Conversations,Avg Response Time,Satisfaction Score\n';
    data.agentPerformance.forEach((agent: AgentPerformance) => {
      csvContent += `${agent.agent_name},${agent.total_conversations},${agent.avg_response_time},${agent.satisfaction_score}\n`;
    });
    csvContent += '\n';
  }

  // Usage Metrics
  if (config.includeUsageMetrics && config.includeTables && data.usageMetrics) {
    csvContent += 'USAGE METRICS\n';
    csvContent += 'Date,Conversations,Messages,API Calls\n';
    data.usageMetrics.forEach((metric: UsageMetric) => {
      csvContent += `${metric.date},${metric.conversations},${metric.messages},${metric.api_calls}\n`;
    });
    csvContent += '\n';
  }

  // Booking Statistics
  if (config.includeBookings && config.includeTables && data.bookingStats) {
    csvContent += 'BOOKING STATISTICS\n';
    csvContent += 'Location,Total,Confirmed,Cancelled,Completed,No-Show,Show Rate\n';
    data.bookingStats.forEach((stat: BookingStat) => {
      csvContent += `${stat.location},${stat.total},${stat.confirmed},${stat.cancelled},${stat.completed},${stat.no_show},${stat.show_rate}%\n`;
    });
    csvContent += '\n';
  }

  // Satisfaction Metrics
  if (config.includeSatisfaction && data.satisfactionStats) {
    csvContent += 'SATISFACTION METRICS\n';
    csvContent += `Average Rating,${data.satisfactionStats.average_rating.toFixed(1)}\n`;
    csvContent += `Total Ratings,${data.satisfactionStats.total_ratings}\n`;
    if (config.includeTables && data.satisfactionStats.distribution) {
      csvContent += '\nRating Distribution\n';
      csvContent += 'Rating,Count,Percentage\n';
      data.satisfactionStats.distribution.forEach((d) => {
        csvContent += `${d.rating} Stars,${d.count},${d.percentage}%\n`;
      });
    }
    csvContent += '\n';
  }

  // AI Performance Metrics
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    csvContent += 'AI PERFORMANCE\n';
    csvContent += `Containment Rate,${data.aiPerformanceStats.containment_rate}%\n`;
    csvContent += `Resolution Rate,${data.aiPerformanceStats.resolution_rate}%\n`;
    csvContent += `AI Handled,${data.aiPerformanceStats.ai_handled}\n`;
    csvContent += `Human Takeover,${data.aiPerformanceStats.human_takeover}\n`;
    csvContent += `Total Conversations,${data.aiPerformanceStats.total_conversations}\n\n`;
  }

  // Traffic Sources
  if (config.includeTrafficSources && config.includeTables && data.trafficSources) {
    csvContent += 'TRAFFIC SOURCES\n';
    csvContent += 'Source,Visitors,Percentage\n';
    data.trafficSources.forEach((source: TrafficSourceStat) => {
      csvContent += `${source.source},${source.visitors},${source.percentage}%\n`;
    });
    csvContent += '\n';
  }

  // Top Pages
  if (config.includeTopPages && config.includeTables && data.topPages) {
    csvContent += 'TOP PAGES\n';
    csvContent += 'Page,Visits,Bounce Rate,Conversations\n';
    data.topPages.forEach((page: TopPageStat) => {
      csvContent += `"${page.page}",${page.visits},${page.bounce_rate}%,${page.conversations}\n`;
    });
    csvContent += '\n';
  }

  // Visitor Locations
  if (config.includeVisitorLocations && config.includeTables && data.visitorLocations) {
    csvContent += 'VISITOR LOCATIONS\n';
    csvContent += 'Country,Visitors,Percentage\n';
    data.visitorLocations.forEach((loc: LocationStat) => {
      csvContent += `${loc.country},${loc.visitors},${loc.percentage}%\n`;
    });
  }

  // Create and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `analytics_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
 * Generates a PDF report from analytics data and triggers download.
 */
export const generatePDFReport = async (
  data: ReportData,
  config: ReportConfig,
  startDate: Date,
  endDate: Date,
  orgName: string
): Promise<void> => {
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
    pdf.text('AI Performance', 20, yPosition);
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

  // Save PDF
  pdf.save(`analytics_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
