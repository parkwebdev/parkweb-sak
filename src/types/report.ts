/**
 * Report Data Type Definitions
 * 
 * Type-safe interfaces for analytics report data used in CSV/PDF exports.
 * Replaces `any` type usage in report-export.ts
 * 
 * @module types/report
 * @see src/lib/report-export.ts
 */

// Import shared types from analytics to avoid duplication
import type { FunnelStage } from './analytics';

// Re-export for convenience
export type { FunnelStage };

/**
 * Daily conversation statistics for reports.
 */
export interface ConversationStat {
  /** Date string (e.g., "2024-01-15") */
  date: string;
  /** Total conversations on this date */
  total: number;
  /** Active conversations count */
  active: number;
  /** Closed conversations count */
  closed: number;
  /** Human takeover conversations count */
  human_takeover?: number;
}

/**
 * Daily lead statistics for reports.
 * Supports dynamic stage names via index signature.
 */
export interface LeadStat {
  /** Date string (e.g., "2024-01-15") */
  date: string;
  /** Total leads on this date */
  total: number;
  /** Dynamic stage counts - keys are lowercase stage names */
  [stageName: string]: number | string;
}

/**
 * Agent performance metrics for reports.
 */
export interface AgentPerformance {
  /** Agent name */
  agent_name: string;
  /** Total conversations handled */
  total_conversations: number;
  /** Average response time in seconds */
  avg_response_time: number;
  /** Satisfaction score (0-5) */
  satisfaction_score: number | null;
}

/**
 * Daily usage metrics for reports.
 */
export interface UsageMetric {
  /** Date string (e.g., "2024-01-15") */
  date: string;
  /** Conversations count on this date */
  conversations: number;
  /** Messages count on this date */
  messages: number;
  /** API calls count on this date */
  api_calls: number;
}

/**
 * Booking statistics for reports.
 */
export interface BookingStat {
  /** Location name */
  location: string;
  /** Total bookings */
  total: number;
  /** Confirmed bookings */
  confirmed: number;
  /** Cancelled bookings */
  cancelled: number;
  /** Completed bookings */
  completed: number;
  /** No-show bookings */
  no_show: number;
  /** Show rate percentage */
  show_rate: number;
}

/**
 * Satisfaction metrics for reports.
 */
export interface SatisfactionStat {
  /** Average rating (1-5) */
  average_rating: number;
  /** Total ratings count */
  total_ratings: number;
  /** Distribution by rating value */
  distribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
}

/**
 * AI Performance metrics for reports.
 */
export interface AIPerformanceStat {
  /** Containment rate percentage */
  containment_rate: number;
  /** Resolution rate percentage */
  resolution_rate: number;
  /** Total conversations handled by AI */
  ai_handled: number;
  /** Conversations requiring human takeover */
  human_takeover: number;
  /** Total conversations */
  total_conversations: number;
}

/**
 * Traffic source data for reports.
 */
export interface TrafficSourceStat {
  /** Source name (e.g., "Direct", "Google", "Facebook") */
  source: string;
  /** Number of visitors from this source */
  visitors: number;
  /** Percentage of total traffic */
  percentage: number;
}

/**
 * Top page data for reports.
 */
export interface TopPageStat {
  /** Page URL or path */
  page: string;
  /** Number of visits */
  visits: number;
  /** Bounce rate percentage */
  bounce_rate: number;
  /** Conversations started from this page */
  conversations: number;
}

/**
 * Visitor location data for reports.
 */
export interface LocationStat {
  /** Country name */
  country: string;
  /** Number of visitors */
  visitors: number;
  /** Percentage of total visitors */
  percentage: number;
}

/**
 * Complete analytics report data structure.
 * Used for generating CSV and PDF reports.
 */
export interface ReportData {
  // KPI metrics
  /** Total conversations in the period */
  totalConversations?: number;
  /** Percent change from previous period */
  conversationsChange?: number;
  /** Total leads in the period */
  totalLeads?: number;
  /** Percent change from previous period */
  leadsChange?: number;
  /** Conversion rate percentage */
  conversionRate?: number;
  /** Percent change from previous period */
  conversionChange?: number;
  /** Total messages in the period */
  totalMessages?: number;
  /** Percent change from previous period */
  messagesChange?: number;

  // Core statistics
  /** Daily conversation statistics */
  conversationStats?: ConversationStat[];
  /** Daily lead statistics by stage */
  leadStats?: LeadStat[];
  /** Agent performance metrics */
  agentPerformance?: AgentPerformance[];
  /** Daily usage metrics */
  usageMetrics?: UsageMetric[];

  // Business outcomes
  /** Booking statistics by location */
  bookingStats?: BookingStat[];
  /** Overall satisfaction metrics */
  satisfactionStats?: SatisfactionStat;
  /** AI performance metrics */
  aiPerformanceStats?: AIPerformanceStat;

