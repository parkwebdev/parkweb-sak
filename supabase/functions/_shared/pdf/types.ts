/**
 * PDF Report Types for Edge Functions
 * 
 * Ported from src/types/pdf.ts
 * Type definitions for PDF report generation.
 */

/**
 * Report type enum for PDF generation
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
  // KPI METRICS
  totalConversations?: number;
  conversationsChange?: number;
  totalLeads?: number;
  leadsChange?: number;
  conversionRate?: number;

  // CONVERSATION DATA
  conversationStats?: Array<{ 
    date: string; 
    total: number; 
    active: number; 
    closed: number;
  }>;
  conversationFunnel?: Array<{ 
    name: string; 
    count: number; 
    percentage: number; 
    dropOffPercent: number;
  }>;
  peakActivity?: { 
    peakDay: string; 
    peakTime: string; 
    peakValue: number;
  };

  // LEAD DATA
  leadStats?: Array<{ 
    date: string; 
    total: number;
  }>;
  leadSourceBreakdown?: Array<{ 
    source: string; 
    leads: number; 
    sessions: number; 
    cvr: number;
  }>;
  leadConversionTrend?: Array<{
    date: string;
    total: number;
    new?: number;
    contacted?: number;
    qualified?: number;
    won?: number;
    lost?: number;
  }>;

  // BOOKING DATA
  bookingStats?: Array<{ 
    location: string; 
    total: number; 
    confirmed: number; 
    completed: number; 
    no_show: number; 
    show_rate: number;
  }>;
  bookingTrend?: Array<{ 
    date: string; 
    confirmed: number; 
    completed: number; 
    cancelled: number; 
    noShow: number;
  }>;

  // SATISFACTION DATA
  satisfactionStats?: { 
    average_rating: number; 
    total_ratings: number; 
    distribution?: Array<{ 
      rating: number; 
      count: number;
    }>;
  };
  csatDistribution?: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  recentFeedback?: Array<{ 
    rating: number; 
    feedback: string | null; 
    createdAt: string; 
    triggerType: string;
  }>;

  // AI PERFORMANCE DATA
  aiPerformanceStats?: { 
    containment_rate: number; 
    resolution_rate: number; 
    ai_handled: number; 
    human_takeover: number; 
    total_conversations: number;
  };
  aiPerformanceTrend?: Array<{
    date: string;
    containment_rate: number;
    resolution_rate: number;
  }>;

  // TRAFFIC DATA
  trafficSources?: Array<{ 
    source: string; 
    visitors: number; 
    percentage: number;
  }>;
  trafficSourceTrend?: Array<{ 
    date: string; 
    direct: number; 
    organic: number; 
    paid: number; 
    social: number; 
    email: number; 
    referral: number;
  }>;

  // PAGE DATA
  topPages?: Array<{ 
    page: string; 
    visits: number; 
    bounce_rate: number; 
    conversations: number;
  }>;
  pageEngagement?: { 
    bounceRate: number; 
    avgPagesPerSession: number; 
    totalSessions: number; 
    overallCVR: number;
  };
  pageDepthDistribution?: Array<{ 
    depth: string; 
    count: number; 
    percentage: number;
  }>;

  // GEOGRAPHY DATA
  visitorLocations?: Array<{ 
    country: string; 
    visitors: number; 
    percentage: number;
  }>;
  visitorCities?: Array<{
    city: string;
    country: string;
    visitors: number;
  }>;

  // USAGE & PERFORMANCE DATA
  usageMetrics?: Array<{
    date: string;
    conversations: number;
    messages: number;
    api_calls: number;
  }>;
  agentPerformance?: Array<{
    agent_name: string;
    total_conversations: number;
    avg_response_time: number;
    satisfaction_score: number;
  }>;
}

/**
 * PDF report configuration options
 */
export interface PDFConfig {
  type?: ReportType;
  grouping?: ReportGrouping;
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
  includeCSATDistribution?: boolean;
  includeCustomerFeedback?: boolean;
  includeAIPerformance?: boolean;
  includeAIPerformanceTrend?: boolean;
  includeTrafficSources?: boolean;
  includeTrafficSourceTrend?: boolean;
  includeTopPages?: boolean;
  includePageEngagement?: boolean;
  includePageDepth?: boolean;
  includeVisitorLocations?: boolean;
  includeVisitorCities?: boolean;
  includeUsageMetrics?: boolean;
  includeAgentPerformance?: boolean;
}

/**
 * Maximum row limits for PDF tables
 */
export const PDF_TABLE_LIMITS = {
  DEFAULT: 20,
  FEEDBACK: 10,
  CHART_POINTS: 30,
  PIE_SEGMENTS: 8,
} as const;
