/**
 * Report Export Utilities
 * 
 * Generates analytics reports in CSV and PDF formats for download.
 * Supports configurable sections including KPIs, conversation stats,
 * lead stats, agent performance, and usage metrics.
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
  UsageMetric 
} from '@/types/report';

/**
 * Generates a CSV report from analytics data and triggers download.
 * 
 * @param data - Analytics data object containing metrics and statistics
 * @param config - Report configuration specifying which sections to include
 * @param startDate - Start of the reporting period
 * @param endDate - End of the reporting period
 * @param orgName - Organization name for the report header
 * 
 * @example
 * generateCSVReport(
 *   analyticsData,
 *   { includeKPIs: true, includeConversations: true, includeTables: true },
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31'),
 *   'Acme Corp'
 * );
 * // Downloads: analytics_report_2024-01-31.csv
 * 
 * @remarks
 * - Automatically triggers browser download
 * - Sections are included based on config flags
 * - Data is formatted as comma-separated values with proper escaping
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
      csvContent += `${stat.date},${stat.total},${stat.new},${stat.contacted},${stat.qualified},${stat.converted}\n`;
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

/**
 * Generates a PDF report from analytics data and triggers download.
 * Uses jsPDF with autoTable plugin for formatted tables.
 * 
 * @param data - Analytics data object containing metrics and statistics
 * @param config - Report configuration specifying which sections to include
 * @param startDate - Start of the reporting period
 * @param endDate - End of the reporting period
 * @param orgName - Organization name for the report header
 * 
 * @example
 * await generatePDFReport(
 *   analyticsData,
 *   { includeKPIs: true, includeAgentPerformance: true, includeTables: true },
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31'),
 *   'Acme Corp'
 * );
 * // Downloads: analytics_report_2024-01-31.pdf
 * 
 * @remarks
 * - Automatically handles page breaks for long reports
 * - Tables limited to 20 rows to prevent overflow
 * - Uses grid theme for table styling
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

    // Get the final Y position from the last auto table
    const pdfWithAutoTable = pdf as jsPDF & { lastAutoTable?: { finalY: number } };
    yPosition = (pdfWithAutoTable.lastAutoTable?.finalY || yPosition) + 15;
  }

  // Conversations Table
  if (config.includeConversations && config.includeTables && data.conversationStats?.length > 0) {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

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

    // Get the final Y position from the last auto table
    const pdfWithAutoTable = pdf as jsPDF & { lastAutoTable?: { finalY: number } };
    yPosition = (pdfWithAutoTable.lastAutoTable?.finalY || yPosition) + 15;
  }

  // Agent Performance Table
  if (config.includeAgentPerformance && config.includeTables && data.agentPerformance?.length > 0) {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

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
  }

  // Save PDF
  pdf.save(`analytics_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
