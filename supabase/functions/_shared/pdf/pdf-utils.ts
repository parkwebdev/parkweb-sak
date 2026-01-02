/**
 * PDF Utility Functions for Edge Functions
 * 
 * Ported from src/lib/pdf-utils.ts
 * Type guards, sanitization, and validation utilities.
 */

import type { PDFData, PDFConfig } from './types.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

export const TABLE_LIMITS = {
  DEFAULT: 20,
  FEEDBACK: 10,
  CHART_POINTS: 30,
  PIE_SEGMENTS: 8,
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// ============================================================================
// SANITIZATION
// ============================================================================

export function sanitizeNumber(value: unknown, defaultValue = 0): number {
  if (isValidNumber(value)) return value;
  return defaultValue;
}

export function normalizePercentage(value: unknown): number {
  const num = sanitizeNumber(value);
  if (num > 0 && num <= 1) return Math.round(num * 100);
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function truncateArray<T>(arr: T[] | undefined | null, maxLength: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxLength);
}

export function sanitizeString(value: unknown, maxLength = 100): string {
  if (typeof value !== 'string') return '';
  return value.substring(0, maxLength);
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

export function formatNumber(value: number): string {
  return sanitizeNumber(value).toLocaleString();
}

export function formatPercent(value: number, decimals = 1): string {
  return `${sanitizeNumber(value).toFixed(decimals)}%`;
}

export function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength - 1) + '…';
}

// ============================================================================
// FULL DATA SANITIZATION
// ============================================================================

export function sanitizePDFData(data: PDFData): PDFData {
  const limits = TABLE_LIMITS;
  
  return {
    totalConversations: sanitizeNumber(data.totalConversations),
    conversationsChange: sanitizeNumber(data.conversationsChange),
    totalLeads: sanitizeNumber(data.totalLeads),
    leadsChange: sanitizeNumber(data.leadsChange),
    conversionRate: sanitizeNumber(data.conversionRate),

    conversationStats: truncateArray(data.conversationStats, limits.CHART_POINTS).map(s => ({
      date: sanitizeString(s.date),
      total: sanitizeNumber(s.total),
      active: sanitizeNumber(s.active),
      closed: sanitizeNumber(s.closed),
    })),

    conversationFunnel: truncateArray(data.conversationFunnel, limits.DEFAULT).map(s => ({
      name: sanitizeString(s.name),
      count: sanitizeNumber(s.count),
      percentage: normalizePercentage(s.percentage),
      dropOffPercent: normalizePercentage(s.dropOffPercent),
    })),

    peakActivity: data.peakActivity ? {
      peakDay: sanitizeString(data.peakActivity.peakDay),
      peakTime: sanitizeString(data.peakActivity.peakTime),
      peakValue: sanitizeNumber(data.peakActivity.peakValue),
    } : undefined,

    leadStats: truncateArray(data.leadStats, limits.CHART_POINTS).map(s => ({
      date: sanitizeString(s.date),
      total: sanitizeNumber(s.total),
    })),

    leadSourceBreakdown: truncateArray(data.leadSourceBreakdown, limits.DEFAULT).map(s => ({
      source: sanitizeString(s.source),
      leads: sanitizeNumber(s.leads),
      sessions: sanitizeNumber(s.sessions),
      cvr: sanitizeNumber(s.cvr),
    })),

    leadConversionTrend: truncateArray(data.leadConversionTrend, limits.CHART_POINTS).map(s => ({
      date: sanitizeString(s.date),
      total: sanitizeNumber(s.total),
      new: sanitizeNumber(s.new),
      contacted: sanitizeNumber(s.contacted),
      qualified: sanitizeNumber(s.qualified),
      won: sanitizeNumber(s.won),
      lost: sanitizeNumber(s.lost),
    })),

    bookingStats: truncateArray(data.bookingStats, limits.DEFAULT).map(s => ({
      location: sanitizeString(s.location),
      total: sanitizeNumber(s.total),
      confirmed: sanitizeNumber(s.confirmed),
      completed: sanitizeNumber(s.completed),
      no_show: sanitizeNumber(s.no_show),
      show_rate: normalizePercentage(s.show_rate),
    })),

    bookingTrend: truncateArray(data.bookingTrend, limits.CHART_POINTS).map(s => ({
      date: sanitizeString(s.date),
      confirmed: sanitizeNumber(s.confirmed),
      completed: sanitizeNumber(s.completed),
      cancelled: sanitizeNumber(s.cancelled),
      noShow: sanitizeNumber(s.noShow),
    })),

    satisfactionStats: data.satisfactionStats ? {
      average_rating: sanitizeNumber(data.satisfactionStats.average_rating),
      total_ratings: sanitizeNumber(data.satisfactionStats.total_ratings),
      distribution: truncateArray(data.satisfactionStats.distribution, 5).map(d => ({
        rating: sanitizeNumber(d.rating),
        count: sanitizeNumber(d.count),
      })),
    } : undefined,

    csatDistribution: truncateArray(data.csatDistribution, 5).map(d => ({
      rating: sanitizeNumber(d.rating),
      count: sanitizeNumber(d.count),
      percentage: normalizePercentage(d.percentage),
    })),

    recentFeedback: truncateArray(data.recentFeedback, limits.FEEDBACK).map(f => ({
      rating: sanitizeNumber(f.rating),
      feedback: f.feedback,
      createdAt: sanitizeString(f.createdAt),
      triggerType: sanitizeString(f.triggerType),
    })),

    aiPerformanceStats: data.aiPerformanceStats ? {
      containment_rate: normalizePercentage(data.aiPerformanceStats.containment_rate),
      resolution_rate: normalizePercentage(data.aiPerformanceStats.resolution_rate),
      ai_handled: sanitizeNumber(data.aiPerformanceStats.ai_handled),
      human_takeover: sanitizeNumber(data.aiPerformanceStats.human_takeover),
      total_conversations: sanitizeNumber(data.aiPerformanceStats.total_conversations),
    } : undefined,

    aiPerformanceTrend: truncateArray(data.aiPerformanceTrend, limits.CHART_POINTS).map(t => ({
      date: sanitizeString(t.date),
      containment_rate: normalizePercentage(t.containment_rate),
      resolution_rate: normalizePercentage(t.resolution_rate),
    })),

    trafficSources: truncateArray(data.trafficSources, limits.DEFAULT).map(s => ({
      source: sanitizeString(s.source),
      visitors: sanitizeNumber(s.visitors),
      percentage: normalizePercentage(s.percentage),
    })),

    trafficSourceTrend: truncateArray(data.trafficSourceTrend, limits.CHART_POINTS).map(s => ({
      date: sanitizeString(s.date),
      direct: sanitizeNumber(s.direct),
      organic: sanitizeNumber(s.organic),
      paid: sanitizeNumber(s.paid),
      social: sanitizeNumber(s.social),
      email: sanitizeNumber(s.email),
      referral: sanitizeNumber(s.referral),
    })),

    topPages: truncateArray(data.topPages, limits.DEFAULT).map(p => ({
      page: sanitizeString(p.page, 200),
      visits: sanitizeNumber(p.visits),
      bounce_rate: normalizePercentage(p.bounce_rate),
      conversations: sanitizeNumber(p.conversations),
    })),

    pageEngagement: data.pageEngagement ? {
      bounceRate: normalizePercentage(data.pageEngagement.bounceRate),
      avgPagesPerSession: sanitizeNumber(data.pageEngagement.avgPagesPerSession),
      totalSessions: sanitizeNumber(data.pageEngagement.totalSessions),
      overallCVR: normalizePercentage(data.pageEngagement.overallCVR),
    } : undefined,

    pageDepthDistribution: truncateArray(data.pageDepthDistribution, limits.DEFAULT).map(d => ({
      depth: sanitizeString(d.depth),
      count: sanitizeNumber(d.count),
      percentage: normalizePercentage(d.percentage),
    })),

    visitorLocations: truncateArray(data.visitorLocations, limits.DEFAULT).map(l => ({
      country: sanitizeString(l.country),
      visitors: sanitizeNumber(l.visitors),
      percentage: normalizePercentage(l.percentage),
    })),

    visitorCities: truncateArray(data.visitorCities, limits.DEFAULT).map(c => ({
      city: sanitizeString(c.city),
      country: sanitizeString(c.country),
      visitors: sanitizeNumber(c.visitors),
    })),

    usageMetrics: truncateArray(data.usageMetrics, limits.CHART_POINTS).map(u => ({
      date: sanitizeString(u.date),
      conversations: sanitizeNumber(u.conversations),
      messages: sanitizeNumber(u.messages),
      api_calls: sanitizeNumber(u.api_calls),
    })),

    agentPerformance: truncateArray(data.agentPerformance, limits.DEFAULT).map(a => ({
      agent_name: sanitizeString(a.agent_name),
      total_conversations: sanitizeNumber(a.total_conversations),
      avg_response_time: sanitizeNumber(a.avg_response_time),
      satisfaction_score: sanitizeNumber(a.satisfaction_score),
    })),
  };
}

