/**
 * Analytics Export Data Builder
 * 
 * Constructs the export data object for report generation.
 * Extracted from Analytics.tsx to reduce page complexity.
 * 
 * @module lib/analytics-export-data
 */

import type { BookingStats, SatisfactionStats, AIPerformanceStats, FunnelStage, LeadSourceData } from '@/types/analytics';
import type { MockTrafficSource, MockLandingPage, MockLocationData, MockEngagementMetrics, MockDailySourceData, MockPageDepthData } from '@/lib/mock-analytics-data';
import type { ConversationStatItem, AgentPerformanceItem, UsageMetricItem } from '@/hooks/useAnalyticsData';
import type { PeakActivityData } from '@/lib/peak-activity-utils';
import type { 
  LeadSourceBreakdown, 
  PageDepthItem, 
  FeedbackItemReport, 
  BookingTrendItem, 
  TrafficSourceTrendItem, 
  LeadConversionTrendItem 
} from '@/types/report';

export interface KPI {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
}

export interface AnalyticsExportData {
  // KPI metrics
  totalConversations: number;
  conversationsChange: number;
  totalLeads: number;
  leadsChange: number;
  conversionRate: number;
  conversionChange: number;
  totalMessages: number;
  messagesChange: number;
  // Core statistics
  conversationStats: ConversationStatItem[];
  leadStats: Array<{ date: string; total: number; [key: string]: string | number }>;
  agentPerformance: AgentPerformanceItem[];
  usageMetrics: UsageMetricItem[];
  // Business outcomes
  bookingStats: Array<{
    location: string;
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    no_show: number;
    show_rate: number;
  }>;
  satisfactionStats?: {
    average_rating: number;
    total_ratings: number;
    distribution: Array<{ rating: number; count: number; percentage: number }>;
  };
  aiPerformanceStats?: {
    containment_rate: number;
    resolution_rate: number;
    ai_handled: number;
    human_takeover: number;
    total_conversations: number;
  };
  // Traffic analytics
  trafficSources: Array<{ source: string; visitors: number; percentage: number }>;
  topPages: Array<{ page: string; visits: number; bounce_rate: number; conversations: number }>;
  visitorLocations: Array<{ country: string; visitors: number; percentage: number }>;
  // Original data
  conversations: unknown[];
  leads: unknown[];
  kpis: KPI[];

  // =========================================================================
  // NEW: 9 Additional Export Fields (Phase 6)
  // =========================================================================
  
  /** Conversation funnel stages with drop-off percentages */
  conversationFunnel?: FunnelStage[];
  
  /** Peak activity heatmap data */
  peakActivity?: PeakActivityData;
  
  /** Page engagement metrics */
  pageEngagement?: {
    bounceRate: number;
    avgPagesPerSession: number;
    avgSessionDuration: number;
    totalSessions: number;
    overallCVR: number;
  };
  
  /** Leads by traffic source with conversion rates */
  leadSourceBreakdown?: LeadSourceBreakdown[];
  
  /** Pages viewed per session distribution */
  pageDepthDistribution?: PageDepthItem[];
  
  /** Recent feedback items with ratings */
  recentFeedback?: FeedbackItemReport[];
  
  /** Daily booking trend data */
  bookingTrend?: BookingTrendItem[];
  
  /** Daily traffic source breakdown */
  trafficSourceTrend?: TrafficSourceTrendItem[];
  
  /** Daily lead conversion by stage */
  leadConversionTrend?: LeadConversionTrendItem[];
}

interface BuildExportDataParams {
  // KPIs
  totalConversations: number;
  totalLeads: number;
  conversionRate: string;
  totalMessages: number;
  // Comparison KPIs
  comparisonTotalConversations: number;
  comparisonTotalLeads: number;
  comparisonConversionRate: string;
  comparisonTotalMessages: number;
  comparisonMode: boolean;
  // Stats
  conversationStats: ConversationStatItem[];
  leadStats: Array<{ date: string; total: number; [key: string]: string | number }>;
  agentPerformance: AgentPerformanceItem[];
  usageMetrics: UsageMetricItem[];
  // Business outcomes
  bookingStats: BookingStats | null;
  satisfactionStats: SatisfactionStats | null;
  aiPerformanceStats: AIPerformanceStats | null;
  // Traffic
  trafficSources: MockTrafficSource[];
  landingPages: MockLandingPage[];
  locationData: MockLocationData[];
  // Original data
  analyticsConversations: unknown[];
  leads: unknown[];
  // NEW: 9 additional data fields
  funnelStages?: FunnelStage[];
  peakActivity?: PeakActivityData | null;
  engagement?: MockEngagementMetrics | null;
  leadsBySource?: LeadSourceData[];
  pageDepthDistribution?: MockPageDepthData[];
  sourcesByDate?: MockDailySourceData[];
}

