/**
 * Analytics Export Data Builder
 * 
 * Constructs the export data object for report generation.
 * Extracted from Analytics.tsx to reduce page complexity.
 * 
 * @module lib/analytics-export-data
 */

import type { BookingStats, SatisfactionStats, AIPerformanceStats } from '@/types/analytics';
import type { MockTrafficSource, MockLandingPage, MockLocationData } from '@/lib/mock-analytics-data';
import type { ConversationStatItem, AgentPerformanceItem, UsageMetricItem } from '@/hooks/useAnalyticsData';

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
  };
}
