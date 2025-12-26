/**
 * Analytics Type Definitions
 * 
 * Type-safe interfaces for analytics data including booking statistics,
 * satisfaction metrics, AI performance, and article usefulness tracking.
 * 
 * @module types/analytics
 * @see docs/ANALYTICS_REDESIGN_PLAN.md
 */

// =============================================================================
// BOOKING ANALYTICS TYPES
// =============================================================================

/** 
 * Calendar event status values from database enum.
 * Maps to `calendar_event_status` PostgreSQL enum.
 */
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

/**
 * Booking statistics by location.
 * Used in BookingsByLocationChart component.
 */
export interface LocationBookingData {
  /** Location UUID */
  locationId: string;
  /** Human-readable location name */
  locationName: string;
  /** Total bookings for this location */
  bookings: number;
  /** Completed bookings count */
  completed: number;
  /** Cancelled bookings count */
  cancelled: number;
  /** No-show bookings count */
  noShow: number;
}

/**
 * Booking count by status.
 * Used in BookingStatusChart (donut chart) component.
 */
export interface BookingStatusData {
  /** Booking status value */
  status: BookingStatus;
  /** Count of bookings with this status */
  count: number;
  /** Percentage of total bookings (0-100) */
  percentage: number;
}

/**
 * Daily booking trend data point.
 * Used for trend sparklines and area charts.
 */
export interface BookingTrendData {
  /** Date string in ISO format (e.g., "2024-01-15") */
  date: string;
  /** Confirmed bookings on this date */
  confirmed: number;
  /** Completed bookings on this date */
  completed: number;
  /** Cancelled bookings on this date */
  cancelled: number;
  /** No-show bookings on this date */
  noShow: number;
  /** Total bookings on this date (sum of all statuses) */
  total: number;
}

/**
 * Complete booking analytics stats.
 * Returned by useBookingAnalytics hook.
 */
export interface BookingStats {
  /** Total bookings in the selected period */
  totalBookings: number;
  /** 
   * Show rate percentage (0-100).
   * Calculated as: completed / (completed + cancelled + noShow) * 100
   */
  showRate: number;
  /** Booking counts grouped by location */
  byLocation: LocationBookingData[];
  /** Booking counts grouped by status */
  byStatus: BookingStatusData[];
  /** Daily booking trend data */
  trend: BookingTrendData[];
}

// =============================================================================
// SATISFACTION ANALYTICS TYPES
// =============================================================================

/** 
 * Valid rating values (1-5 star scale).
 * Maps to conversation_ratings.rating integer column.
 */
export type RatingValue = 1 | 2 | 3 | 4 | 5;

/**
 * Rating distribution for a specific star value.
 * Used in SatisfactionScoreCard distribution bars.
 */
export interface RatingDistribution {
  /** Star rating value (1-5) */
  rating: RatingValue;
  /** Count of ratings with this value */
  count: number;
  /** Percentage of total ratings (0-100) */
  percentage: number;
}

/**
 * Daily satisfaction trend data point.
 * Used for trend sparklines and line charts.
 */
export interface SatisfactionTrendData {
  /** Date string in ISO format (e.g., "2024-01-15") */
  date: string;
  /** Average rating on this date (1-5 scale) */
  avgRating: number;
  /** Number of ratings submitted on this date */
  count: number;
}

/**
 * Individual feedback item with optional comment.
 * Used in feedback lists and detail views.
 */
export interface FeedbackItem {
  /** Feedback record UUID */
  id: string;
  /** Star rating (1-5) */
  rating: number;
  /** Optional text feedback from user */
  feedback: string | null;
  /** Feedback submission timestamp */
  createdAt: string;
  /** Trigger type that prompted the rating */
  triggerType: string;
}

/**
 * Complete satisfaction analytics stats.
 * Returned by useSatisfactionAnalytics hook.
 */
export interface SatisfactionStats {
  /** Average rating across all submissions (1-5 scale) */
  averageRating: number;
  /** Total number of ratings submitted */
  totalRatings: number;
  /** Rating distribution (1-5 stars) */
  distribution: RatingDistribution[];
  /** Daily average rating trend */
  trend: SatisfactionTrendData[];
  /** Recent feedback with comments */
  recentFeedback: FeedbackItem[];
}

// =============================================================================
// AI PERFORMANCE ANALYTICS TYPES
// =============================================================================

/** 
 * Conversation status values from database enum.
 * Maps to `conversation_status` PostgreSQL enum.
 */
export type ConversationStatusType = 'active' | 'human_takeover' | 'closed';

/**
 * AI performance metrics.
 * Returned by useAIPerformanceAnalytics hook.
 */
