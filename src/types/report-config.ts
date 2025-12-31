/**
 * Report Configuration Types
 * 
 * Shared types for report building and export functionality.
 * Used by BuildReportSheet, ReportBuilder, and analytics export utilities.
 * 
 * @module types/report-config
 */

import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// =============================================================================
// REPORT CONFIGURATION
// =============================================================================

/**
 * Complete report configuration for CSV/PDF export.
 * Controls which data sections to include in generated reports.
 */
export interface ReportConfig {
  /** Output format */
  format: 'csv' | 'pdf';
  /** Report style/complexity level */
  type: 'summary' | 'detailed' | 'comparison';
  
  // Core Metrics
  includeConversations: boolean;
  includeLeads: boolean;
  includeUsageMetrics: boolean;
  includeConversationFunnel: boolean;
  includePeakActivity: boolean;
  
  // Business Outcomes
  includeBookings: boolean;
  includeBookingTrend: boolean;
  includeSatisfaction: boolean;
  includeCSATDistribution: boolean;
  includeCustomerFeedback: boolean;
  includeAIPerformance: boolean;
  includeAIPerformanceTrend: boolean;
  
  // Traffic Analytics
  includeTrafficSources: boolean;
  includeTrafficSourceTrend: boolean;
  includeTopPages: boolean;
  includePageEngagement: boolean;
  includePageDepth: boolean;
  includeVisitorLocations: boolean;
  includeVisitorCities: boolean;
  
  // Leads Analytics
  includeLeadSourceBreakdown: boolean;
  includeLeadConversionTrend: boolean;
  
  // Agent Data
  includeAgentPerformance: boolean;
  
  // Grouping & Export Options
  grouping: 'day' | 'week' | 'month';
  includeKPIs: boolean;
  includeCharts: boolean;
  includeTables: boolean;
}

// =============================================================================
// DATE PRESETS
// =============================================================================

/**
 * Available date preset values for report date range selection.
 */
export type DatePreset = 'today' | 'last7' | 'last30' | 'last60' | 'last90' | 'thisMonth' | 'lastMonth';

/**
 * Date preset configuration with display label.
 */
export interface DatePresetOption {
  value: DatePreset;
  label: string;
}

/**
 * Available date presets for report generation.
 */
export const DATE_PRESETS: DatePresetOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last60', label: 'Last 60 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

/**
 * Convert a date preset to a concrete date range.
 * @param preset - The date preset to convert
 * @returns Object with start and end dates
 */
export function getDateRangeFromPreset(preset: DatePreset): { start: Date; end: Date } {
  const today = new Date();
  
  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'last7':
      return { start: subDays(today, 7), end: today };
    case 'last30':
      return { start: subDays(today, 30), end: today };
    case 'last60':
      return { start: subDays(today, 60), end: today };
    case 'last90':
      return { start: subDays(today, 90), end: today };
    case 'thisMonth':
      return { start: startOfMonth(today), end: today };
    case 'lastMonth': {
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    default:
      return { start: subDays(today, 30), end: today };
  }
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default report configuration for new reports.
 */
export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  format: 'pdf',
  type: 'detailed',
  // Core Metrics
  includeConversations: true,
  includeLeads: true,
  includeUsageMetrics: false,
  includeConversationFunnel: false,
  includePeakActivity: false,
  // Business Outcomes
  includeBookings: true,
  includeBookingTrend: false,
  includeSatisfaction: true,
  includeCSATDistribution: false,
  includeCustomerFeedback: false,
  includeAIPerformance: true,
  includeAIPerformanceTrend: false,
  // Traffic Analytics
  includeTrafficSources: false,
  includeTrafficSourceTrend: false,
  includeTopPages: false,
  includePageEngagement: false,
  includePageDepth: false,
  includeVisitorLocations: false,
  includeVisitorCities: false,
  // Leads Analytics
  includeLeadSourceBreakdown: true,
  includeLeadConversionTrend: false,
  // Agent Data
  includeAgentPerformance: false,
  // Options
  grouping: 'day',
  includeKPIs: true,
  includeCharts: false,
  includeTables: true,
};
