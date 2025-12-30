/**
 * useAnalyticsData Hook
 * 
 * Consolidated data hook for the Analytics page.
 * Combines all analytics data fetching, mock mode switching,
 * KPI calculations, and trend values into a single hook.
 * 
 * @module hooks/useAnalyticsData
 */

import { useMemo, useCallback } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import { useSatisfactionAnalytics } from '@/hooks/useSatisfactionAnalytics';
import { useAIPerformanceAnalytics } from '@/hooks/useAIPerformanceAnalytics';
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';
import { useConversationFunnel } from '@/hooks/useConversationFunnel';
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData';
import { generateChartData } from '@/lib/analytics-utils';
import type { BookingStats, SatisfactionStats, AIPerformanceStats, LeadSourceData } from '@/types/analytics';
import type { MockTrafficSource, MockLandingPage, MockLocationData, MockFunnelStage, MockEngagementMetrics, MockDailySourceData, MockPageDepthData } from '@/lib/mock-analytics-data';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsFilters {
  leadStatus: string;
  conversationStatus: string;
}

export interface UseAnalyticsDataOptions {
  startDate: Date;
  endDate: Date;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
  comparisonMode: boolean;
  filters: AnalyticsFilters;
}

export interface ConversationStatItem {
  date: string;
  total: number;
  active: number;
  closed: number;
}

export interface AgentPerformanceItem {
  agent_id: string;
  agent_name: string;
  total_conversations: number;
  avg_response_time: number;
  satisfaction_score: number;
}

export interface UsageMetricItem {
  date: string;
  conversations: number;
  messages: number;
  api_calls: number;
}

export interface PageVisitItem {
  url: string;
  totalVisits: number;
  totalDuration: number;
}

export interface AIPerformanceTrendItem {
  date: string;
  containmentRate: number;
  resolutionRate: number;
  total: number;
}

export interface UseAnalyticsDataReturn {
  // === Raw Data ===
  conversationStats: ConversationStatItem[];
  leadStats: Array<{ date: string; total: number; [key: string]: string | number }>;
  agentPerformance: AgentPerformanceItem[];
  usageMetrics: UsageMetricItem[];
  
  // === Business Outcome Stats ===
  bookingStats: BookingStats | null;
  satisfactionStats: SatisfactionStats | null;
  aiPerformanceStats: AIPerformanceStats | null;
  
  // === AI Performance Trend (for PDF export) ===
  aiPerformanceTrend: AIPerformanceTrendItem[];
  
  // === Traffic Data ===
  trafficSources: MockTrafficSource[];
  landingPages: MockLandingPage[];
  pageVisits: PageVisitItem[];
  locationData: MockLocationData[];
  engagement: MockEngagementMetrics | null;
  sourcesByDate: MockDailySourceData[];
  pageDepthDistribution: MockPageDepthData[];
  leadsBySource: LeadSourceData[];
  
  // === Funnel Data ===
  funnelStages: MockFunnelStage[];
  
  // === Comparison Data ===
  comparisonConversationStats: ConversationStatItem[];
  comparisonLeadStats: Array<{ date: string; total: number; [key: string]: string | number }>;
  comparisonUsageMetrics: UsageMetricItem[];
  comparisonTrafficSources: MockTrafficSource[];
  
  // === Calculated KPIs ===
  totalConversations: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: string;
  totalMessages: number;
  totalBookings: number;
  avgSatisfaction: number;
  containmentRate: number;
  
  // === Comparison KPIs ===
  comparisonTotalConversations: number;
  comparisonTotalLeads: number;
  comparisonConversionRate: string;
  comparisonTotalMessages: number;
  
  // === Trend Arrays (for sparklines) ===
  conversationTrend: number[];
  leadTrend: number[];
  conversionTrend: number[];
  bookingTrend: number[];
  satisfactionTrend: number[];
  containmentTrend: number[];
  
  // === Trend Values (percentage changes) ===
  conversationTrendValue: number;
  leadTrendValue: number;
  bookingTrendValue: number;
  satisfactionTrendValue: number;
  aiContainmentTrendValue: number;
  
  // === Chart Data (processed) ===
  conversationChartData: { value: number }[];
  leadChartData: { value: number }[];
  conversionChartData: { value: number }[];
  bookingChartData: { value: number }[];
  
  // === Original data for exports ===
  analyticsConversations: unknown[];
  leads: unknown[];
  
  // === Loading States ===
  loading: boolean;
  bookingLoading: boolean;
  satisfactionLoading: boolean;
  aiPerformanceLoading: boolean;
  trafficLoading: boolean;
  funnelLoading: boolean;
  comparisonTrafficLoading: boolean;
  
  // === Actions ===
  refetch: () => void;
  
