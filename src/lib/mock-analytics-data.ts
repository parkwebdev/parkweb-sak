/**
 * Mock Analytics Data Generators
 * 
 * Provides realistic test data for analytics visualization.
 * Used when mock mode is enabled via localStorage or dev toggle.
 * 
 * @module lib/mock-analytics-data
 */

import { subDays, format } from 'date-fns';
import type {
  LocationBookingData,
  BookingStatusData,
  BookingTrendData,
  BookingStats,
  RatingDistribution,
  SatisfactionTrendData,
  FeedbackItem,
  SatisfactionStats,
  AIPerformanceStats,
  AIPerformanceTrendData,
  SparklineDataPoint,
  RatingValue,
  TriggerType,
} from '@/types/analytics';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Generate random number between min and max (inclusive) */
const randomBetween = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Generate random float between min and max with decimal precision */
const randomFloat = (min: number, max: number, decimals: number = 2): number => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

/** Generate array of dates for the last N days */
const generateDateRange = (days: number): string[] => {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return dates;
};

// =============================================================================
// KPI TREND GENERATORS
// =============================================================================

/** Generate conversation trend data for sparkline charts */
export const generateConversationTrend = (days: number = 30): SparklineDataPoint[] => {
  const dates = generateDateRange(days);
  return dates.map((date, i) => {
    // Create realistic daily variance with upward trend
    const base = 35 + (i * 0.5);
    const variance = randomBetween(-15, 20);
    const weekendDip = [0, 6].includes(new Date(date).getDay()) ? -10 : 0;
    return {
      date,
      value: Math.max(10, Math.round(base + variance + weekendDip)),
    };
  });
};

/** Generate lead trend data for sparkline charts */
export const generateLeadTrend = (days: number = 30): SparklineDataPoint[] => {
  const dates = generateDateRange(days);
  return dates.map((date, i) => {
    const base = 12 + (i * 0.3);
    const variance = randomBetween(-5, 8);
    return {
      date,
      value: Math.max(3, Math.round(base + variance)),
    };
  });
};

/** Generate booking trend data for sparkline charts */
export const generateBookingTrendSparkline = (days: number = 30): SparklineDataPoint[] => {
  const dates = generateDateRange(days);
  return dates.map((date, i) => {
    const base = 8 + (i * 0.2);
    const variance = randomBetween(-3, 5);
    return {
      date,
      value: Math.max(2, Math.round(base + variance)),
    };
  });
};

/** Generate satisfaction trend data for sparkline charts */
export const generateSatisfactionTrendSparkline = (days: number = 30): SparklineDataPoint[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => ({
    date,
    value: randomFloat(3.8, 4.9, 1),
  }));
};

/** Generate containment trend data for sparkline charts */
export const generateContainmentTrendSparkline = (days: number = 30): SparklineDataPoint[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => ({
    date,
    value: randomBetween(78, 94),
  }));
};

// =============================================================================
// CONVERSATION STATS GENERATOR
// =============================================================================

export interface MockConversationStat {
  date: string;
  total: number;
  active: number;
  closed: number;
  human_takeover: number;
}

/** Generate daily conversation statistics */
export const generateConversationStats = (days: number = 30): MockConversationStat[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => {
    const total = randomBetween(25, 85);
    const active = randomBetween(5, Math.floor(total * 0.3));
    const human_takeover = randomBetween(2, Math.floor(total * 0.15));
    const closed = total - active - human_takeover;
    return { date, total, active, closed, human_takeover };
  });
};

// =============================================================================
// LEAD STATS GENERATOR (Dynamic stage keys)
// =============================================================================

/** Lead stats with dynamic stage names as keys (index signature) */
export interface MockLeadStat {
  date: string;
  total: number;
  [stageName: string]: number | string;
}