export interface AIPerformanceStats {
  /** 
   * AI containment rate percentage (0-100).
   * Calculated as: (totalConversations - humanTakeover) / totalConversations * 100
   * Higher is better - indicates AI resolved without human intervention.
   */
  containmentRate: number;
  /** 
   * Resolution rate percentage (0-100).
   * Calculated as: closed / totalConversations * 100
   * Indicates percentage of conversations fully resolved.
   */
  resolutionRate: number;
  /** Total conversations in the selected period */
  totalConversations: number;
  /** Conversations handled entirely by AI (no takeover) */
  aiHandled: number;
  /** Conversations that required human takeover */
  humanTakeover: number;
  /** Conversations with 'closed' status */
  closed: number;
  /** Conversations with 'active' status */
  active: number;
}

/**
 * Daily AI performance trend data point.
 * Used for containment rate sparklines.
 */
export interface AIPerformanceTrendData {
  /** Date string in ISO format (e.g., "2024-01-15") */
  date: string;
  /** Containment rate on this date (0-100) */
  containmentRate: number;
  /** Resolution rate on this date (0-100) */
  resolutionRate: number;
  /** Total conversations on this date */
  total: number;
}

// =============================================================================
// ARTICLE USEFULNESS ANALYTICS TYPES
// =============================================================================

/**
 * Article usefulness/helpfulness statistics.
 * Returned by useArticleUsefulnessAnalytics hook.
 */
export interface ArticleUsefulnessStats {
  /** Percentage of "helpful" responses (0-100) */
  helpfulPercentage: number;
  /** Total feedback submissions */
  totalFeedback: number;
  /** Count of "helpful" (is_helpful = true) responses */
  helpful: number;
  /** Count of "not helpful" (is_helpful = false) responses */
  notHelpful: number;
}

/**
 * Article-specific usefulness breakdown.
 * Used for identifying articles that need improvement.
 */
export interface ArticleUsefulnessItem {
  /** Article UUID */
  articleId: string;
  /** Article title */
  articleTitle: string;
  /** Category name */
  categoryName: string;
  /** Total feedback for this article */
  totalFeedback: number;
  /** Helpful count */
  helpful: number;
  /** Not helpful count */
  notHelpful: number;
  /** Helpfulness percentage (0-100) */
  helpfulPercentage: number;
}

// =============================================================================
// ANALYTICS DASHBOARD TYPES
// =============================================================================

/**
 * Date range for analytics queries.
 * Used across all analytics hooks.
 */
export interface AnalyticsDateRange {
  /** Start date (inclusive) */
  startDate: Date;
  /** End date (inclusive) */
  endDate: Date;
}

/**
 * KPI sparkline data point.
 * Used in MetricCardWithChart component.
 */
export interface SparklineDataPoint {
  /** Date or label for the data point */
  date: string;
  /** Numeric value for the data point */
  value: number;
}

/**
 * Complete analytics dashboard data.
 * Aggregates all analytics for the main dashboard view.
 */
export interface AnalyticsDashboardData {
  /** Booking statistics */
  bookings: BookingStats | null;
  /** Satisfaction statistics */
  satisfaction: SatisfactionStats | null;
  /** AI performance statistics */
  aiPerformance: AIPerformanceStats | null;
  /** Article usefulness statistics */
  articleUsefulness: ArticleUsefulnessStats | null;
  /** Whether any data is currently loading */
  isLoading: boolean;
  /** Any error that occurred during data fetching */
  error: Error | null;
}

// =============================================================================
// CHART COMPONENT PROP TYPES
// =============================================================================

/**
 * Common props for analytics chart components.
 * Ensures consistent loading/empty state handling.
 */
export interface BaseChartProps {
  /** Whether data is currently loading */
  loading?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for BookingsByLocationChart component.
 */
export interface BookingsByLocationChartProps extends BaseChartProps {
  /** Location booking data array */
  data: LocationBookingData[];
}

/**
 * Props for BookingStatusChart component.
 */
export interface BookingStatusChartProps extends BaseChartProps {
  /** Status breakdown data array */
  data: BookingStatusData[];
  /** Calculated show rate percentage */
  showRate: number;
}

/**
 * Props for SatisfactionScoreCard component.
 */
export interface SatisfactionScoreCardProps extends BaseChartProps {
  /** Average rating (1-5) */
  averageRating: number;
  /** Total rating count */
  totalRatings: number;
  /** Rating distribution data */
  distribution: RatingDistribution[];
}

/**
 * Props for AIPerformanceCard component.
 */
export interface AIPerformanceCardProps extends BaseChartProps {
  /** AI containment rate (0-100) */
  containmentRate: number;
  /** Resolution rate (0-100) */
  resolutionRate: number;
  /** Total conversations analyzed */
  totalConversations: number;
  /** Human takeover count */
  humanTakeover: number;
}

/**
 * Props for TicketsResolvedCard placeholder component.
 */
export interface TicketsResolvedCardProps extends BaseChartProps {
  /** Placeholder - tickets resolved count */
  ticketsResolved?: number;
  /** Whether to show "Coming Soon" overlay */
  comingSoon?: boolean;
}
