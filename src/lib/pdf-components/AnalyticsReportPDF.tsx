/**
 * Analytics Report PDF Document
 * 
 * Main PDF document component that assembles all sections.
 * Uses PDF-native chart components for reliable vector rendering.
 */

import { Document, Page, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { styles } from './styles';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFTable } from './PDFTable';
import { PDFSection } from './PDFSection';
import { PDFExecutiveSummary } from './PDFExecutiveSummary';
import { 
  PDFLineChart, 
  PDFBarChart, 
  PDFHorizontalBarChart,
  PDFPieChart,
  PDFBookingTrendChart,
  PDFTrafficTrendChart,
  CHART_COLORS,
} from './charts';
import type { PDFData, PDFConfig, ReportType } from '@/types/pdf';
import { getTriggerLabel } from '@/lib/formatting-utils';

// Import fonts (registers on import)
import './fonts';

// Re-export types for backward compatibility
export type { PDFData, PDFConfig, ReportType } from '@/types/pdf';

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
  // Note: React rendering errors cannot be caught with try-catch.
  // Error boundaries don't work in @react-pdf/renderer.
  // Each chart component handles empty/invalid data with empty state placeholders.

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PDFHeader 
          orgName={orgName} 
          startDate={startDate} 
          endDate={endDate}
          reportType={config.type}
        />
        
        <View style={styles.content} wrap>
          {/* Executive Summary */}
          <PDFExecutiveSummary data={data} />

          {/* Conversations */}
          {config.includeConversations && data.conversationStats?.length && (
            <PDFSection 
              title="Conversations"
              description="Breakdown of conversation volume showing total, active, and closed conversations over the selected period."
            >
              {config.includeCharts && (
                <PDFLineChart
                  data={data.conversationStats}
                  series={[
                    { key: 'total', color: CHART_COLORS.primary, label: 'Total' },
                    { key: 'active', color: CHART_COLORS.success, label: 'Active' },
                    { key: 'closed', color: CHART_COLORS.secondary, label: 'Closed' },
                  ]}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'date', header: 'Date' },
                    { key: 'total', header: 'Total', align: 'right' },
                    { key: 'active', header: 'Active', align: 'right' },
                    { key: 'closed', header: 'Closed', align: 'right' },
                  ]}
                  data={data.conversationStats}
                />
              )}
            </PDFSection>
          )}

          {/* Conversation Funnel */}
          {config.includeConversationFunnel && data.conversationFunnel?.length && (
            <PDFSection 
              title="Conversation Funnel"
              description="Visitor journey from initial engagement to lead conversion, showing drop-off at each stage."
            >
              {config.includeCharts && (
                <PDFHorizontalBarChart
                  data={data.conversationFunnel.map(s => ({ label: s.name, value: s.count }))}
                  valueKey="value"
                  color={CHART_COLORS.primary}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'name', header: 'Stage' },
                    { key: 'count', header: 'Count', align: 'right' },
                    { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
                    { key: 'dropOffFormatted', header: 'Drop-off', align: 'right' },
                  ]}
                  data={data.conversationFunnel.map(s => ({
                    ...s,
                    percentageFormatted: `${s.percentage.toFixed(1)}%`,
                    dropOffFormatted: `${s.dropOffPercent.toFixed(1)}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Peak Activity */}
          {config.includePeakActivity && data.peakActivity && (
            <PDFSection 
              title="Peak Activity"
              description="Highest engagement periods showing when visitors are most active on your site."
            >
              <PDFTable
                columns={[
                  { key: 'metric', header: 'Metric' },
                  { key: 'value', header: 'Value', align: 'right' },
                ]}
                data={[
                  { metric: 'Peak Day', value: data.peakActivity.peakDay },
                  { metric: 'Peak Time', value: data.peakActivity.peakTime },
                  { metric: 'Peak Value', value: data.peakActivity.peakValue },
                ]}
              />
            </PDFSection>
          )}

          {/* Lead Activity */}
          {config.includeLeads && data.leadStats?.length && (
            <PDFSection 
              title="Lead Activity"
              description="Lead generation trends showing how many new leads were captured over time."
            >
              {config.includeCharts && (
                <PDFLineChart
                  data={data.leadStats}
                  series={[
                    { key: 'total', color: CHART_COLORS.primary, label: 'Total Leads' },
                  ]}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'date', header: 'Date' },
                    { key: 'total', header: 'Total Leads', align: 'right' },
                  ]}
                  data={data.leadStats}
                />
              )}
            </PDFSection>
          )}

          {/* Lead Source Breakdown */}
          {config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length && (
            <PDFSection 
              title="Lead Source Breakdown"
              description="Distribution of leads by acquisition channel with conversion rates for each source."
            >
              {config.includeCharts && (
                <PDFPieChart
                  data={data.leadSourceBreakdown.map(s => ({ label: s.source, value: s.leads }))}
                  width={240}
                  height={140}
                  donut
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'source', header: 'Source' },
                    { key: 'leads', header: 'Leads', align: 'right' },
                    { key: 'sessions', header: 'Sessions', align: 'right' },
                    { key: 'cvrFormatted', header: 'CVR', align: 'right' },
                  ]}
                  data={data.leadSourceBreakdown.map(s => ({
                    ...s,
                    cvrFormatted: `${s.cvr.toFixed(1)}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Bookings */}
          {config.includeBookings && data.bookingStats?.length && (
            <PDFSection 
              title="Bookings"
              description="Booking metrics by location showing confirmed, completed, and no-show appointments."
            >
              {config.includeCharts && (
                <PDFBarChart
                  data={data.bookingStats.map(s => ({ label: s.location, value: s.total }))}
                  valueKey="value"
                  color={CHART_COLORS.primary}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'location', header: 'Location' },
                    { key: 'total', header: 'Total', align: 'right' },
                    { key: 'confirmed', header: 'Confirmed', align: 'right' },
                    { key: 'completed', header: 'Completed', align: 'right' },
                    { key: 'no_show', header: 'No-Show', align: 'right' },
                    { key: 'showRateFormatted', header: 'Show Rate', align: 'right' },
                  ]}
                  data={data.bookingStats.map(s => ({
                    ...s,
                    showRateFormatted: `${s.show_rate}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Booking Trend */}
          {config.includeBookingTrend && data.bookingTrend?.length && (
            <PDFSection 
              title="Booking Trend"
              description="Booking activity over time showing confirmation, completion, and cancellation patterns."
            >
              {config.includeCharts && (
                <PDFBookingTrendChart data={data.bookingTrend} />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'date', header: 'Date' },
                    { key: 'confirmed', header: 'Confirmed', align: 'right' },
                    { key: 'completed', header: 'Completed', align: 'right' },
                    { key: 'cancelled', header: 'Cancelled', align: 'right' },
                    { key: 'noShow', header: 'No-Show', align: 'right' },
                  ]}
                  data={data.bookingTrend}
                />
              )}
            </PDFSection>
          )}

          {/* Customer Satisfaction */}
          {config.includeSatisfaction && data.satisfactionStats && (
            <PDFSection 
              title="Customer Satisfaction"
              description="CSAT ratings distribution and average score from customer feedback surveys."
            >
              {config.includeCharts && data.satisfactionStats.distribution?.length && (
                <PDFPieChart
                  data={data.satisfactionStats.distribution.map(d => ({
                    label: `${d.rating} Star`,
                    value: d.count,
                  }))}
                  width={200}
                  height={120}
                />
              )}
              <PDFTable
                columns={[
                  { key: 'metric', header: 'Metric' },
                  { key: 'value', header: 'Value', align: 'right' },
                ]}
                data={[
                  { metric: 'Average Rating', value: `${data.satisfactionStats.average_rating.toFixed(1)} / 5` },
                  { metric: 'Total Ratings', value: data.satisfactionStats.total_ratings.toLocaleString() },
                ]}
              />
            </PDFSection>
          )}

          {/* Recent Feedback */}
          {config.includeCustomerFeedback && data.recentFeedback?.length && (
            <PDFSection 
              title="Recent Feedback"
              description="Latest customer comments and ratings to identify trends in customer sentiment."
            >
              <PDFTable
                columns={[
                  { key: 'dateFormatted', header: 'Date' },
                  { key: 'ratingFormatted', header: 'Rating' },
                  { key: 'feedbackTruncated', header: 'Feedback', width: '45%' },
                  { key: 'triggerFormatted', header: 'Trigger' },
                ]}
                data={data.recentFeedback.slice(0, 10).map(f => ({
                  ...f,
                  dateFormatted: format(new Date(f.createdAt), 'MMM d, yyyy'),
                  ratingFormatted: `${f.rating} ★`,
                  feedbackTruncated: (f.feedback || '-').substring(0, 40) + ((f.feedback?.length || 0) > 40 ? '...' : ''),
                  triggerFormatted: getTriggerLabel(f.triggerType),
                }))}
              />
            </PDFSection>
          )}

          {/* AI Performance */}
          {config.includeAIPerformance && data.aiPerformanceStats && (
            <PDFSection 
              title="Ari Performance"
              description="AI assistant metrics showing containment rate, resolution rate, and human escalation frequency."
            >
              <PDFTable
                columns={[
                  { key: 'metric', header: 'Metric' },
                  { key: 'value', header: 'Value', align: 'right' },
                ]}
                data={[
                  { metric: 'Containment Rate', value: `${data.aiPerformanceStats.containment_rate}%` },
                  { metric: 'Resolution Rate', value: `${data.aiPerformanceStats.resolution_rate}%` },
                  { metric: 'AI Handled', value: data.aiPerformanceStats.ai_handled.toLocaleString() },
                  { metric: 'Human Takeover', value: data.aiPerformanceStats.human_takeover.toLocaleString() },
                  { metric: 'Total Conversations', value: data.aiPerformanceStats.total_conversations.toLocaleString() },
                ]}
              />
            </PDFSection>
          )}

          {/* Traffic Sources */}
          {config.includeTrafficSources && data.trafficSources?.length && (
            <PDFSection 
              title="Traffic Sources"
              description="Breakdown of website visitors by referral source showing where your traffic originates."
            >
              {config.includeCharts && (
                <PDFPieChart
                  data={data.trafficSources.slice(0, 8).map(s => ({ label: s.source, value: s.visitors }))}
                  width={240}
                  height={160}
                  donut
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'source', header: 'Source' },
                    { key: 'visitors', header: 'Visitors', align: 'right' },
                    { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
                  ]}
                  data={data.trafficSources.slice(0, 10).map(s => ({
                    ...s,
                    percentageFormatted: `${s.percentage}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Traffic Source Trend */}
          {config.includeTrafficSourceTrend && data.trafficSourceTrend?.length && (
            <PDFSection 
              title="Traffic Source Trend"
              description="How traffic from different sources has changed over the selected time period."
            >
              <PDFTrafficTrendChart data={data.trafficSourceTrend} />
            </PDFSection>
          )}

          {/* Top Pages */}
          {config.includeTopPages && data.topPages?.length && (
            <PDFSection 
              title="Top Pages"
              description="Most visited pages on your site with bounce rates and conversion metrics."
            >
              {config.includeCharts && (
                <PDFHorizontalBarChart
                  data={data.topPages.slice(0, 8).map(p => ({ 
                    label: p.page.length > 30 ? p.page.slice(0, 28) + '…' : p.page, 
                    value: p.visits 
                  }))}
                  valueKey="value"
                  color={CHART_COLORS.teal}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'pageTruncated', header: 'Page', width: '50%' },
                    { key: 'visits', header: 'Visits', align: 'right' },
                    { key: 'bounceFormatted', header: 'Bounce Rate', align: 'right' },
                    { key: 'conversations', header: 'Conversions', align: 'right' },
                  ]}
                  data={data.topPages.slice(0, 10).map(p => ({
                    ...p,
                    pageTruncated: p.page.length > 35 ? p.page.substring(0, 35) + '...' : p.page,
                    bounceFormatted: `${p.bounce_rate}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Page Engagement */}
          {config.includePageEngagement && data.pageEngagement && (
            <PDFSection 
              title="Page Engagement"
              description="Overall site engagement metrics including bounce rate and average pages per session."
            >
              <PDFTable
                columns={[
                  { key: 'metric', header: 'Metric' },
                  { key: 'value', header: 'Value', align: 'right' },
                ]}
                data={[
                  { metric: 'Bounce Rate', value: `${data.pageEngagement.bounceRate.toFixed(1)}%` },
                  { metric: 'Avg Pages/Session', value: data.pageEngagement.avgPagesPerSession.toFixed(1) },
                  { metric: 'Total Sessions', value: data.pageEngagement.totalSessions.toLocaleString() },
                  { metric: 'Conversion Rate', value: `${data.pageEngagement.overallCVR.toFixed(1)}%` },
                ]}
              />
            </PDFSection>
          )}

          {/* Page Depth */}
          {config.includePageDepth && data.pageDepthDistribution?.length && (
            <PDFSection 
              title="Page Depth Distribution"
              description="How many pages visitors view per session, indicating engagement depth."
            >
              {config.includeCharts && (
                <PDFBarChart
                  data={data.pageDepthDistribution.map(d => ({ label: d.depth, value: d.count }))}
                  valueKey="value"
                  color={CHART_COLORS.purple}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'depth', header: 'Depth' },
                    { key: 'count', header: 'Count', align: 'right' },
                    { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
                  ]}
                  data={data.pageDepthDistribution.map(d => ({
                    ...d,
                    percentageFormatted: `${d.percentage.toFixed(1)}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Visitor Locations */}
          {config.includeVisitorLocations && data.visitorLocations?.length && (
            <PDFSection 
              title="Visitor Locations"
              description="Geographic distribution of website visitors by country."
            >
              {config.includeCharts && (
                <PDFHorizontalBarChart
                  data={data.visitorLocations.slice(0, 10).map(l => ({ label: l.country, value: l.visitors }))}
                  valueKey="value"
                  color={CHART_COLORS.indigo}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'country', header: 'Country' },
                    { key: 'visitors', header: 'Visitors', align: 'right' },
                    { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
                  ]}
                  data={data.visitorLocations.slice(0, 15).map(l => ({
                    ...l,
                    percentageFormatted: `${l.percentage}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Visitor Cities */}
          {config.includeVisitorCities && data.visitorCities?.length && (
            <PDFSection 
              title="Top Cities"
              description="Most common cities your visitors are located in."
            >
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'city', header: 'City' },
                    { key: 'country', header: 'Country' },
                    { key: 'visitors', header: 'Visitors', align: 'right' },
                  ]}
                  data={data.visitorCities.slice(0, 15)}
                />
              )}
            </PDFSection>
          )}

          {/* Lead Conversion Trend */}
          {config.includeLeadConversionTrend && data.leadConversionTrend?.length && (
            <PDFSection 
              title="Lead Conversion Trend"
              description="Lead status progression over time showing how leads move through your pipeline."
            >
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'date', header: 'Date' },
                    { key: 'total', header: 'Total', align: 'right' },
                    { key: 'new', header: 'New', align: 'right' },
                    { key: 'contacted', header: 'Contacted', align: 'right' },
                    { key: 'qualified', header: 'Qualified', align: 'right' },
                    { key: 'won', header: 'Won', align: 'right' },
                    { key: 'lost', header: 'Lost', align: 'right' },
                  ]}
                  data={data.leadConversionTrend.slice(0, 20)}
                />
              )}
            </PDFSection>
          )}

          {/* CSAT Distribution */}
          {config.includeCSATDistribution && data.csatDistribution?.length && (
            <PDFSection 
              title="CSAT Rating Distribution"
              description="Breakdown of customer satisfaction scores by rating level."
            >
              {config.includeCharts && (
                <PDFBarChart
                  data={data.csatDistribution.map(d => ({ label: `${d.rating} Star`, value: d.count }))}
                  valueKey="value"
                  color={CHART_COLORS.warning}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'ratingFormatted', header: 'Rating' },
                    { key: 'count', header: 'Count', align: 'right' },
                    { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
                  ]}
                  data={data.csatDistribution.map(d => ({
                    ...d,
                    ratingFormatted: `${d.rating} ★`,
                    percentageFormatted: `${d.percentage}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* AI Performance Trend */}
          {config.includeAIPerformanceTrend && data.aiPerformanceTrend?.length && (
            <PDFSection 
              title="AI Performance Trend"
              description="How Ari's containment and resolution rates have changed over time."
            >
              {config.includeCharts && (
                <PDFLineChart
                  data={data.aiPerformanceTrend}
                  series={[
                    { key: 'containment_rate', color: CHART_COLORS.primary, label: 'Containment' },
                    { key: 'resolution_rate', color: CHART_COLORS.success, label: 'Resolution' },
                  ]}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'date', header: 'Date' },
                    { key: 'containmentFormatted', header: 'Containment Rate', align: 'right' },
                    { key: 'resolutionFormatted', header: 'Resolution Rate', align: 'right' },
                  ]}
                  data={data.aiPerformanceTrend.slice(0, 20).map(t => ({
                    ...t,
                    containmentFormatted: `${t.containment_rate}%`,
                    resolutionFormatted: `${t.resolution_rate}%`,
                  }))}
                />
              )}
            </PDFSection>
          )}

          {/* Usage Metrics */}
          {config.includeUsageMetrics && data.usageMetrics?.length && (
            <PDFSection 
              title="Usage Metrics"
              description="Platform usage statistics including conversations, messages, and API activity."
            >
              {config.includeCharts && (
                <PDFLineChart
                  data={data.usageMetrics}
                  series={[
                    { key: 'conversations', color: CHART_COLORS.primary, label: 'Conversations' },
                    { key: 'messages', color: CHART_COLORS.success, label: 'Messages' },
                    { key: 'api_calls', color: CHART_COLORS.secondary, label: 'API Calls' },
                  ]}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'date', header: 'Date' },
                    { key: 'conversations', header: 'Conversations', align: 'right' },
                    { key: 'messages', header: 'Messages', align: 'right' },
                    { key: 'api_calls', header: 'API Calls', align: 'right' },
                  ]}
                  data={data.usageMetrics.slice(0, 20)}
                />
              )}
            </PDFSection>
          )}

          {/* Agent Performance */}
          {config.includeAgentPerformance && data.agentPerformance?.length && (
            <PDFSection 
              title="Agent Performance"
              description="Ari's performance metrics including handled conversations and resolution capabilities."
            >
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'agent_name', header: 'Agent' },
                    { key: 'total_conversations', header: 'Conversations', align: 'right' },
                    { key: 'avgResponseFormatted', header: 'Avg Response (s)', align: 'right' },
                    { key: 'satisfactionFormatted', header: 'CSAT', align: 'right' },
                  ]}
                  data={data.agentPerformance.map(a => ({
                    ...a,
                    avgResponseFormatted: a.avg_response_time.toFixed(1),
                    satisfactionFormatted: a.satisfaction_score.toFixed(1),
                  }))}
                />
              )}
            </PDFSection>
          )}
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
}