/** Generate daily lead statistics with stage breakdown */
export const generateLeadStats = (days: number = 30): MockLeadStat[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => {
    const total = randomBetween(8, 35);
    const newLeads = randomBetween(3, Math.floor(total * 0.4));
    const contacted = randomBetween(2, Math.floor(total * 0.25));
    const qualified = randomBetween(1, Math.floor(total * 0.2));
    const won = randomBetween(0, Math.floor(total * 0.15));
    const lost = Math.max(0, total - newLeads - contacted - qualified - won);
    return { 
      date, 
      total, 
      new: newLeads, 
      contacted, 
      qualified, 
      won, 
      lost,
      converted: won,
    } as MockLeadStat;
  });
};

// =============================================================================
// BOOKING ANALYTICS GENERATORS
// =============================================================================

/** Generate booking data by location */
export const generateBookingsByLocation = (): LocationBookingData[] => {
  const locations = [
    { id: 'loc-1', name: 'Downtown Office' },
    { id: 'loc-2', name: 'Westside Branch' },
    { id: 'loc-3', name: 'Airport Location' },
    { id: 'loc-4', name: 'Virtual / Online' },
    { id: 'loc-5', name: 'Suburban Center' },
  ];

  return locations.map(loc => {
    const total = randomBetween(20, 65);
    const completed = Math.floor(total * randomFloat(0.7, 0.9));
    const cancelled = randomBetween(1, Math.floor(total * 0.12));
    const noShow = total - completed - cancelled;
    return {
      locationId: loc.id,
      locationName: loc.name,
      bookings: total,
      completed,
      cancelled,
      noShow: Math.max(0, noShow),
    };
  }).sort((a, b) => b.bookings - a.bookings);
};

/** Generate booking data by status */
export const generateBookingsByStatus = (): BookingStatusData[] => {
  const confirmed = randomBetween(30, 55);
  const completed = randomBetween(70, 110);
  const cancelled = randomBetween(8, 18);
  const noShow = randomBetween(5, 12);
  const total = confirmed + completed + cancelled + noShow;

  return [
    { status: 'completed', count: completed, percentage: Math.round((completed / total) * 100) },
    { status: 'confirmed', count: confirmed, percentage: Math.round((confirmed / total) * 100) },
    { status: 'cancelled', count: cancelled, percentage: Math.round((cancelled / total) * 100) },
    { status: 'no_show', count: noShow, percentage: Math.round((noShow / total) * 100) },
  ];
};

/** Generate booking trend data */
export const generateBookingTrend = (days: number = 30): BookingTrendData[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => {
    const confirmed = randomBetween(2, 8);
    const completed = randomBetween(3, 10);
    const cancelled = randomBetween(0, 2);
    const noShow = randomBetween(0, 1);
    return {
      date,
      confirmed,
      completed,
      cancelled,
      noShow,
      total: confirmed + completed + cancelled + noShow,
    };
  });
};

/** Generate complete booking stats */
export const generateBookingStats = (): BookingStats => {
  const byLocation = generateBookingsByLocation();
  const byStatus = generateBookingsByStatus();
  const trend = generateBookingTrend();
  
  const totalBookings = byStatus.reduce((sum, s) => sum + s.count, 0);
  const completed = byStatus.find(s => s.status === 'completed')?.count || 0;
  const cancelled = byStatus.find(s => s.status === 'cancelled')?.count || 0;
  const noShow = byStatus.find(s => s.status === 'no_show')?.count || 0;
  const showRate = Math.round((completed / (completed + cancelled + noShow)) * 100);

  return {
    totalBookings,
    showRate,
    byLocation,
    byStatus,
    trend,
  };
};

// =============================================================================
// SATISFACTION ANALYTICS GENERATORS
// =============================================================================

