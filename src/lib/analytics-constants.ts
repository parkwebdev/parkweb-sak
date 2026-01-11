/**
 * Analytics Constants
 * 
 * Shared constants for the Analytics page.
 * Extracted to reduce page complexity.
 * 
 * @module lib/analytics-constants
 */

import type { ReportConfig } from '@/types/report-config';
import type { AppPermission } from '@/types/team';

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

// =============================================================================
// ANALYTICS SECTION CONFIG (for Global Search)
// =============================================================================

export interface AnalyticsSectionConfig {
  id: AnalyticsSection;
  label: string;
  group: string;
  description: string;
  iconName: string;
  requiredPermission?: AppPermission;
}

/**
 * Configuration for each Analytics section.
 * Used by Global Search to navigate to specific sections.
 */
export const ANALYTICS_SECTION_CONFIG: readonly AnalyticsSectionConfig[] = [
  { id: 'conversations', label: 'Conversations', group: 'Engagement', description: 'Analyze chat sessions and engagement patterns', iconName: 'MessageChatCircle', requiredPermission: 'view_dashboard' },
  { id: 'leads', label: 'Leads', group: 'Engagement', description: 'Track lead generation and conversion metrics', iconName: 'Users01', requiredPermission: 'view_dashboard' },
  { id: 'bookings', label: 'Bookings', group: 'Performance', description: 'Monitor appointment scheduling performance', iconName: 'Calendar', requiredPermission: 'view_dashboard' },
  { id: 'ai-performance', label: 'Ari Performance', group: 'Performance', description: 'Measure containment, resolution, and satisfaction', iconName: 'Zap', requiredPermission: 'view_dashboard' },
  { id: 'sources', label: 'Traffic Sources', group: 'Traffic', description: 'Understand where your visitors come from', iconName: 'Share07', requiredPermission: 'view_dashboard' },
  { id: 'pages', label: 'Top Pages', group: 'Traffic', description: 'See which pages drive the most engagement', iconName: 'File02', requiredPermission: 'view_dashboard' },
  { id: 'geography', label: 'Geography', group: 'Traffic', description: 'View visitor locations around the world', iconName: 'Globe01', requiredPermission: 'view_dashboard' },
  { id: 'reports', label: 'Reports', group: 'Reporting', description: 'View export history and manage scheduled reports', iconName: 'BarChart01', requiredPermission: 'view_dashboard' },
];
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
