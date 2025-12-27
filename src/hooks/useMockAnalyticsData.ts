/**
 * Mock Analytics Data Hook
 * 
 * Provides toggleable mock data for analytics visualization.
 * Enable via localStorage key 'analytics_mock_mode' or dev toggle.
 * 
 * @hook
 */

import { useState, useEffect, useMemo } from 'react';
import {
  generateConversationTrend,
  generateLeadTrend,
  generateBookingTrendSparkline,
  generateSatisfactionTrendSparkline,
  generateContainmentTrendSparkline,
  generateConversationStats,
  generateLeadStats,
  generateBookingStats,
  generateSatisfactionStats,
  generateAIPerformanceStats,
  generateTrafficSources,
  generateLandingPages,
  generatePageVisits,
  generateUsageMetrics,
  generateAgentPerformance,
  generateLocationData,
  type MockConversationStat,
  type MockLeadStat,
  type MockTrafficSource,
  type MockLandingPage,
  type MockPageVisit,
  type MockUsageMetric,
  type MockAgentPerformance,
  type MockLocationData,
} from '@/lib/mock-analytics-data';
import type {
  BookingStats,
  SatisfactionStats,
  AIPerformanceStats,
  SparklineDataPoint,
} from '@/types/analytics';

const MOCK_MODE_KEY = 'analytics_mock_mode';

export interface MockAnalyticsData {
  // KPI Sparkline trends
  conversationTrend: SparklineDataPoint[];
  leadTrend: SparklineDataPoint[];
  bookingTrend: SparklineDataPoint[];
  satisfactionTrend: SparklineDataPoint[];
  containmentTrend: SparklineDataPoint[];
  
  // Core stats
  conversationStats: MockConversationStat[];
  leadStats: MockLeadStat[];
  
  // Business outcome stats
  bookingStats: BookingStats;
  satisfactionStats: SatisfactionStats;
  aiPerformanceStats: AIPerformanceStats;
  
  // Traffic data
  trafficSources: MockTrafficSource[];
  landingPages: MockLandingPage[];
  pageVisits: MockPageVisit[];
  
  // Usage & performance
  usageMetrics: MockUsageMetric[];
  agentPerformance: MockAgentPerformance[];
  
  // Location data for geography map
  locationData: MockLocationData[];
}

export interface UseMockAnalyticsDataReturn {
  /** Whether mock mode is enabled */
  enabled: boolean;
  /** Toggle mock mode on/off */
  setEnabled: (enabled: boolean) => void;
  /** All mock data (only populated when enabled) */
  mockData: MockAnalyticsData | null;
  /** Regenerate all mock data with new random values */
  regenerate: () => void;
}

/**
 * Hook for managing mock analytics data.
 * 
 * When enabled, returns comprehensive mock data for all analytics components.
 * State is persisted in localStorage.
 * 
 * @example
 * ```tsx
 * const { enabled, setEnabled, mockData } = useMockAnalyticsData();
 * 
 * // Use mockData.conversationStats instead of real data when enabled
 * const stats = enabled ? mockData?.conversationStats : realConversationStats;
 * ```
 */
export const useMockAnalyticsData = (): UseMockAnalyticsDataReturn => {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MOCK_MODE_KEY) === 'true';
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Persist to localStorage
  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    localStorage.setItem(MOCK_MODE_KEY, value.toString());
  };

  // Generate all mock data when enabled
  const mockData = useMemo<MockAnalyticsData | null>(() => {
    if (!enabled) return null;

    return {
      // KPI trends
      conversationTrend: generateConversationTrend(),
      leadTrend: generateLeadTrend(),
      bookingTrend: generateBookingTrendSparkline(),
      satisfactionTrend: generateSatisfactionTrendSparkline(),
      containmentTrend: generateContainmentTrendSparkline(),
      
      // Core stats
      conversationStats: generateConversationStats(),
      leadStats: generateLeadStats(),
      
      // Business outcomes
      bookingStats: generateBookingStats(),
      satisfactionStats: generateSatisfactionStats(),
      aiPerformanceStats: generateAIPerformanceStats(),
      
      // Traffic
      trafficSources: generateTrafficSources(),
      landingPages: generateLandingPages(),
      pageVisits: generatePageVisits(),
      
      // Usage
      usageMetrics: generateUsageMetrics(),
      agentPerformance: generateAgentPerformance(),
      
      // Location
      locationData: generateLocationData(),
    };
  }, [enabled, refreshKey]);

  const regenerate = () => {
    setRefreshKey(k => k + 1);
  };

  return {
    enabled,
    setEnabled,
    mockData,
    regenerate,
  };
};