/** Generate satisfaction rating distribution */
export const generateSatisfactionDistribution = (): RatingDistribution[] => {
  const fiveStars = randomBetween(90, 140);
  const fourStars = randomBetween(50, 90);
  const threeStars = randomBetween(15, 35);
  const twoStars = randomBetween(5, 15);
  const oneStars = randomBetween(2, 8);
  const total = fiveStars + fourStars + threeStars + twoStars + oneStars;

  return [
    { rating: 5 as RatingValue, count: fiveStars, percentage: Math.round((fiveStars / total) * 100) },
    { rating: 4 as RatingValue, count: fourStars, percentage: Math.round((fourStars / total) * 100) },
    { rating: 3 as RatingValue, count: threeStars, percentage: Math.round((threeStars / total) * 100) },
    { rating: 2 as RatingValue, count: twoStars, percentage: Math.round((twoStars / total) * 100) },
    { rating: 1 as RatingValue, count: oneStars, percentage: Math.round((oneStars / total) * 100) },
  ];
};

/** Generate satisfaction trend data */
export const generateSatisfactionTrend = (days: number = 30): SatisfactionTrendData[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => ({
    date,
    avgRating: randomFloat(3.8, 4.8, 1),
    count: randomBetween(5, 25),
  }));
};

/** Generate recent feedback items */
export const generateRecentFeedback = (): FeedbackItem[] => {
  const feedbackTexts = [
    'The AI was incredibly helpful and resolved my issue quickly!',
    'Good experience overall, but took a bit longer than expected.',
    'Very satisfied with the support I received.',
    'The agent understood my question perfectly.',
    'Could have been more detailed in the response.',
    'Excellent service, will definitely recommend!',
    'Quick response time, very impressed.',
    'The AI handled my complex query well.',
  ];

  const triggerTypes: TriggerType[] = ['conversation_end', 'manual', 'escalation'];
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: `feedback-${i + 1}`,
    rating: randomBetween(1, 5) as RatingValue,
    feedback: i < feedbackTexts.length ? feedbackTexts[i % feedbackTexts.length] : null,
    createdAt: subDays(new Date(), randomBetween(0, 30)).toISOString(),
    triggerType: triggerTypes[i % triggerTypes.length],
    conversationId: `conv-${i + 1}`,
  }));
};

/** Generate complete satisfaction stats */
export const generateSatisfactionStats = (): SatisfactionStats => {
  const distribution = generateSatisfactionDistribution();
  const totalRatings = distribution.reduce((sum, d) => sum + d.count, 0);
  const weightedSum = distribution.reduce((sum, d) => sum + (d.rating * d.count), 0);
  const averageRating = parseFloat((weightedSum / totalRatings).toFixed(1));

  return {
    averageRating,
    totalRatings,
    distribution,
    trend: generateSatisfactionTrend(),
    recentFeedback: generateRecentFeedback(),
  };
};

// =============================================================================
// AI PERFORMANCE ANALYTICS GENERATORS
// =============================================================================

/** Generate AI performance stats */
export const generateAIPerformanceStats = (): AIPerformanceStats => {
  const totalConversations = randomBetween(900, 1500);
  const humanTakeover = randomBetween(80, 200);
  const aiHandled = totalConversations - humanTakeover;
  const closed = randomBetween(Math.floor(totalConversations * 0.65), Math.floor(totalConversations * 0.85));
  const active = totalConversations - closed - humanTakeover;

  return {
    containmentRate: Math.round((aiHandled / totalConversations) * 100),
    resolutionRate: Math.round((closed / totalConversations) * 100),
    totalConversations,
    aiHandled,
    humanTakeover,
    closed,
    active: Math.max(0, active),
  };
};

/** Generate AI performance trend data */
export const generateAIPerformanceTrend = (days: number = 30): AIPerformanceTrendData[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => ({
    date,
    containmentRate: randomBetween(80, 95),
    resolutionRate: randomBetween(68, 82),
    total: randomBetween(30, 60),
  }));
};

// =============================================================================
// TRAFFIC ANALYTICS GENERATORS (Match real interface types)
// =============================================================================

export interface MockTrafficSource {
  name: string;
  value: number;
  color: string;
}

export interface MockLandingPage {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
}

export interface MockPageVisit {
  url: string;
  totalVisits: number;
  totalDuration: number;
}