/**
 * Build KPIs array for reports
 */
export function buildKPIs(params: {
  totalConversations: number;
  totalLeads: number;
  conversionRate: string;
  totalMessages: number;
  comparisonTotalConversations: number;
  comparisonTotalLeads: number;
  comparisonConversionRate: string;
  comparisonTotalMessages: number;
  comparisonMode: boolean;
}): KPI[] {
  const {
    totalConversations,
    totalLeads,
    conversionRate,
    totalMessages,
    comparisonTotalConversations,
    comparisonTotalLeads,
    comparisonConversionRate,
    comparisonTotalMessages,
    comparisonMode,
  } = params;

  return [
    {
      title: 'Total Conversations',
      value: totalConversations.toString(),
      change: comparisonMode && comparisonTotalConversations > 0
        ? ((totalConversations - comparisonTotalConversations) / comparisonTotalConversations * 100)
        : 0,
      changeLabel: 'vs previous period',
    },
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      change: comparisonMode && comparisonTotalLeads > 0
        ? ((totalLeads - comparisonTotalLeads) / comparisonTotalLeads * 100)
        : 0,
      changeLabel: 'vs previous period',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: comparisonMode
        ? (parseFloat(conversionRate) - parseFloat(comparisonConversionRate))
        : 0,
      changeLabel: 'vs previous period',
    },
    {
      title: 'Total Messages',
      value: totalMessages.toString(),
      change: comparisonMode && comparisonTotalMessages > 0
        ? ((totalMessages - comparisonTotalMessages) / comparisonTotalMessages * 100)
        : 0,
      changeLabel: 'vs previous period',
    },
  ];
}

/**
 * Build analytics export data for report generation
 */
