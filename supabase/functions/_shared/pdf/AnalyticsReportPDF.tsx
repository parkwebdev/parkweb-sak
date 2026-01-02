/**
 * Analytics Report PDF Document for Edge Functions
 * 
 * Main PDF document component that assembles all sections.
 * Ported from src/lib/pdf-components/AnalyticsReportPDF.tsx
 */

// @ts-ignore
import React from 'npm:react@18.3.1';
// @ts-ignore
import { Document, Page, View } from 'npm:@react-pdf/renderer@4.3.0';
// @ts-ignore
import { format } from 'npm:date-fns@3.6.0';

import { styles } from './styles.ts';
import { PDFHeader } from './PDFHeader.tsx';
import { PDFFooter } from './PDFFooter.tsx';
import { PDFTable } from './PDFTable.tsx';
import { PDFSection } from './PDFSection.tsx';
import { PDFExecutiveSummary } from './PDFExecutiveSummary.tsx';
import { PDFLineChart, PDFBarChart, PDFHorizontalBarChart, PDFPieChart, PDFBookingTrendChart, PDFTrafficTrendChart, CHART_COLORS } from './charts.tsx';
import { registerFonts } from './fonts.ts';
import { getTriggerLabel } from './pdf-utils.ts';
import type { PDFData, PDFConfig, ReportType } from './types.ts';

// Register fonts on import
registerFonts();

interface AnalyticsReportPDFProps {
  data: PDFData;
  config: PDFConfig;
  startDate: Date;
  endDate: Date;
  orgName: string;
}

