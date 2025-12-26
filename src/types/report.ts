/**
 * Report Data Type Definitions
 * 
 * Type-safe interfaces for analytics report data used in CSV/PDF exports.
 * Replaces `any` type usage in report-export.ts
 * 
 * @module types/report
 * @see src/lib/report-export.ts
 */

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

  // Detailed statistics
  /** Daily conversation statistics */
  conversationStats?: ConversationStat[];
  /** Daily lead statistics by stage */
  leadStats?: LeadStat[];
  /** Agent performance metrics */
  agentPerformance?: AgentPerformance[];
  /** Daily usage metrics */
  usageMetrics?: UsageMetric[];
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
