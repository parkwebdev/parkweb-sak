/**
 * PDF Report Types
 * 
 * Type definitions for PDF report generation.
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
 * PDF data structure containing all possible report data
 */
export interface PDFData {
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
  /** Customer satisfaction statistics */
  satisfactionStats?: { 
    average_rating: number; 
    total_ratings: number; 
    distribution?: Array<{ 
      rating: number; 
      count: number;
    }>;
  };
  /** Recent customer feedback entries */
  recentFeedback?: Array<{ 
    rating: number; 
    feedback: string | null; 
    createdAt: string; 
    triggerType: string;
  }>;
  /** AI agent performance metrics */
  aiPerformanceStats?: { 
    containment_rate: number; 
    resolution_rate: number; 
    ai_handled: number; 
    human_takeover: number; 
    total_conversations: number;
  };
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
  /** Visitor geographic distribution */
  visitorLocations?: Array<{ 
    country: string; 
    visitors: number; 
    percentage: number;
  }>;
}

/**
 * PDF report configuration options
 * Controls which sections and visualizations are included
 */
export interface PDFConfig {
  /** Include key performance indicator cards */
  includeKPIs?: boolean;
  /** Include chart visualizations */
  includeCharts?: boolean;
  /** Include data tables */
  includeTables?: boolean;
  /** Include conversations section */
  includeConversations?: boolean;
  /** Include conversation funnel visualization */
  includeConversationFunnel?: boolean;
  /** Include peak activity metrics */
  includePeakActivity?: boolean;
  /** Include leads section */
  includeLeads?: boolean;
  /** Include lead source breakdown */
  includeLeadSourceBreakdown?: boolean;
  /** Include lead conversion trend */
  includeLeadConversionTrend?: boolean;
  /** Include bookings section */
  includeBookings?: boolean;
  /** Include booking trend chart */
  includeBookingTrend?: boolean;
  /** Include satisfaction metrics */
  includeSatisfaction?: boolean;
  /** Include customer feedback section */
  includeCustomerFeedback?: boolean;
  /** Include AI performance metrics */
  includeAIPerformance?: boolean;
  /** Include traffic sources */
  includeTrafficSources?: boolean;
  /** Include traffic source trend */
  includeTrafficSourceTrend?: boolean;
  /** Include top pages analysis */
  includeTopPages?: boolean;
  /** Include page engagement metrics */
  includePageEngagement?: boolean;
  /** Include page depth distribution */
  includePageDepth?: boolean;
  /** Include visitor location data */
  includeVisitorLocations?: boolean;
  /** Report type determining level of detail */
  type?: ReportType;
}