  // === Mock Mode ===
  mockMode: boolean;
  setMockMode: (enabled: boolean) => void;
  regenerateMockData: () => void;
  
  // === Calculation Utilities ===
  calculatePeriodChange: (trend: number[]) => number;
  calculatePointChange: (trend: number[]) => number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useAnalyticsData = (options: UseAnalyticsDataOptions): UseAnalyticsDataReturn => {
  const {
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
    comparisonMode,
    filters,
  } = options;

  // === Mock Data Mode ===
  const {
    enabled: mockMode,
    setEnabled: setMockMode,
    mockData,
    regenerate: regenerateMockData,
  } = useMockAnalyticsData();

  // Skip real data fetching when mock mode is enabled
  const shouldFetchRealData = !mockMode;

  // === Core Analytics Data ===
  const {
    conversationStats: realConversationStats,
    leadStats: realLeadStats,
    agentPerformance,
    usageMetrics: realUsageMetrics,
    bookingTrend: bookingTrendRaw,
    satisfactionTrend: satisfactionTrendRaw,
    containmentTrend: containmentTrendRaw,
    conversations: analyticsConversations,
    leads,
    loading,
    refetch,
  } = useAnalytics(startDate, endDate, filters, shouldFetchRealData);

  // === Booking Analytics ===
  const {
    stats: realBookingStats,
    loading: bookingLoading,
  } = useBookingAnalytics(startDate, endDate, shouldFetchRealData);

  // === Satisfaction Analytics ===
  const {
    stats: realSatisfactionStats,
    loading: satisfactionLoading,
  } = useSatisfactionAnalytics(startDate, endDate, shouldFetchRealData);

  // === AI Performance Analytics ===
  const {
    stats: realAIPerformanceStats,
    trend: realAIPerformanceTrend,
    loading: aiPerformanceLoading,
  } = useAIPerformanceAnalytics(startDate, endDate, shouldFetchRealData);

  // === Traffic Analytics ===
  const {
    trafficSources: realTrafficSources,
    landingPages: realLandingPages,
    pageVisits: realPageVisits,
    locationData: realLocationData,
    engagement: realEngagement,
    sourcesByDate: realSourcesByDate,
    pageDepthDistribution: realPageDepthDistribution,
    leadsBySource: realLeadsBySource,
    loading: trafficLoading,
  } = useTrafficAnalytics(startDate, endDate, shouldFetchRealData);

  // === Conversation Funnel ===
  const {
    stages: realFunnelStages,
    loading: funnelLoading,
  } = useConversationFunnel(startDate, endDate, shouldFetchRealData);

  // === Comparison Traffic Analytics ===
  const {
    trafficSources: comparisonTrafficSources,
    loading: comparisonTrafficLoading,
  } = useTrafficAnalytics(comparisonStartDate, comparisonEndDate, comparisonMode && shouldFetchRealData);

  // === Comparison Core Data ===
  const comparisonData = useAnalytics(
    comparisonStartDate,
    comparisonEndDate,
    filters,
    comparisonMode && shouldFetchRealData
  );

  // ============================================================================
  // MOCK/REAL DATA SWITCHING (14 fields)
  // ============================================================================

  const conversationStats = useMemo(() => {
    const stats = mockMode && mockData ? mockData.conversationStats : realConversationStats;
    return stats.map(s => ({ date: s.date, total: s.total, active: s.active, closed: s.closed }));
  }, [mockMode, mockData, realConversationStats]);

  const leadStats = useMemo(() => {
    return mockMode && mockData ? mockData.leadStats : realLeadStats;
  }, [mockMode, mockData, realLeadStats]);

  const usageMetrics = useMemo(() => {
    return mockMode && mockData ? mockData.usageMetrics : realUsageMetrics;
  }, [mockMode, mockData, realUsageMetrics]);

  const bookingStats = useMemo(() => {
    return mockMode && mockData ? mockData.bookingStats : realBookingStats;
  }, [mockMode, mockData, realBookingStats]);

  const satisfactionStats = useMemo(() => {
    return mockMode && mockData ? mockData.satisfactionStats : realSatisfactionStats;
  }, [mockMode, mockData, realSatisfactionStats]);

  const aiPerformanceStats = useMemo(() => {
    return mockMode && mockData ? mockData.aiPerformanceStats : realAIPerformanceStats;
  }, [mockMode, mockData, realAIPerformanceStats]);

  const aiPerformanceTrend = useMemo(() => {
    if (mockMode && mockData?.aiPerformanceTrend) {
      return mockData.aiPerformanceTrend;
    }
    return realAIPerformanceTrend || [];
  }, [mockMode, mockData, realAIPerformanceTrend]);

  const trafficSources = useMemo(() => {
    return mockMode && mockData ? mockData.trafficSources : realTrafficSources;
  }, [mockMode, mockData, realTrafficSources]);

  const landingPages = useMemo(() => {
    return mockMode && mockData ? mockData.landingPages : realLandingPages;
  }, [mockMode, mockData, realLandingPages]);

  const pageVisits = useMemo(() => {
    return mockMode && mockData ? mockData.pageVisits : realPageVisits;
  }, [mockMode, mockData, realPageVisits]);

  const locationData = useMemo(() => {
    return mockMode && mockData ? mockData.locationData : realLocationData;
  }, [mockMode, mockData, realLocationData]);

  const engagement = useMemo(() => {
    return mockMode && mockData?.engagement ? mockData.engagement : realEngagement;
  }, [mockMode, mockData, realEngagement]);

  const sourcesByDate = useMemo(() => {
    return mockMode && mockData?.sourcesByDate ? mockData.sourcesByDate : realSourcesByDate;
  }, [mockMode, mockData, realSourcesByDate]);

  const pageDepthDistribution = useMemo(() => {
    return mockMode && mockData?.pageDepthDistribution ? mockData.pageDepthDistribution : realPageDepthDistribution;
  }, [mockMode, mockData, realPageDepthDistribution]);

  const leadsBySource = useMemo(() => {
    return mockMode && mockData?.leadsBySource ? mockData.leadsBySource : realLeadsBySource;
  }, [mockMode, mockData, realLeadsBySource]);

  const funnelStages = useMemo(() => {
    return mockMode && mockData ? mockData.funnelStages : realFunnelStages;
  }, [mockMode, mockData, realFunnelStages]);

  // ============================================================================
  // KPI CALCULATIONS
  // ============================================================================

  const totalConversations = useMemo(() => {
    return conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  }, [conversationStats]);

  const totalLeads = useMemo(() => {
    return leadStats.reduce((sum, stat) => sum + stat.total, 0);
  }, [leadStats]);

  const convertedLeads = useMemo(() => {
    return leadStats.reduce((sum, stat) => {
      const converted = (stat.converted as number) || (stat.won as number) || 0;
      return sum + converted;
    }, 0);
  }, [leadStats]);

  const conversionRate = useMemo(() => {
    return totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  }, [totalLeads, convertedLeads]);

  const totalMessages = useMemo(() => {
    return usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);
  }, [usageMetrics]);

