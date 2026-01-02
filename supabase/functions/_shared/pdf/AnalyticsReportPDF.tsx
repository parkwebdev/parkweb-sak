/**
 * Analytics Report PDF Document for Edge Functions
 * 
 * Main PDF document component that assembles all sections.
 * Ported from src/lib/pdf-components/AnalyticsReportPDF.tsx
 * 
 * COMPLETE VISUAL PARITY with frontend builder output.
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

  // =========================================================================
  // CONVERSATIONS
  // =========================================================================
  
  if (config.includeConversations && data.conversationStats?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'conversations', title: 'Conversations', description: 'Breakdown of conversation volume showing total, active, and closed conversations over the selected period.' },
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

  // =========================================================================
  // CONVERSATION FUNNEL
  // =========================================================================
  
  if (config.includeConversationFunnel && data.conversationFunnel?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'funnel', title: 'Conversation Funnel', description: 'Visitor journey from initial engagement to lead conversion, showing drop-off at each stage.' },
        config.includeCharts && React.createElement(PDFHorizontalBarChart, {
          data: data.conversationFunnel.map(s => ({ label: s.name, value: s.count })),
          valueKey: 'value',
          color: CHART_COLORS.primary
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'name', header: 'Stage' },
            { key: 'count', header: 'Count', align: 'right' },
            { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
            { key: 'dropOffFormatted', header: 'Drop-off', align: 'right' },
          ],
          data: data.conversationFunnel.map(s => ({
            ...s,
            percentageFormatted: `${s.percentage.toFixed(1)}%`,
            dropOffFormatted: `${s.dropOffPercent.toFixed(1)}%`,
          }))
        })
      )
    );
  }

  // =========================================================================
  // PEAK ACTIVITY
  // =========================================================================
  
  if (config.includePeakActivity && data.peakActivity) {
    sections.push(
      React.createElement(PDFSection, { key: 'peak-activity', title: 'Peak Activity', description: 'Highest engagement periods showing when visitors are most active on your site.' },
        React.createElement(PDFTable, {
          columns: [
            { key: 'metric', header: 'Metric' },
            { key: 'value', header: 'Value', align: 'right' },
          ],
          data: [
            { metric: 'Peak Day', value: data.peakActivity.peakDay },
            { metric: 'Peak Time', value: data.peakActivity.peakTime },
            { metric: 'Peak Value', value: data.peakActivity.peakValue },
          ]
        })
      )
    );
  }

  // =========================================================================
  // LEAD ACTIVITY
  // =========================================================================
  
  if (config.includeLeads && data.leadStats?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'leads', title: 'Lead Activity', description: 'Lead generation trends showing how many new leads were captured over time.' },
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

  // =========================================================================
  // LEAD SOURCE BREAKDOWN
  // =========================================================================
  
  if (config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'lead-sources', title: 'Lead Source Breakdown', description: 'Distribution of leads by acquisition channel with conversion rates for each source.' },
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

  // =========================================================================
  // BOOKINGS
  // =========================================================================
  
  if (config.includeBookings && data.bookingStats?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'bookings', title: 'Bookings', description: 'Booking metrics by location showing confirmed, completed, and no-show appointments.' },
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

  // =========================================================================
  // BOOKING TREND
  // =========================================================================
  
  if (config.includeBookingTrend && data.bookingTrend?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'booking-trend', title: 'Booking Trend', description: 'Booking activity over time showing confirmation, completion, and cancellation patterns.' },
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

  // =========================================================================
  // CUSTOMER SATISFACTION
  // =========================================================================
  
  if (config.includeSatisfaction && data.satisfactionStats) {
    sections.push(
      React.createElement(PDFSection, { key: 'satisfaction', title: 'Customer Satisfaction', description: 'CSAT ratings distribution and average score from customer feedback surveys.' },
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

  // =========================================================================
  // RECENT FEEDBACK
  // =========================================================================
  
  if (config.includeCustomerFeedback && data.recentFeedback?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'feedback', title: 'Recent Feedback', description: 'Latest customer comments and ratings to identify trends in customer sentiment.' },
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

  // =========================================================================
  // AI PERFORMANCE
  // =========================================================================
  
  if (config.includeAIPerformance && data.aiPerformanceStats) {
    sections.push(
      React.createElement(PDFSection, { key: 'ai-performance', title: 'Ari Performance', description: 'AI assistant metrics showing containment rate, resolution rate, and human escalation frequency.' },
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

  // =========================================================================
  // AI PERFORMANCE TREND
  // =========================================================================
  
  if (config.includeAIPerformanceTrend && data.aiPerformanceTrend?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'ai-trend', title: 'AI Performance Trend', description: 'How Ari\'s containment and resolution rates have changed over time.' },
        config.includeCharts && React.createElement(PDFLineChart, {
          data: data.aiPerformanceTrend,
          series: [
            { key: 'containment_rate', color: CHART_COLORS.primary, label: 'Containment' },
            { key: 'resolution_rate', color: CHART_COLORS.success, label: 'Resolution' },
          ]
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'date', header: 'Date' },
            { key: 'containmentFormatted', header: 'Containment Rate', align: 'right' },
            { key: 'resolutionFormatted', header: 'Resolution Rate', align: 'right' },
          ],
          data: data.aiPerformanceTrend.slice(0, 20).map(t => ({
            ...t,
            containmentFormatted: `${t.containment_rate}%`,
            resolutionFormatted: `${t.resolution_rate}%`,
          }))
        })
      )
    );
  }

  // =========================================================================
  // TRAFFIC SOURCES
  // =========================================================================
  
  if (config.includeTrafficSources && data.trafficSources?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'traffic', title: 'Traffic Sources', description: 'Breakdown of website visitors by referral source showing where your traffic originates.' },
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

  // =========================================================================
  // TRAFFIC SOURCE TREND
  // =========================================================================
  
  if (config.includeTrafficSourceTrend && data.trafficSourceTrend?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'traffic-trend', title: 'Traffic Source Trend', description: 'How traffic from different sources has changed over the selected time period.' },
        React.createElement(PDFTrafficTrendChart, { data: data.trafficSourceTrend })
      )
    );
  }

  // =========================================================================
  // TOP PAGES
  // =========================================================================
  
  if (config.includeTopPages && data.topPages?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'top-pages', title: 'Top Pages', description: 'Most visited pages on your site with bounce rates and conversion metrics.' },
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

  // =========================================================================
  // PAGE ENGAGEMENT
  // =========================================================================
  
  if (config.includePageEngagement && data.pageEngagement) {
    sections.push(
      React.createElement(PDFSection, { key: 'page-engagement', title: 'Page Engagement', description: 'Overall site engagement metrics including bounce rate and average pages per session.' },
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

  // =========================================================================
  // PAGE DEPTH DISTRIBUTION
  // =========================================================================
  
  if (config.includePageDepth && data.pageDepthDistribution?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'page-depth', title: 'Page Depth Distribution', description: 'How many pages visitors view per session, indicating engagement depth.' },
        config.includeCharts && React.createElement(PDFBarChart, {
          data: data.pageDepthDistribution.map(d => ({ label: d.depth, value: d.count })),
          valueKey: 'value',
          color: CHART_COLORS.purple
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'depth', header: 'Depth' },
            { key: 'count', header: 'Count', align: 'right' },
            { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
          ],
          data: data.pageDepthDistribution.map(d => ({
            ...d,
            percentageFormatted: `${d.percentage.toFixed(1)}%`,
          }))
        })
      )
    );
  }

  // =========================================================================
  // VISITOR LOCATIONS
  // =========================================================================
  
  if (config.includeVisitorLocations && data.visitorLocations?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'locations', title: 'Visitor Locations', description: 'Geographic distribution of website visitors by country.' },
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

  // =========================================================================
  // VISITOR CITIES
  // =========================================================================
  
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

  // =========================================================================
  // LEAD CONVERSION TREND
  // =========================================================================
  
  if (config.includeLeadConversionTrend && data.leadConversionTrend?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'lead-trend', title: 'Lead Conversion Trend', description: 'Lead status progression over time showing how leads move through your pipeline.' },
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'date', header: 'Date' },
            { key: 'total', header: 'Total', align: 'right' },
            { key: 'new', header: 'New', align: 'right' },
            { key: 'contacted', header: 'Contacted', align: 'right' },
            { key: 'qualified', header: 'Qualified', align: 'right' },
            { key: 'won', header: 'Won', align: 'right' },
            { key: 'lost', header: 'Lost', align: 'right' },
          ],
          data: data.leadConversionTrend.slice(0, 20)
        })
      )
    );
  }

  // =========================================================================
  // CSAT DISTRIBUTION
  // =========================================================================
  
  if (config.includeCSATDistribution && data.csatDistribution?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'csat-dist', title: 'CSAT Rating Distribution', description: 'Breakdown of customer satisfaction scores by rating level.' },
        config.includeCharts && React.createElement(PDFBarChart, {
          data: data.csatDistribution.map(d => ({ label: `${d.rating} Star`, value: d.count })),
          valueKey: 'value',
          color: CHART_COLORS.warning
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'ratingFormatted', header: 'Rating' },
            { key: 'count', header: 'Count', align: 'right' },
            { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
          ],
          data: data.csatDistribution.map(d => ({
            ...d,
            ratingFormatted: `${d.rating} ★`,
            percentageFormatted: `${d.percentage}%`,
          }))
        })
      )
    );
  }

  // =========================================================================
  // USAGE METRICS
  // =========================================================================
  
  if (config.includeUsageMetrics && data.usageMetrics?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'usage', title: 'Usage Metrics', description: 'Platform usage statistics including conversations, messages, and API activity.' },
        config.includeCharts && React.createElement(PDFLineChart, {
          data: data.usageMetrics,
          series: [
            { key: 'conversations', color: CHART_COLORS.primary, label: 'Conversations' },
            { key: 'messages', color: CHART_COLORS.success, label: 'Messages' },
            { key: 'api_calls', color: CHART_COLORS.secondary, label: 'API Calls' },
          ]
        }),
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'date', header: 'Date' },
            { key: 'conversations', header: 'Conversations', align: 'right' },
            { key: 'messages', header: 'Messages', align: 'right' },
            { key: 'api_calls', header: 'API Calls', align: 'right' },
          ],
          data: data.usageMetrics.slice(0, 20)
        })
      )
    );
  }

  // =========================================================================
  // AGENT PERFORMANCE
  // =========================================================================
  
  if (config.includeAgentPerformance && data.agentPerformance?.length) {
    sections.push(
      React.createElement(PDFSection, { key: 'agent-perf', title: 'Agent Performance', description: 'Ari\'s performance metrics including handled conversations and resolution capabilities.' },
        config.includeTables && React.createElement(PDFTable, {
          columns: [
            { key: 'agent_name', header: 'Agent' },
            { key: 'total_conversations', header: 'Conversations', align: 'right' },
            { key: 'avgResponseFormatted', header: 'Avg Response (s)', align: 'right' },
            { key: 'satisfactionFormatted', header: 'CSAT', align: 'right' },
          ],
          data: data.agentPerformance.map(a => ({
            ...a,
            avgResponseFormatted: a.avg_response_time.toFixed(1),
            satisfactionFormatted: a.satisfaction_score.toFixed(1),
          }))
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
