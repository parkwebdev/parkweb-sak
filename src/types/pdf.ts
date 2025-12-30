/**
 * PDF Report Types
 * 
 * Type definitions for PDF report generation.
 * Synchronized with ReportConfig and analytics data structures.
 * 
 * @module types/pdf
 */

/**
 * Report type enum for PDF generation
 * - summary: High-level overview with key metrics
 * - detailed: Complete breakdown with all data tables
 * - comparison: Side-by-side period comparison
 */
export type ReportType = 'summary' | 'detailed' | 'comparison';

/**
 * Data grouping interval for reports
 */
export type ReportGrouping = 'day' | 'week' | 'month';

/**
 * PDF data structure containing all possible report data
 */
export interface PDFData {
  // ============================================================================
  // KPI METRICS
  // ============================================================================
  
  /** Total number of conversations */
  totalConversations?: number;
  /** Percentage change in conversations vs previous period */
  conversationsChange?: number;
  /** Total number of leads captured */
  totalLeads?: number;
  /** Percentage change in leads vs previous period */
  leadsChange?: number;
  /** Lead conversion rate percentage */
  conversionRate?: number;

  // ============================================================================
  // CONVERSATION DATA
  // ============================================================================
  
  /** Daily conversation statistics */
  conversationStats?: Array<{ 
    date: string; 
    total: number; 
    active: number; 
    closed: number;
  }>;
  /** Conversation funnel stages with drop-off rates */
  conversationFunnel?: Array<{ 
    name: string; 
    count: number; 
    percentage: number; 
    dropOffPercent: number;
  }>;
  /** Peak activity metrics */
  peakActivity?: { 
    peakDay: string; 
    peakTime: string; 
    peakValue: number;
  };

  // ============================================================================
  // LEAD DATA
  // ============================================================================
  
  /** Daily lead statistics */
  leadStats?: Array<{ 
    date: string; 
    total: number;
  }>;
  /** Lead source breakdown with conversion rates */
  leadSourceBreakdown?: Array<{ 
    source: string; 
    leads: number; 
    sessions: number; 
    cvr: number;
  }>;
  /** Lead conversion trend with stage breakdown */
  leadConversionTrend?: Array<{
    date: string;
    total: number;
    new?: number;
    contacted?: number;
    qualified?: number;
    won?: number;
    lost?: number;
  }>;

  // ============================================================================
  // BOOKING DATA
  // ============================================================================
  
  /** Booking statistics by location */
  bookingStats?: Array<{ 
    location: string; 
    total: number; 
    confirmed: number; 
    completed: number; 
    no_show: number; 
    show_rate: number;
  }>;
  /** Daily booking trend data */
  bookingTrend?: Array<{ 
    date: string; 
    confirmed: number; 
    completed: number; 
    cancelled: number; 
    noShow: number;
  }>;

  // ============================================================================
  // SATISFACTION DATA
  // ============================================================================
  
  /** Customer satisfaction statistics */
  satisfactionStats?: { 
    average_rating: number; 
    total_ratings: number; 
    distribution?: Array<{ 
      rating: number; 
      count: number;
    }>;
  };
  /** CSAT distribution with percentages */
  csatDistribution?: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  /** Recent customer feedback entries */
  recentFeedback?: Array<{ 
    rating: number; 
    feedback: string | null; 
    createdAt: string; 
    triggerType: string;
  }>;

  // ============================================================================
  // AI PERFORMANCE DATA
  // ============================================================================
  
  /** AI agent performance metrics */
  aiPerformanceStats?: { 
    containment_rate: number; 
    resolution_rate: number; 
    ai_handled: number; 
    human_takeover: number; 
    total_conversations: number;
  };
  /** AI performance trend over time */
  aiPerformanceTrend?: Array<{
    date: string;
    containment_rate: number;
    resolution_rate: number;
  }>;

  // ============================================================================
  // TRAFFIC DATA
  // ============================================================================
  
  /** Traffic source breakdown */
  trafficSources?: Array<{ 
    source: string; 
    visitors: number; 
    percentage: number;
  }>;
  /** Daily traffic source trend data */
  trafficSourceTrend?: Array<{ 
    date: string; 
    direct: number; 
    organic: number; 
    paid: number; 
    social: number; 
    email: number; 
    referral: number;
  }>;

  // ============================================================================
  // PAGE DATA
  // ============================================================================
  
  /** Top page performance metrics */
  topPages?: Array<{ 
    page: string; 
    visits: number; 
    bounce_rate: number; 
    conversations: number;
  }>;
  /** Overall page engagement metrics */
  pageEngagement?: { 
    bounceRate: number; 
    avgPagesPerSession: number; 
    totalSessions: number; 
    overallCVR: number;
  };
  /** Page depth distribution */
  pageDepthDistribution?: Array<{ 
    depth: string; 
    count: number; 
    percentage: number;
  }>;