  // Comparison KPIs
  const comparisonTotalConversations = useMemo(() => {
    return comparisonData.conversationStats.reduce((sum, stat) => sum + stat.total, 0);
  }, [comparisonData.conversationStats]);

  const comparisonTotalLeads = useMemo(() => {
    return comparisonData.leadStats.reduce((sum, stat) => sum + stat.total, 0);
  }, [comparisonData.leadStats]);

  const comparisonConvertedLeads = useMemo(() => {
    return comparisonData.leadStats.reduce((sum, stat) => {
      const converted = (stat.converted as number) || (stat.won as number) || 0;
      return sum + converted;
    }, 0);
  }, [comparisonData.leadStats]);

  const comparisonConversionRate = useMemo(() => {
    return comparisonTotalLeads > 0 ? ((comparisonConvertedLeads / comparisonTotalLeads) * 100).toFixed(1) : '0';
  }, [comparisonTotalLeads, comparisonConvertedLeads]);

  const comparisonTotalMessages = useMemo(() => {
    return comparisonData.usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);
  }, [comparisonData.usageMetrics]);

  // Business outcome KPIs
  const totalBookings = bookingStats?.totalBookings ?? 0;
  const avgSatisfaction = satisfactionStats?.averageRating ?? 0;
  const containmentRate = aiPerformanceStats?.containmentRate ?? 0;

  // ============================================================================
  // TREND ARRAYS (for sparklines)
  // ============================================================================

  const conversationTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.conversationTrend.map(d => d.value);
    }
    return realConversationStats.map(stat => stat.total);
  }, [mockMode, mockData, realConversationStats]);

  const leadTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.leadTrend.map(d => d.value);
    }
    return realLeadStats.map(stat => stat.total);
  }, [mockMode, mockData, realLeadStats]);

  const conversionTrend = useMemo(() => {
    const stats = mockMode && mockData ? mockData.leadStats : realLeadStats;
    return stats.map(stat => {
      const converted = (stat.converted as number) || (stat.won as number) || 0;
      return stat.total > 0 ? (converted / stat.total) * 100 : 0;
    });
  }, [mockMode, mockData, realLeadStats]);

  const bookingTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.bookingTrend.map(d => d.value);
    }
    return bookingTrendRaw.map(d => d.value);
  }, [mockMode, mockData, bookingTrendRaw]);

  const satisfactionTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.satisfactionTrend.map(d => d.value);
    }
    return satisfactionTrendRaw.map(d => d.value);
  }, [mockMode, mockData, satisfactionTrendRaw]);

  const containmentTrend = useMemo(() => {
    if (mockMode && mockData) {
      return mockData.containmentTrend.map(d => d.value);
    }
    return containmentTrendRaw.map(d => d.value);
  }, [mockMode, mockData, containmentTrendRaw]);

  // ============================================================================
  // TREND CALCULATION UTILITIES
  // ============================================================================

  /**
   * Calculate percentage change between two halves of a trend.
   * Compares average of second half to average of first half.
   */
  const calculatePeriodChange = useCallback((trend: number[]): number => {
    if (trend.length < 4) return 0;
    
    const midpoint = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, midpoint);
    const secondHalf = trend.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }, []);

  /**
   * Calculate point change for rate/percentage metrics.
   * Returns absolute difference instead of percentage change.
   */
  const calculatePointChange = useCallback((trend: number[]): number => {
    if (trend.length < 4) return 0;
    
    const midpoint = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, midpoint);
    const secondHalf = trend.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }, []);

  // ============================================================================
  // TREND VALUES (for display)
  // ============================================================================

  const conversationTrendValue = useMemo(() => 
    calculatePeriodChange(conversationTrend), 
    [conversationTrend, calculatePeriodChange]
  );

  const leadTrendValue = useMemo(() => 
    calculatePeriodChange(leadTrend), 
    [leadTrend, calculatePeriodChange]
  );

  const bookingTrendValue = useMemo(() => 
    calculatePeriodChange(bookingTrend), 
    [bookingTrend, calculatePeriodChange]
  );

  const satisfactionTrendValue = useMemo(() => 
    calculatePointChange(satisfactionTrend), 
    [satisfactionTrend, calculatePointChange]
  );

  const aiContainmentTrendValue = useMemo(() => 
    calculatePointChange(containmentTrend), 
    [containmentTrend, calculatePointChange]
  );

  // ============================================================================
  // CHART DATA (processed for components)
  // ============================================================================

  const conversationChartData = useMemo(() => 
    generateChartData(conversationTrend), 
    [conversationTrend]
  );

  const leadChartData = useMemo(() => 
    generateChartData(leadTrend), 
    [leadTrend]
  );

  const conversionChartData = useMemo(() => 
    generateChartData(conversionTrend), 
    [conversionTrend]
  );

  const bookingChartData = useMemo(() => 
    generateChartData(bookingTrend), 
    [bookingTrend]
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Raw Data
    conversationStats,
    leadStats,
    agentPerformance,
    usageMetrics,
    
    // Business Outcome Stats
    bookingStats,
    satisfactionStats,
    aiPerformanceStats,
    
    // AI Performance Trend (for PDF export)
    aiPerformanceTrend,
    
    // Traffic Data
    trafficSources,
    landingPages,
    pageVisits,
    locationData,
    engagement,
    sourcesByDate,
    pageDepthDistribution,
    leadsBySource,
    
    // Funnel Data
    funnelStages,
    
    // Comparison Data
    comparisonConversationStats: comparisonData.conversationStats.map(s => ({
      date: s.date,
      total: s.total,
      active: s.active,
      closed: s.closed,
    })),
    comparisonLeadStats: comparisonData.leadStats,
    comparisonUsageMetrics: comparisonData.usageMetrics.map(u => ({
      date: u.date,
      conversations: u.conversations,
      messages: u.messages,
      api_calls: u.api_calls,
    })),
    comparisonTrafficSources,
    
    // Calculated KPIs
    totalConversations,
    totalLeads,
    convertedLeads,
    conversionRate,
    totalMessages,
    totalBookings,
    avgSatisfaction,
    containmentRate,
    
    // Comparison KPIs
    comparisonTotalConversations,
    comparisonTotalLeads,
    comparisonConversionRate,
    comparisonTotalMessages,
    
    // Trend Arrays
    conversationTrend,
    leadTrend,
    conversionTrend,
    bookingTrend,
    satisfactionTrend,
    containmentTrend,
    
    // Trend Values
    conversationTrendValue,
    leadTrendValue,
    bookingTrendValue,
    satisfactionTrendValue,
    aiContainmentTrendValue,
    
    // Chart Data
    conversationChartData,
    leadChartData,
    conversionChartData,
    bookingChartData,
    
    // Original data for exports
    analyticsConversations,
    leads,
    
    // Loading States
    loading,
    bookingLoading,
    satisfactionLoading,
    aiPerformanceLoading,
    trafficLoading,
    funnelLoading,
    comparisonTrafficLoading,
    
    // Actions
    refetch,
    
    // Mock Mode
    mockMode,
    setMockMode,
    regenerateMockData,
    
    // Calculation Utilities
    calculatePeriodChange,
    calculatePointChange,
  };
};
