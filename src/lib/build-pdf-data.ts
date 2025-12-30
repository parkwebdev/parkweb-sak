/**
 * Build PDF Data Utility
 * 
 * Extracts and transforms analytics data into the PDFData format
 * for report generation. Shared between ReportBuilder and Analytics export.
 * 
 * @module lib/build-pdf-data
 */

import type { PDFData } from '@/types/pdf';
import type { UseAnalyticsDataReturn } from '@/hooks/useAnalyticsData';

interface PeakActivityData {
  peakDay: string;
  peakTime: string;
  peakValue: number;
  heatmapData?: Array<{ day: string; hour: number; value: number }>;
}

/**
 * Build PDF data from analytics hook return value
 */
export function buildPDFData(
  data: UseAnalyticsDataReturn,
  peakActivityData?: PeakActivityData
): PDFData {
  // Calculate totals for percentage calculations
  const totalTrafficVisitors = data.trafficSources?.reduce((sum, s) => sum + s.value, 0) || 1;
  const totalLocationVisitors = data.locationData?.reduce((sum, l) => sum + l.count, 0) || 1;
  const totalRatings = data.satisfactionStats?.totalRatings || 1;
  
  return {
    // === KPIs ===
    totalConversations: data.totalConversations,
    conversationsChange: data.conversationTrendValue,
    totalLeads: data.totalLeads,
    leadsChange: data.leadTrendValue,
    conversionRate: data.conversionRate ? parseFloat(data.conversionRate) : 0,

    // === Conversation Data ===
    conversationStats: data.conversationStats,
    conversationFunnel: data.funnelStages?.map(s => ({
      name: s.name,
      count: s.count,
      percentage: s.percentage,
      dropOffPercent: s.dropOffPercent,
    })),
    peakActivity: peakActivityData ? {
      peakDay: peakActivityData.peakDay,
      peakTime: peakActivityData.peakTime,
      peakValue: peakActivityData.peakValue,
    } : undefined,

    // === Lead Data ===
    leadStats: data.leadStats?.map(s => ({ date: s.date, total: s.total })),
    leadSourceBreakdown: data.leadsBySource?.map(s => ({
      source: s.source,
      leads: s.leads,
      sessions: s.sessions,
      cvr: s.cvr,
    })),
    // Lead conversion trend with stage breakdown
    leadConversionTrend: data.leadStats?.map(s => ({
      date: s.date,
      total: s.total,
      new: (s.new as number) ?? 0,
      contacted: (s.contacted as number) ?? 0,
      qualified: (s.qualified as number) ?? 0,
      won: (s.won as number) ?? 0,
      lost: (s.lost as number) ?? 0,
    })),

    // === Booking Data ===
    bookingStats: data.bookingStats?.byLocation?.map(l => ({
      location: l.locationName,
      total: l.bookings,
      confirmed: (l as { confirmed?: number }).confirmed ?? Math.max(0, l.bookings - l.completed - l.cancelled - l.noShow),
      completed: l.completed,
      no_show: l.noShow,
      show_rate: Math.round((l.completed / Math.max(l.bookings, 1)) * 100),
    })),
    bookingTrend: data.bookingStats?.trend?.map(t => ({
      date: t.date,
      confirmed: t.confirmed,
      completed: t.completed,
      cancelled: t.cancelled,
      noShow: t.noShow,
    })),

    // === Satisfaction Data ===
    satisfactionStats: data.satisfactionStats ? {
      average_rating: data.satisfactionStats.averageRating,
      total_ratings: data.satisfactionStats.totalRatings,
      distribution: data.satisfactionStats.distribution?.map(d => ({
        rating: d.rating,
        count: d.count,
      })),
    } : undefined,
    csatDistribution: data.satisfactionStats?.distribution?.map(d => ({
      rating: d.rating,
      count: d.count,
      percentage: Math.round((d.count / totalRatings) * 100),
    })),
    recentFeedback: data.satisfactionStats?.recentFeedback?.map(f => ({
      rating: f.rating,
      feedback: f.feedback,
      createdAt: f.createdAt,
      triggerType: f.triggerType,
    })),

    // === AI Performance Data ===
    aiPerformanceStats: data.aiPerformanceStats ? {
      containment_rate: data.aiPerformanceStats.containmentRate,
      resolution_rate: data.aiPerformanceStats.resolutionRate,
      ai_handled: data.aiPerformanceStats.totalConversations - data.aiPerformanceStats.humanTakeover,
      human_takeover: data.aiPerformanceStats.humanTakeover,
      total_conversations: data.aiPerformanceStats.totalConversations,
    } : undefined,
    aiPerformanceTrend: data.aiPerformanceTrend?.map(t => ({
      date: t.date,
      containment_rate: t.containmentRate,
      resolution_rate: t.resolutionRate,
    })),

    // === Traffic Data ===
    trafficSources: data.trafficSources?.map(s => ({
      source: s.name,
      visitors: s.value,
      percentage: Math.round((s.value / totalTrafficVisitors) * 100),
    })),
    trafficSourceTrend: data.sourcesByDate?.map(s => ({
      date: s.date,
      direct: s.direct,
      organic: s.organic,
      paid: s.paid,
      social: s.social,
      email: s.email,
      referral: s.referral,
    })),

    // === Page Data ===
    topPages: data.landingPages?.map(p => ({
      page: p.url,
      visits: p.visits,
      bounce_rate: (p as { bounceRate?: number }).bounceRate ?? data.engagement?.bounceRate ?? 0,
      conversations: p.conversions,
    })),
    pageEngagement: data.engagement ? {
      bounceRate: data.engagement.bounceRate,
      avgPagesPerSession: data.engagement.avgPagesPerSession,
      totalSessions: data.engagement.totalSessions,
      overallCVR: data.engagement.overallCVR,
    } : undefined,
    pageDepthDistribution: data.pageDepthDistribution?.map(d => ({
      depth: d.depth,
      count: d.count,
      percentage: d.percentage,
    })),

    // === Geography Data ===
    visitorLocations: data.locationData?.map(l => ({
      country: l.country,
      visitors: l.count,
      percentage: Math.round((l.count / totalLocationVisitors) * 100),
    })),
    visitorCities: data.locationData?.filter(l => l.city).map(l => ({
      city: l.city || '',
      country: l.country,
      visitors: l.count,
    })),

    // === Usage & Performance Data ===
    usageMetrics: data.usageMetrics?.map(u => ({
      date: u.date,
      conversations: u.conversations,
      messages: u.messages,
      api_calls: u.api_calls,
    })),
    agentPerformance: data.agentPerformance?.map(a => ({
      agent_name: a.agent_name,
      total_conversations: a.total_conversations,
      avg_response_time: a.avg_response_time,
      satisfaction_score: a.satisfaction_score,
    })),
  };
}