  // ============================================================================
  // GEOGRAPHY DATA
  // ============================================================================
  
  /** Visitor geographic distribution */
  visitorLocations?: Array<{ 
    country: string; 
    visitors: number; 
    percentage: number;
  }>;
  /** City-level visitor data */
  visitorCities?: Array<{
    city: string;
    country: string;
    visitors: number;
  }>;

  // ============================================================================
  // USAGE & PERFORMANCE DATA
  // ============================================================================
  
  /** Usage metrics over time */
  usageMetrics?: Array<{
    date: string;
    conversations: number;
    messages: number;
    api_calls: number;
  }>;
  /** Agent performance breakdown */
  agentPerformance?: Array<{
    agent_name: string;
    total_conversations: number;
    avg_response_time: number;
    satisfaction_score: number;
  }>;
}

/**
 * PDF report configuration options
 * Controls which sections and visualizations are included
 * 
 * Note: This should stay synchronized with ReportConfig in BuildReportSheet.tsx
 */
export interface PDFConfig {
  // ============================================================================
  // REPORT SETTINGS
  // ============================================================================
  
  /** Report type determining level of detail */
  type?: ReportType;
  /** Data grouping interval */
  grouping?: ReportGrouping;

  // ============================================================================
  // GLOBAL TOGGLES
  // ============================================================================
  
  /** Include key performance indicator cards */
  includeKPIs?: boolean;
  /** Include chart visualizations */
  includeCharts?: boolean;
  /** Include data tables */
  includeTables?: boolean;

  // ============================================================================
  // CONVERSATION SECTION
  // ============================================================================
  
  /** Include conversations section */
  includeConversations?: boolean;
  /** Include conversation funnel visualization */
  includeConversationFunnel?: boolean;
  /** Include peak activity metrics */
  includePeakActivity?: boolean;

  // ============================================================================
  // LEADS SECTION
  // ============================================================================
  
  /** Include leads section */
  includeLeads?: boolean;
  /** Include lead source breakdown */
  includeLeadSourceBreakdown?: boolean;
  /** Include lead conversion trend */
  includeLeadConversionTrend?: boolean;

  // ============================================================================
  // BOOKINGS SECTION
  // ============================================================================
  
  /** Include bookings section */
  includeBookings?: boolean;
  /** Include booking trend chart */
  includeBookingTrend?: boolean;

  // ============================================================================
  // SATISFACTION SECTION
  // ============================================================================
  
  /** Include satisfaction metrics */
  includeSatisfaction?: boolean;
  /** Include CSAT distribution chart */
  includeCSATDistribution?: boolean;
  /** Include customer feedback section */
  includeCustomerFeedback?: boolean;

  // ============================================================================
  // AI PERFORMANCE SECTION
  // ============================================================================
  
  /** Include AI performance metrics */
  includeAIPerformance?: boolean;
  /** Include AI performance trend over time */
  includeAIPerformanceTrend?: boolean;

  // ============================================================================
  // TRAFFIC SECTION
  // ============================================================================
  
  /** Include traffic sources */
  includeTrafficSources?: boolean;
  /** Include traffic source trend */
  includeTrafficSourceTrend?: boolean;

  // ============================================================================
  // PAGES SECTION
  // ============================================================================
  
  /** Include top pages analysis */
  includeTopPages?: boolean;
  /** Include page engagement metrics */
  includePageEngagement?: boolean;
  /** Include page depth distribution */
  includePageDepth?: boolean;

  // ============================================================================
  // GEOGRAPHY SECTION
  // ============================================================================
  
  /** Include visitor location data */
  includeVisitorLocations?: boolean;
  /** Include city-level data */
  includeVisitorCities?: boolean;

  // ============================================================================
  // USAGE & PERFORMANCE SECTION
  // ============================================================================
  
  /** Include usage metrics (conversations, messages, API calls) */
  includeUsageMetrics?: boolean;
  /** Include agent performance breakdown */
  includeAgentPerformance?: boolean;
}

/**
 * Maximum row limits for PDF tables to prevent overflow
 */
export const PDF_TABLE_LIMITS = {
  /** Max rows for standard tables */
  DEFAULT: 20,
  /** Max rows for feedback/comments */
  FEEDBACK: 10,
  /** Max data points for charts */
  CHART_POINTS: 30,
  /** Max items for pie/donut charts */
  PIE_SEGMENTS: 8,
} as const;