  // Traffic analytics
  /** Traffic source breakdown */
  trafficSources?: TrafficSourceStat[];
  /** Top pages by visits */
  topPages?: TopPageStat[];
  /** Visitor locations */
  visitorLocations?: LocationStat[];

  // NEW: Conversation Funnel
  /** Funnel stages with drop-off percentages */
  conversationFunnel?: FunnelStage[];

  // NEW: Peak Activity
  /** Peak activity heatmap data */
  peakActivity?: {
    /** 7 days × 6 time blocks matrix */
    data: number[][];
    /** Day with highest activity */
    peakDay: string;
    /** Time block with highest activity */
    peakTime: string;
    /** Highest conversation count */
    peakValue: number;
  };

  // NEW: Page Engagement
  /** Page engagement metrics */
  pageEngagement?: {
    /** Bounce rate percentage */
    bounceRate: number;
    /** Average pages per session */
    avgPagesPerSession: number;
    /** Average session duration in milliseconds */
    avgSessionDuration: number;
    /** Total sessions count */
    totalSessions: number;
    /** Overall conversion rate */
    overallCVR: number;
  };

  // NEW: Lead Source Breakdown
  /** Leads by traffic source with conversion rates */
  leadSourceBreakdown?: LeadSourceBreakdown[];

  // NEW: Page Depth Distribution
  /** Pages viewed per session distribution */
  pageDepthDistribution?: PageDepthItem[];

  // NEW: Customer Feedback
  /** Recent feedback items with ratings */
  recentFeedback?: FeedbackItemReport[];

  // NEW: Trend Data
  /** Daily booking trend data */
  bookingTrend?: BookingTrendItem[];
  /** Daily traffic source breakdown */
  trafficSourceTrend?: TrafficSourceTrendItem[];
  /** Daily lead conversion by stage */
  leadConversionTrend?: LeadConversionTrendItem[];
}

/**
 * Lead source breakdown item.
 */
export interface LeadSourceBreakdown {
  source: string;
  leads: number;
  sessions: number;
  cvr: number;
}

/**
 * Page depth distribution item.
 */
export interface PageDepthItem {
  depth: string;
  count: number;
  percentage: number;
}

/**
 * Feedback item for reports.
 */
export interface FeedbackItemReport {
  rating: number;
  feedback: string | null;
  createdAt: string;
  triggerType: string;
}

/**
 * Booking trend item.
 */
export interface BookingTrendItem {
  date: string;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  total: number;
}

/**
 * Traffic source trend item.
 */
export interface TrafficSourceTrendItem {
  date: string;
  direct: number;
  organic: number;
  paid: number;
  social: number;
  email: number;
  referral: number;
  total: number;
}

/**
 * Lead conversion trend item with dynamic stage columns.
 */
export interface LeadConversionTrendItem {
  date: string;
  [stageName: string]: number | string;
}

/**
 * Visitor presence state from Supabase Realtime.
 * Used for tracking active widget visitors.
 */
export interface VisitorPresenceState {
  /** Unique visitor identifier */
  visitorId: string;
  /** Current page URL being viewed */
  currentPage: string;
  /** Whether the widget is currently open */
  isWidgetOpen: boolean;
  /** Lead name if available from contact form */
  leadName?: string;
  /** Lead email if available from contact form */
  leadEmail?: string;
  /** ISO timestamp when visitor session started */
  startedAt?: string;
}

/**
 * Team profile from get_team_profiles RPC function.
 * Used in useTeam hook for member listing.
 */
export interface TeamProfile {
  /** Profile record ID */
  id: string;
  /** User ID (auth.users reference) */
  user_id: string;
  /** Display name */
  display_name: string | null;
  /** Avatar URL */
  avatar_url: string | null;
  /** Profile creation timestamp */
  created_at: string;
  /** Profile last update timestamp */
  updated_at: string;
}

/**
 * Scheduled report record from database.
 * Used in ScheduledReportsManager component.
 */
export interface ScheduledReport {
  /** Report ID */
  id: string;
  /** Report name */
  name: string;
  /** Report frequency */
  frequency: 'daily' | 'weekly' | 'monthly';
  /** Time of day to send (HH:mm:ss) */
  time_of_day: string;
  /** Day of week for weekly reports (0-6) */
  day_of_week: number | null;
  /** Day of month for monthly reports (1-31) */
  day_of_month: number | null;
  /** Email recipients */
  recipients: string[];
  /** Report configuration */
  report_config: Record<string, unknown>;
  /** Whether report is active */
  active: boolean;
  /** Last sent timestamp */
  last_sent_at: string | null;
  /** Report creator */
  created_by: string;
  /** User ID (owner) */
  user_id: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}
