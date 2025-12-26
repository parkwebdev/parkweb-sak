/**
 * Mock Analytics Data Generators
 * 
 * Provides realistic test data for analytics visualization.
 * Used when mock mode is enabled via localStorage or dev toggle.
 * 
 * @module lib/mock-analytics-data
 * @see docs/ANALYTICS_REDESIGN_PLAN.md
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

  return Array.from({ length: 8 }, (_, i) => ({
    id: `feedback-${i + 1}`,
    rating: randomBetween(3, 5),
    feedback: i < 5 ? feedbackTexts[i] : null,
    createdAt: subDays(new Date(), randomBetween(0, 14)).toISOString(),
    triggerType: i % 2 === 0 ? 'conversation_end' : 'manual',
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