export function AnalyticsReportPDF({ 
  data, 
  config, 
  startDate, 
  endDate, 
  orgName,
}: AnalyticsReportPDFProps) {
  
  const sections: React.ReactNode[] = [];

  // Executive Summary (always included)
  sections.push(React.createElement(PDFExecutiveSummary, { key: 'exec-summary', data }));

  // Conversations
  if (config.includeConversations && data.conversationStats?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'conversations', title: 'Conversations', description: 'Breakdown of conversation volume over the selected period.' },
        config.includeCharts && React.createElement(PDFLineChart, {
          data: data.conversationStats,
          series: [
            { key: 'total', color: CHART_COLORS.primary, label: 'Total' },
            { key: 'active', color: CHART_COLORS.success, label: 'Active' },
            { key: 'closed', color: CHART_COLORS.secondary, label: 'Closed' },
          ]
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'date', header: 'Date' },
            { key: 'total', header: 'Total', align: 'right' },
            { key: 'active', header: 'Active', align: 'right' },
            { key: 'closed', header: 'Closed', align: 'right' },
          ],
          data: data.conversationStats
        })
      )
    );
  }

  // Lead Activity
  if (config.includeLeads && data.leadStats?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'leads', title: 'Lead Activity', description: 'Lead generation trends over time.' },
        config.includeCharts && React.createElement(PDFLineChart, {
          data: data.leadStats,
          series: [{ key: 'total', color: CHART_COLORS.primary, label: 'Total Leads' }]
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'date', header: 'Date' },
            { key: 'total', header: 'Total Leads', align: 'right' },
          ],
          data: data.leadStats
        })
      )
    );
  }

  // Lead Source Breakdown
  if (config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'lead-sources', title: 'Lead Source Breakdown', description: 'Distribution of leads by acquisition channel.' },
        config.includeCharts && React.createElement(PDFPieChart, {
          data: data.leadSourceBreakdown.map(s => ({ label: s.source, value: s.leads })),
          width: 240,
          height: 140,
          donut: true
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'source', header: 'Source' },
            { key: 'leads', header: 'Leads', align: 'right' },
            { key: 'sessions', header: 'Sessions', align: 'right' },
            { key: 'cvrFormatted', header: 'CVR', align: 'right' },
          ],
          data: data.leadSourceBreakdown.map(s => ({ ...s, cvrFormatted: `${s.cvr.toFixed(1)}%` }))
        })
      )
    );
  }

  // Bookings
  if (config.includeBookings && data.bookingStats?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'bookings', title: 'Bookings', description: 'Booking metrics by location.' },
        config.includeCharts && React.createElement(PDFBarChart, {
          data: data.bookingStats.map(s => ({ label: s.location, value: s.total })),
          valueKey: 'value',
          color: CHART_COLORS.primary
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'location', header: 'Location' },
            { key: 'total', header: 'Total', align: 'right' },
            { key: 'confirmed', header: 'Confirmed', align: 'right' },
            { key: 'completed', header: 'Completed', align: 'right' },
            { key: 'no_show', header: 'No-Show', align: 'right' },
            { key: 'showRateFormatted', header: 'Show Rate', align: 'right' },
          ],
          data: data.bookingStats.map(s => ({ ...s, showRateFormatted: `${s.show_rate}%` }))
        })
      )
    );
  }

  // Booking Trend
  if (config.includeBookingTrend && data.bookingTrend?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'booking-trend', title: 'Booking Trend', description: 'Booking activity over time.' },
        config.includeCharts && React.createElement(PDFBookingTrendChart, { data: data.bookingTrend }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'date', header: 'Date' },
            { key: 'confirmed', header: 'Confirmed', align: 'right' },
            { key: 'completed', header: 'Completed', align: 'right' },
            { key: 'cancelled', header: 'Cancelled', align: 'right' },
            { key: 'noShow', header: 'No-Show', align: 'right' },
          ],
          data: data.bookingTrend
        })
      )
    );
  }

  // Customer Satisfaction
  if (config.includeSatisfaction && data.satisfactionStats) {
    sections.push(
      React.createElement(PDFSection, { key: 'satisfaction', title: 'Customer Satisfaction', description: 'CSAT ratings distribution.' },
        config.includeCharts && data.satisfactionStats.distribution?.length && React.createElement(PDFPieChart, {
          data: data.satisfactionStats.distribution.map(d => ({ label: `${d.rating} Star`, value: d.count })),
          width: 200,
          height: 120
        }),
        React.createElement(PDFTable, {
          columns: [
            { key: 'metric', header: 'Metric' },
            { key: 'value', header: 'Value', align: 'right' },
          ],
          data: [
            { metric: 'Average Rating', value: `${data.satisfactionStats.average_rating.toFixed(1)} / 5` },
            { metric: 'Total Ratings', value: data.satisfactionStats.total_ratings.toLocaleString() },
          ]
        })
      )
    );
  }

  // Recent Feedback
  if (config.includeCustomerFeedback && data.recentFeedback?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'feedback', title: 'Recent Feedback', description: 'Latest customer comments and ratings.' },
        React.createElement(PDFTable, {
          columns: [
            { key: 'dateFormatted', header: 'Date' },
            { key: 'ratingFormatted', header: 'Rating' },
            { key: 'feedbackTruncated', header: 'Feedback', width: '45%' },
            { key: 'triggerFormatted', header: 'Trigger' },
          ],
          data: data.recentFeedback.slice(0, 10).map(f => ({
            ...f,
            dateFormatted: format(new Date(f.createdAt), 'MMM d, yyyy'),
            ratingFormatted: `${f.rating} ★`,
            feedbackTruncated: (f.feedback || '-').substring(0, 40) + ((f.feedback?.length || 0) > 40 ? '...' : ''),
            triggerFormatted: getTriggerLabel(f.triggerType),
          }))
        })
      )
    );
  }

  // AI Performance
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    sections.push(
      React.createElement(PDFSection, { key: 'ai-performance', title: 'Ari Performance', description: 'AI assistant metrics.' },
        React.createElement(PDFTable, {
          columns: [
            { key: 'metric', header: 'Metric' },
            { key: 'value', header: 'Value', align: 'right' },
          ],
          data: [
            { metric: 'Containment Rate', value: `${data.aiPerformanceStats.containment_rate}%` },
            { metric: 'Resolution Rate', value: `${data.aiPerformanceStats.resolution_rate}%` },
            { metric: 'AI Handled', value: data.aiPerformanceStats.ai_handled.toLocaleString() },
            { metric: 'Human Takeover', value: data.aiPerformanceStats.human_takeover.toLocaleString() },
            { metric: 'Total Conversations', value: data.aiPerformanceStats.total_conversations.toLocaleString() },
          ]
        })
      )
    );
  }

  // Traffic Sources
  if (config.includeTrafficSources && data.trafficSources?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'traffic', title: 'Traffic Sources', description: 'Breakdown of website visitors by referral source.' },
        config.includeCharts && React.createElement(PDFPieChart, {
          data: data.trafficSources.slice(0, 8).map(s => ({ label: s.source, value: s.visitors })),
          width: 240,
          height: 160,
          donut: true
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'source', header: 'Source' },
            { key: 'visitors', header: 'Visitors', align: 'right' },
            { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
          ],
          data: data.trafficSources.slice(0, 10).map(s => ({ ...s, percentageFormatted: `${s.percentage}%` }))
        })
      )
    );
  }

  // Traffic Source Trend
  if (config.includeTrafficSourceTrend && data.trafficSourceTrend?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'traffic-trend', title: 'Traffic Source Trend', description: 'How traffic from different sources has changed.' },
        React.createElement(PDFTrafficTrendChart, { data: data.trafficSourceTrend })
      )
    );
  }

  // Top Pages
  if (config.includeTopPages && data.topPages?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'top-pages', title: 'Top Pages', description: 'Most visited pages on your site.' },
        config.includeCharts && React.createElement(PDFHorizontalBarChart, {
          data: data.topPages.slice(0, 8).map(p => ({ label: p.page.length > 30 ? p.page.slice(0, 28) + '…' : p.page, value: p.visits })),
          valueKey: 'value',
          color: CHART_COLORS.teal
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'pageTruncated', header: 'Page', width: '50%' },
            { key: 'visits', header: 'Visits', align: 'right' },
            { key: 'bounceFormatted', header: 'Bounce Rate', align: 'right' },
            { key: 'conversations', header: 'Conversions', align: 'right' },
          ],
          data: data.topPages.slice(0, 10).map(p => ({
            ...p,
            pageTruncated: p.page.length > 35 ? p.page.substring(0, 35) + '...' : p.page,
            bounceFormatted: `${p.bounce_rate}%`,
          }))
        })
      )
    );
  }

  // Page Engagement
  if (config.includePageEngagement && data.pageEngagement) {
    sections.push(
      React.createElement(PDFSection, { key: 'page-engagement', title: 'Page Engagement', description: 'Overall site engagement metrics.' },
        React.createElement(PDFTable, {
          columns: [
            { key: 'metric', header: 'Metric' },
            { key: 'value', header: 'Value', align: 'right' },
          ],
          data: [
            { metric: 'Bounce Rate', value: `${data.pageEngagement.bounceRate.toFixed(1)}%` },
            { metric: 'Avg Pages/Session', value: data.pageEngagement.avgPagesPerSession.toFixed(1) },
            { metric: 'Total Sessions', value: data.pageEngagement.totalSessions.toLocaleString() },
            { metric: 'Conversion Rate', value: `${data.pageEngagement.overallCVR.toFixed(1)}%` },
          ]
        })
      )
    );
  }

  // Visitor Locations
  if (config.includeVisitorLocations && data.visitorLocations?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'locations', title: 'Visitor Locations', description: 'Geographic distribution of website visitors.' },
        config.includeCharts && React.createElement(PDFHorizontalBarChart, {
          data: data.visitorLocations.slice(0, 10).map(l => ({ label: l.country, value: l.visitors })),
          valueKey: 'value',
          color: CHART_COLORS.indigo
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'country', header: 'Country' },
            { key: 'visitors', header: 'Visitors', align: 'right' },
            { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
          ],
          data: data.visitorLocations.slice(0, 15).map(l => ({ ...l, percentageFormatted: `${l.percentage}%` }))
        })
      )
    );
  }

  // Visitor Cities
  if (config.includeVisitorCities && data.visitorCities?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'cities', title: 'Top Cities', description: 'Most common cities your visitors are located in.' },
        React.createElement(PDFTable, {
          columns: [
            { key: 'city', header: 'City' },
            { key: 'country', header: 'Country' },
            { key: 'visitors', header: 'Visitors', align: 'right' },
          ],
          data: data.visitorCities.slice(0, 15)
        })
      )
    );
  }

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page, wrap: true },
      React.createElement(PDFHeader, { orgName, startDate, endDate, reportType: config.type }),
      React.createElement(View, { style: styles.content, wrap: true }, ...sections),
      React.createElement(PDFFooter)
    )
  );
}