const TRAFFIC_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

/** Generate traffic source data */
export const generateTrafficSources = (): MockTrafficSource[] => [
  { name: 'Organic Search', value: randomBetween(800, 1400), color: TRAFFIC_COLORS[0] },
  { name: 'Direct', value: randomBetween(500, 900), color: TRAFFIC_COLORS[1] },
  { name: 'Social Media', value: randomBetween(300, 600), color: TRAFFIC_COLORS[2] },
  { name: 'Referral', value: randomBetween(200, 450), color: TRAFFIC_COLORS[3] },
  { name: 'Email', value: randomBetween(100, 300), color: TRAFFIC_COLORS[4] },
  { name: 'Paid Search', value: randomBetween(150, 350), color: TRAFFIC_COLORS[5] },
];

/** Generate landing page data */
export const generateLandingPages = (): MockLandingPage[] => [
  { url: '/', visits: randomBetween(1200, 2000), avgDuration: randomBetween(45, 120), conversions: randomBetween(80, 150) },
  { url: '/pricing', visits: randomBetween(600, 1000), avgDuration: randomBetween(90, 180), conversions: randomBetween(60, 120) },
  { url: '/features', visits: randomBetween(400, 800), avgDuration: randomBetween(60, 150), conversions: randomBetween(40, 90) },
  { url: '/about', visits: randomBetween(200, 500), avgDuration: randomBetween(40, 100), conversions: randomBetween(15, 40) },
  { url: '/contact', visits: randomBetween(300, 600), avgDuration: randomBetween(80, 200), conversions: randomBetween(50, 100) },
  { url: '/blog', visits: randomBetween(500, 900), avgDuration: randomBetween(120, 240), conversions: randomBetween(25, 60) },
];

/** Generate page visit data */
export const generatePageVisits = (): MockPageVisit[] => {
  const pages = ['/', '/pricing', '/features', '/contact', '/blog', '/about'];
  return pages.map(url => ({
    url,
    totalVisits: randomBetween(200, 2000),
    totalDuration: randomBetween(50000, 500000),
  }));
};

// =============================================================================
// USAGE METRICS GENERATOR (Match real UsageMetrics interface)
// =============================================================================

export interface MockUsageMetric {
  date: string;
  conversations: number;
  messages: number;
  api_calls: number;
}

/** Generate usage metrics data */
export const generateUsageMetrics = (days: number = 30): MockUsageMetric[] => {
  const dates = generateDateRange(days);
  return dates.map((date) => ({
    date,
    conversations: randomBetween(20, 80),
    messages: randomBetween(500, 2000),
    api_calls: randomBetween(100, 500),
  }));
};

// =============================================================================
// AGENT PERFORMANCE GENERATOR
// =============================================================================

export interface MockAgentPerformance {
  agentId: string;
  agentName: string;
  responseTime: number;
  satisfactionScore: number;
  conversationsHandled: number;
}

/** Generate agent performance data */
export const generateAgentPerformance = (): MockAgentPerformance[] => [
  {
    agentId: 'ari-main',
    agentName: 'Ari',
    responseTime: randomFloat(0.8, 2.5),
    satisfactionScore: randomFloat(4.2, 4.8),
    conversationsHandled: randomBetween(800, 1500),
  },
];

// =============================================================================
// LOCATION DATA GENERATOR (for Geography Map)
// =============================================================================

export interface MockLocationData {
  country: string;
  city?: string;
  lat: number;
  lng: number;
  count: number;
}