export function normalizePDFConfig(config: Partial<PDFConfig> = {}): PDFConfig {
  return {
    type: config.type ?? 'summary',
    grouping: config.grouping ?? 'day',
    includeKPIs: config.includeKPIs ?? true,
    includeCharts: config.includeCharts ?? true,
    includeTables: config.includeTables ?? true,
    includeConversations: config.includeConversations ?? true,
    includeConversationFunnel: config.includeConversationFunnel ?? true,
    includePeakActivity: config.includePeakActivity ?? true,
    includeLeads: config.includeLeads ?? true,
    includeLeadSourceBreakdown: config.includeLeadSourceBreakdown ?? true,
    includeLeadConversionTrend: config.includeLeadConversionTrend ?? false,
    includeBookings: config.includeBookings ?? true,
    includeBookingTrend: config.includeBookingTrend ?? true,
    includeSatisfaction: config.includeSatisfaction ?? true,
    includeCSATDistribution: config.includeCSATDistribution ?? true,
    includeCustomerFeedback: config.includeCustomerFeedback ?? true,
    includeAIPerformance: config.includeAIPerformance ?? true,
    includeAIPerformanceTrend: config.includeAIPerformanceTrend ?? false,
    includeTrafficSources: config.includeTrafficSources ?? true,
    includeTrafficSourceTrend: config.includeTrafficSourceTrend ?? true,
    includeTopPages: config.includeTopPages ?? true,
    includePageEngagement: config.includePageEngagement ?? true,
    includePageDepth: config.includePageDepth ?? true,
    includeVisitorLocations: config.includeVisitorLocations ?? true,
    includeVisitorCities: config.includeVisitorCities ?? false,
    includeUsageMetrics: config.includeUsageMetrics ?? false,
    includeAgentPerformance: config.includeAgentPerformance ?? false,
  };
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export const getTriggerLabel = (triggerType: string): string => {
  switch (triggerType) {
    case "conversation_end":
      return "End of chat";
    case "manual":
      return "Manual";
    case "inactivity":
      return "Inactivity";
    case "escalation":
      return "Escalation";
    default:
      return triggerType || "Unknown";
  }
};