export function buildAnalyticsExportData(params: BuildExportDataParams): AnalyticsExportData {
  const {
    totalConversations,
    totalLeads,
    conversionRate,
    totalMessages,
    comparisonTotalConversations,
    comparisonTotalLeads,
    comparisonConversionRate,
    comparisonTotalMessages,
    comparisonMode,
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    bookingStats,
    satisfactionStats,
    aiPerformanceStats,
    trafficSources,
    landingPages,
    locationData,
    analyticsConversations,
    leads,
    // NEW fields
    funnelStages,
    peakActivity,
    engagement,
    leadsBySource,
    pageDepthDistribution,
    sourcesByDate,
  } = params;

  const kpis = buildKPIs({
    totalConversations,
    totalLeads,
    conversionRate,
    totalMessages,
    comparisonTotalConversations,
    comparisonTotalLeads,
    comparisonConversionRate,
    comparisonTotalMessages,
    comparisonMode,
  });

  // Transform leadsBySource to LeadSourceBreakdown format
  const leadSourceBreakdown: LeadSourceBreakdown[] = leadsBySource?.map(ls => ({
    source: ls.source,
    leads: ls.leads,
    sessions: ls.sessions,
    cvr: ls.cvr,
  })) || [];

  // Transform pageDepthDistribution
  const pageDepthItems: PageDepthItem[] = pageDepthDistribution?.map(pd => ({
    depth: pd.depth,
    count: pd.count,
    percentage: pd.percentage,
  })) || [];

  // Transform recentFeedback from satisfactionStats
  const recentFeedback: FeedbackItemReport[] = satisfactionStats?.recentFeedback?.map(fb => ({
    rating: fb.rating,
    feedback: fb.feedback,
    createdAt: fb.createdAt,
    triggerType: fb.triggerType,
  })) || [];

  // Transform booking trend data
  const bookingTrendData: BookingTrendItem[] = bookingStats?.trend?.map(bt => ({
    date: bt.date,
    confirmed: bt.confirmed,
    completed: bt.completed,
    cancelled: bt.cancelled,
    noShow: bt.noShow,
    total: bt.total,
  })) || [];

  // Transform sourcesByDate to TrafficSourceTrendItem format
  const trafficSourceTrendData: TrafficSourceTrendItem[] = sourcesByDate?.map(sd => ({
    date: sd.date,
    direct: sd.direct,
    organic: sd.organic,
    paid: sd.paid,
    social: sd.social,
    email: sd.email,
    referral: sd.referral,
    total: sd.direct + sd.organic + sd.paid + sd.social + sd.email + sd.referral,
  })) || [];

  // Transform leadStats to LeadConversionTrendItem format
  const leadConversionTrendData: LeadConversionTrendItem[] = leadStats.map(ls => {
    const item: LeadConversionTrendItem = { date: ls.date };
    // Copy all stage counts dynamically
    Object.keys(ls).forEach(key => {
      if (key !== 'date') {
        item[key] = ls[key];
      }
    });
    return item;
  });

  return {
    // KPI metrics
    totalConversations,
    conversationsChange: comparisonMode && comparisonTotalConversations > 0 
      ? parseFloat(((totalConversations - comparisonTotalConversations) / comparisonTotalConversations * 100).toFixed(1))
      : 0,
    totalLeads,
    leadsChange: comparisonMode && comparisonTotalLeads > 0
      ? parseFloat(((totalLeads - comparisonTotalLeads) / comparisonTotalLeads * 100).toFixed(1))
      : 0,
    conversionRate: parseFloat(conversionRate),
    conversionChange: comparisonMode && parseFloat(comparisonConversionRate) > 0
      ? parseFloat((parseFloat(conversionRate) - parseFloat(comparisonConversionRate)).toFixed(1))
      : 0,
    totalMessages,
    messagesChange: comparisonMode && comparisonTotalMessages > 0
      ? parseFloat(((totalMessages - comparisonTotalMessages) / comparisonTotalMessages * 100).toFixed(1))
      : 0,
    // Core statistics
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    // Business outcomes
    bookingStats: bookingStats?.byLocation?.map(loc => ({
      location: loc.locationName,
      total: loc.bookings,
      confirmed: loc.bookings - loc.cancelled - loc.completed - loc.noShow,
      cancelled: loc.cancelled,
      completed: loc.completed,
      no_show: loc.noShow,
      show_rate: loc.bookings > 0 ? Math.round((loc.completed / loc.bookings) * 100) : 0,
    })) || [],
    satisfactionStats: satisfactionStats ? {
      average_rating: satisfactionStats.averageRating,
      total_ratings: satisfactionStats.totalRatings,
      distribution: satisfactionStats.distribution.map(d => ({
        rating: d.rating,
        count: d.count,
        percentage: d.percentage,
      })),
    } : undefined,
    aiPerformanceStats: aiPerformanceStats ? {
      containment_rate: aiPerformanceStats.containmentRate,
      resolution_rate: aiPerformanceStats.resolutionRate,
      ai_handled: aiPerformanceStats.aiHandled,
      human_takeover: aiPerformanceStats.humanTakeover,
      total_conversations: aiPerformanceStats.totalConversations,
    } : undefined,
    // Traffic analytics
    trafficSources: (() => {
      const totalValue = trafficSources?.reduce((sum, s) => sum + s.value, 0) || 0;
      return trafficSources?.map(source => ({
        source: source.name,
        visitors: source.value,
        percentage: totalValue > 0 ? Math.round((source.value / totalValue) * 100) : 0,
      })) || [];
    })(),
    topPages: landingPages?.map(page => ({
      page: page.url,
      visits: page.visits,
      bounce_rate: 0,
      conversations: page.conversions,
    })) || [],
    visitorLocations: locationData?.map(loc => {
      const totalVisitors = locationData.reduce((sum, l) => sum + l.count, 0);
      return {
        country: loc.country,
        visitors: loc.count,
        percentage: totalVisitors > 0 ? Math.round((loc.count / totalVisitors) * 100) : 0,
      };
    }) || [],
    // Original data
    conversations: analyticsConversations,
    leads,
    kpis,

    // =========================================================================
    // NEW: 9 Additional Export Fields
    // =========================================================================
    conversationFunnel: funnelStages,
    peakActivity: peakActivity || undefined,
    pageEngagement: engagement ? {
      bounceRate: engagement.bounceRate,
      avgPagesPerSession: engagement.avgPagesPerSession,
      avgSessionDuration: engagement.avgSessionDuration,
      totalSessions: engagement.totalSessions,
      overallCVR: engagement.overallCVR,
    } : undefined,
    leadSourceBreakdown,
    pageDepthDistribution: pageDepthItems,
    recentFeedback,
    bookingTrend: bookingTrendData,
    trafficSourceTrend: trafficSourceTrendData,
    leadConversionTrend: leadConversionTrendData,
  };
}