/** Generate mock visitor location data for geography map */
export const generateLocationData = (): MockLocationData[] => [
  { country: 'United States', city: 'New York', lat: 40.7128, lng: -74.0060, count: randomBetween(150, 350) },
  { country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278, count: randomBetween(80, 180) },
  { country: 'Germany', city: 'Berlin', lat: 52.5200, lng: 13.4050, count: randomBetween(60, 140) },
  { country: 'Canada', city: 'Toronto', lat: 43.6532, lng: -79.3832, count: randomBetween(50, 120) },
  { country: 'Australia', city: 'Sydney', lat: -33.8688, lng: 151.2093, count: randomBetween(40, 100) },
  { country: 'France', city: 'Paris', lat: 48.8566, lng: 2.3522, count: randomBetween(35, 90) },
  { country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503, count: randomBetween(30, 80) },
  { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lng: -46.6333, count: randomBetween(25, 70) },
];

// =============================================================================
// ENGAGEMENT METRICS GENERATOR
// =============================================================================

export interface MockEngagementMetrics {
  bounceRate: number;
  avgPagesPerSession: number;
  avgSessionDuration: number;
  totalSessions: number;
  totalLeads: number;
  overallCVR: number;
}

/** Generate engagement metrics for PageEngagementCard */
export const generateEngagementMetrics = (): MockEngagementMetrics => {
  const totalSessions = randomBetween(800, 2500);
  const totalLeads = randomBetween(80, 350);
  return {
    bounceRate: randomFloat(28, 52),
    avgPagesPerSession: randomFloat(1.8, 4.2),
    avgSessionDuration: randomBetween(45000, 180000), // 45s - 3min in ms
    totalSessions,
    totalLeads,
    overallCVR: (totalLeads / totalSessions) * 100,
  };
};

// =============================================================================
// DAILY SOURCE DATA GENERATOR (for TrafficSourceTrendChart)
// =============================================================================

export interface MockDailySourceData {
  date: string;
  direct: number;
  organic: number;
  paid: number;
  social: number;
  email: number;
  referral: number;
  total: number;
}

/** Generate daily traffic source breakdown for time-series charts */
export const generateSourcesByDate = (days: number = 30): MockDailySourceData[] => {
  const dates = generateDateRange(days);
  return dates.map((date, i) => {
    // Create realistic trends with some variance
    const baseMultiplier = 1 + (i * 0.02); // Slight upward trend
    const weekendDip = [0, 6].includes(new Date(date).getDay()) ? 0.7 : 1;
    
    const direct = Math.round(randomBetween(15, 40) * baseMultiplier * weekendDip);
    const organic = Math.round(randomBetween(25, 55) * baseMultiplier * weekendDip);
    const paid = Math.round(randomBetween(8, 25) * baseMultiplier * weekendDip);
    const social = Math.round(randomBetween(10, 30) * baseMultiplier * weekendDip);
    const email = Math.round(randomBetween(5, 18) * baseMultiplier * weekendDip);
    const referral = Math.round(randomBetween(8, 22) * baseMultiplier * weekendDip);
    
    return {
      date,
      direct,
      organic,
      paid,
      social,
      email,
      referral,
      total: direct + organic + paid + social + email + referral,
    };
  });
};

// =============================================================================
// PAGE DEPTH DISTRIBUTION GENERATOR (for PageDepthChart)
// =============================================================================

export interface MockPageDepthData {
  depth: string;
  count: number;
  percentage: number;
}

/** Generate page depth distribution for session depth visualization */
export const generatePageDepthDistribution = (): MockPageDepthData[] => {
  const totalSessions = randomBetween(800, 2000);
  
  // Realistic distribution: more bounces, decreasing as depth increases
  const bouncePercent = randomFloat(30, 45);
  const onePage = Math.round(totalSessions * (bouncePercent / 100));
  const twoPages = Math.round(totalSessions * randomFloat(0.18, 0.28));
  const threePages = Math.round(totalSessions * randomFloat(0.12, 0.18));
  const fourPages = Math.round(totalSessions * randomFloat(0.06, 0.12));
  const fivePlusPages = Math.max(0, totalSessions - onePage - twoPages - threePages - fourPages);
  
  const depths = [
    { depth: '1 page', count: onePage },
    { depth: '2 pages', count: twoPages },
    { depth: '3 pages', count: threePages },
    { depth: '4 pages', count: fourPages },
    { depth: '5+ pages', count: fivePlusPages },
  ];
  
  return depths.map(d => ({
    ...d,
    percentage: (d.count / totalSessions) * 100,
  }));
};

