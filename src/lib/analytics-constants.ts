/**
 * Analytics Constants
 * 
 * Shared constants for the Analytics page.
 * Extracted to reduce page complexity.
 * 
 * @module lib/analytics-constants
 */

import type { ReportConfig } from '@/types/report-config';

// =============================================================================
// ANALYTICS SECTION TYPE
// =============================================================================

/**
 * Valid analytics section identifiers.
 * Used for tab navigation and section rendering.
 */
export const ANALYTICS_SECTIONS = [
  'conversations',
  'leads',
  'bookings',
  'ai-performance',
  'sources',
  'pages',
  'geography',
  'reports',
] as const;

export type AnalyticsSection = (typeof ANALYTICS_SECTIONS)[number];
/**
 * Section title and description mapping
 */
export const SECTION_INFO: Record<AnalyticsSection, { title: string; description: string }> = {
  'conversations': { title: 'Conversations', description: 'Analyze chat sessions and engagement patterns' },
  'leads': { title: 'Leads', description: 'Track lead generation and conversion metrics' },
  'bookings': { title: 'Bookings', description: 'Monitor appointment scheduling performance' },
  'ai-performance': { title: 'Ari Performance', description: 'Measure Ari containment, resolution, and satisfaction' },
  'sources': { title: 'Traffic Sources', description: 'Understand where your visitors come from' },
  'pages': { title: 'Top Pages', description: 'See which pages drive the most engagement' },
  'geography': { title: 'Geography', description: 'View visitor locations around the world' },
  'reports': { title: 'Reports', description: 'View export history and manage scheduled reports' },
};

/**
 * Sections that show the toolbar
 */
export const TOOLBAR_SECTIONS: AnalyticsSection[] = [
  'conversations', 
  'leads', 
  'bookings', 
  'ai-performance', 
  'sources', 
  'pages', 
  'geography'
];

/**
 * Default report configuration
 */
export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  format: 'csv',
  type: 'summary',
  // Core Metrics
  includeConversations: true,
  includeLeads: true,
  includeUsageMetrics: true,
  includeConversationFunnel: true,
  includePeakActivity: true,
  // Business Outcomes
  includeBookings: true,
  includeBookingTrend: true,
  includeSatisfaction: true,
  includeCSATDistribution: false,
  includeCustomerFeedback: true,
  includeAIPerformance: true,
  includeAIPerformanceTrend: false,
  // Traffic Analytics
  includeTrafficSources: true,
  includeTrafficSourceTrend: true,
  includeTopPages: true,
  includePageEngagement: true,
  includePageDepth: true,
  includeVisitorLocations: true,
  includeVisitorCities: false,
  // Leads Analytics
  includeLeadSourceBreakdown: true,
  includeLeadConversionTrend: true,
  // Agent Data
  includeAgentPerformance: true,
  // Options
  grouping: 'day',
  includeKPIs: true,
  includeCharts: true,
  includeTables: true,
};
