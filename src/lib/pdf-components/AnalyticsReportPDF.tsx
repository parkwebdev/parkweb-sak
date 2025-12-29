/**
 * Analytics Report PDF Document
 * 
 * Main PDF document component that assembles all sections.
 * Uses @react-pdf/renderer for vector-based PDF generation.
 */

import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { styles, colors, PAGE, SPACING, FONT_SIZE } from './styles';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFKPICards } from './PDFKPICards';
import { PDFTable } from './PDFTable';
import { PDFSection } from './PDFSection';
import { PDFChart } from './PDFChart';

// Import fonts (registers on import)
import './fonts';

/** Chart data for embedding */
export interface ChartImageData {
  id?: string;
  // Preferred: vector charts
  svgString?: string;
  // Legacy fallback
  dataUrl?: string;
  width: number;
  height: number;
}

/** PDF data structure */
export interface PDFData {
  totalConversations?: number;
  conversationsChange?: number;
  totalLeads?: number;
  leadsChange?: number;
  conversionRate?: number;
  conversationStats?: Array<{ date: string; total: number; active: number; closed: number }>;
  conversationFunnel?: Array<{ name: string; count: number; percentage: number; dropOffPercent: number }>;
  peakActivity?: { peakDay: string; peakTime: string; peakValue: number };
  leadStats?: Array<{ date: string; total: number }>;
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

/** PDF configuration */
export interface PDFConfig {
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
  type?: 'summary' | 'detailed' | 'comparison';
}

interface AnalyticsReportPDFProps {
  data: PDFData;
  config: PDFConfig;
  startDate: Date;
  endDate: Date;
  orgName: string;
  charts?: Map<string, ChartImageData>;
}

export function AnalyticsReportPDF({ 
  data, 
  config, 
  startDate, 
  endDate, 
  orgName,
  charts,
}: AnalyticsReportPDFProps) {
  // Build KPI data
  const kpis = [
    { 
      label: 'Conversations', 
      value: data.totalConversations ?? 0, 
      change: data.conversationsChange 
    },
    { 
      label: 'Leads', 
      value: data.totalLeads ?? 0, 
      change: data.leadsChange 
    },
    { 
      label: 'Conversion Rate', 
      value: `${(data.conversionRate ?? 0).toFixed(1)}%`, 
      change: null 
    },
  ];

  const getChart = (id: string) => charts?.get(id);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader 
          orgName={orgName} 
          startDate={startDate} 
          endDate={endDate}
          reportType={config.type}
        />
        
        <View style={styles.content}>
          {/* KPIs */}
          {config.includeKPIs && (
            <PDFKPICards kpis={kpis} />
          )}

          {/* Conversations */}
          {config.includeConversations && (
            <PDFSection title="Conversations">
              {config.includeCharts && getChart('conversation-volume') && (
                <PDFChart
                  svgString={getChart('conversation-volume')!.svgString}
                  imageDataUrl={getChart('conversation-volume')!.dataUrl}
                  maxHeight={180}
                />
              )}
              {config.includeTables && data.conversationStats?.length && (
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
            <PDFSection title="Conversation Funnel">
              {config.includeCharts && getChart('conversation-funnel') && (
                <PDFChart
                  svgString={getChart('conversation-funnel')!.svgString}
                  imageDataUrl={getChart('conversation-funnel')!.dataUrl}
                  maxHeight={160}
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
            <PDFSection title="Peak Activity">
              {config.includeCharts && getChart('peak-activity') && (
                <PDFChart
                  svgString={getChart('peak-activity')!.svgString}
                  imageDataUrl={getChart('peak-activity')!.dataUrl}
                  maxHeight={180}
                />
              )}
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

          {/* Lead Source Breakdown */}
          {config.includeLeadSourceBreakdown && data.leadSourceBreakdown?.length && (
            <PDFSection title="Lead Source Breakdown">
              {config.includeCharts && getChart('lead-source-breakdown') && (
                <PDFChart
                  svgString={getChart('lead-source-breakdown')!.svgString}
                  imageDataUrl={getChart('lead-source-breakdown')!.dataUrl}
                  maxHeight={160}
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
            <PDFSection title="Bookings">
              {config.includeCharts && getChart('bookings-by-location') && (
                <PDFChart
                  svgString={getChart('bookings-by-location')!.svgString}
                  imageDataUrl={getChart('bookings-by-location')!.dataUrl}
                  maxHeight={180}
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
            <PDFSection title="Booking Trend">
              {config.includeCharts && getChart('booking-trend') && (
                <PDFChart
                  svgString={getChart('booking-trend')!.svgString}
                  imageDataUrl={getChart('booking-trend')!.dataUrl}
                  maxHeight={180}
                />
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
            <PDFSection title="Customer Satisfaction">
              {config.includeCharts && getChart('csat-distribution') && (
                <PDFChart
                  svgString={getChart('csat-distribution')!.svgString}
                  imageDataUrl={getChart('csat-distribution')!.dataUrl}
                  maxHeight={160}
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
            <PDFSection title="Recent Feedback">
              <PDFTable
                columns={[
                  { key: 'dateFormatted', header: 'Date' },
                  { key: 'ratingFormatted', header: 'Rating' },
                  { key: 'feedbackTruncated', header: 'Feedback', width: '45%' },
                  { key: 'triggerType', header: 'Trigger' },
                ]}
                data={data.recentFeedback.slice(0, 10).map(f => ({
                  ...f,
                  dateFormatted: format(new Date(f.createdAt), 'MMM d, yyyy'),
                  ratingFormatted: `${f.rating} ★`,
                  feedbackTruncated: (f.feedback || '-').substring(0, 40) + ((f.feedback?.length || 0) > 40 ? '...' : ''),
                }))}
              />
            </PDFSection>
          )}

          {/* AI Performance */}
          {config.includeAIPerformance && data.aiPerformanceStats && (
            <PDFSection title="Ari Performance">
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
            <PDFSection title="Traffic Sources">
              {config.includeCharts && getChart('traffic-sources') && (
                <PDFChart
                  svgString={getChart('traffic-sources')!.svgString}
                  imageDataUrl={getChart('traffic-sources')!.dataUrl}
                  maxHeight={180}
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
          {config.includeTrafficSourceTrend && getChart('traffic-source-trend') && (
            <PDFSection title="Traffic Source Trend">
              <PDFChart
                svgString={getChart('traffic-source-trend')!.svgString}
                imageDataUrl={getChart('traffic-source-trend')!.dataUrl}
                maxHeight={180}
              />
            </PDFSection>
          )}

          {/* Top Pages */}
          {config.includeTopPages && data.topPages?.length && (
            <PDFSection title="Top Pages">
              {config.includeCharts && getChart('top-pages') && (
                <PDFChart
                  svgString={getChart('top-pages')!.svgString}
                  imageDataUrl={getChart('top-pages')!.dataUrl}
                  maxHeight={180}
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
            <PDFSection title="Page Engagement">
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
            <PDFSection title="Page Depth Distribution">
              {config.includeCharts && getChart('page-depth') && (
                <PDFChart
                  svgString={getChart('page-depth')!.svgString}
                  imageDataUrl={getChart('page-depth')!.dataUrl}
                  maxHeight={160}
                />
              )}
              {config.includeTables && (
                <PDFTable
                  columns={[
                    { key: 'depth', header: 'Pages Viewed' },
                    { key: 'count', header: 'Sessions', align: 'right' },
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
            <PDFSection title="Visitor Locations">
              <PDFTable
                columns={[
                  { key: 'country', header: 'Country' },
                  { key: 'visitors', header: 'Visitors', align: 'right' },
                  { key: 'percentageFormatted', header: 'Percentage', align: 'right' },
                ]}
                data={data.visitorLocations.slice(0, 10).map(l => ({
                  ...l,
                  percentageFormatted: `${l.percentage}%`,
                }))}
              />
            </PDFSection>
          )}
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
}