// =============================================================================
// LEAD SOURCE BREAKDOWN GENERATOR
// =============================================================================

export interface MockLeadSourceData {
  source: string;
  leads: number;
  sessions: number;
  cvr: number;
}

/** Generate leads by traffic source for LeadSourceBreakdownCard */
export const generateLeadsBySource = (): MockLeadSourceData[] => {
  const sources = [
    { source: 'organic', sessions: randomBetween(400, 800) },
    { source: 'direct', sessions: randomBetween(300, 600) },
    { source: 'social', sessions: randomBetween(150, 400) },
    { source: 'referral', sessions: randomBetween(100, 300) },
    { source: 'email', sessions: randomBetween(80, 200) },
    { source: 'paid', sessions: randomBetween(120, 350) },
  ];
  
  return sources.map(({ source, sessions }) => {
    // Realistic CVR ranges: organic/referral tend to convert better
    const cvrMultiplier = ['organic', 'referral', 'email'].includes(source) 
      ? randomFloat(0.12, 0.22) 
      : randomFloat(0.06, 0.15);
    const leads = Math.round(sessions * cvrMultiplier);
    
    return {
      source,
      leads,
      sessions,
      cvr: (leads / sessions) * 100,
    };
  }).sort((a, b) => b.leads - a.leads);
};

// =============================================================================
// CONVERSATION FUNNEL GENERATOR
// =============================================================================

export interface MockFunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropOffPercent: number;
  color: string;
}

const FUNNEL_COLORS = {
  started: 'hsl(220, 90%, 56%)',
  engaged: 'hsl(200, 85%, 50%)',
  leadCaptured: 'hsl(160, 80%, 45%)',
  booked: 'hsl(142, 76%, 36%)',
  resolved: 'hsl(84, 60%, 45%)',
};

/** Generate conversation funnel stages with realistic drop-off */
export const generateConversationFunnel = (): MockFunnelStage[] => {
  const started = randomBetween(800, 1500);
  const engagedPercent = randomFloat(0.75, 0.92);
  const engaged = Math.floor(started * engagedPercent);
  const leadCapturedPercent = randomFloat(0.35, 0.55);
  const leadCaptured = Math.floor(started * leadCapturedPercent);
  const bookedPercent = randomFloat(0.15, 0.30);
  const booked = Math.floor(started * bookedPercent);
  const resolvedPercent = randomFloat(0.55, 0.75);
  const resolved = Math.floor(started * resolvedPercent);

  return [
    { 
      name: 'Started', 
      count: started, 
      percentage: 100, 
      dropOffPercent: 0, 
      color: FUNNEL_COLORS.started 
    },
    { 
      name: 'Engaged', 
      count: engaged, 
      percentage: Math.round((engaged / started) * 100), 
      dropOffPercent: Math.round(((started - engaged) / started) * 100), 
      color: FUNNEL_COLORS.engaged 
    },
    { 
      name: 'Lead Captured', 
      count: leadCaptured, 
      percentage: Math.round((leadCaptured / started) * 100), 
      dropOffPercent: engaged > 0 ? Math.round(((engaged - leadCaptured) / engaged) * 100) : 0, 
      color: FUNNEL_COLORS.leadCaptured 
    },
    { 
      name: 'Booked', 
      count: booked, 
      percentage: Math.round((booked / started) * 100), 
      dropOffPercent: leadCaptured > 0 ? Math.round(((leadCaptured - booked) / leadCaptured) * 100) : 0, 
      color: FUNNEL_COLORS.booked 
    },
    { 
      name: 'Resolved', 
      count: resolved, 
      percentage: Math.round((resolved / started) * 100), 
      dropOffPercent: 0, 
      color: FUNNEL_COLORS.resolved 
    },
  ];
};
