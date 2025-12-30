/**
 * Data Aggregation Utility
 * 
 * Aggregates daily time-series data into weekly or monthly buckets
 * for report generation with different grouping options.
 * 
 * @module lib/data-aggregation
 */
import { startOfWeek, startOfMonth, format, parseISO, isValid } from 'date-fns';
import type { PDFData, ReportGrouping } from '@/types/pdf';
import type { AnalyticsExportData } from '@/lib/analytics-export-data';

/**
 * Get the period key for a given date and grouping
 */
function getPeriodKey(dateStr: string, grouping: ReportGrouping): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  
  if (grouping === 'week') {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    return format(weekStart, 'yyyy-MM-dd');
  }
  
  if (grouping === 'month') {
    const monthStart = startOfMonth(date);
    return format(monthStart, 'yyyy-MM-dd');
  }
  
  return dateStr;
}

/**
 * Format a period key for display in charts/tables
 */
export function formatPeriodLabel(dateStr: string, grouping: ReportGrouping): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  
  if (grouping === 'week') {
    return `Week of ${format(date, 'MMM d')}`;
  }
  
  if (grouping === 'month') {
    return format(date, 'MMM yyyy');
  }
  
  return format(date, 'MMM d');
}

/**
 * Generic aggregation function for arrays with a date field
 * Sums numeric fields and uses first value for non-numeric fields
 */
function aggregateArray<T extends Record<string, unknown>>(
  data: T[] | undefined,
  grouping: ReportGrouping,
  dateKey: keyof T,
  sumFields: (keyof T)[],
  avgFields: (keyof T)[] = []
): T[] | undefined {
  if (!data || data.length === 0 || grouping === 'day') {
    return data;
  }

  const grouped = new Map<string, { items: T[]; sums: Record<string, number>; counts: Record<string, number> }>();

  for (const item of data) {
    const dateValue = item[dateKey];
    if (typeof dateValue !== 'string') continue;
    
    const periodKey = getPeriodKey(dateValue, grouping);
    
    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, { items: [], sums: {}, counts: {} });
    }
    
    const group = grouped.get(periodKey)!;
    group.items.push(item);
    
    // Accumulate sums
    for (const field of sumFields) {
      const value = item[field];
      if (typeof value === 'number') {
        group.sums[field as string] = (group.sums[field as string] || 0) + value;
      }
    }
    
    // Accumulate for averages
    for (const field of avgFields) {
      const value = item[field];
      if (typeof value === 'number') {
        group.sums[field as string] = (group.sums[field as string] || 0) + value;
        group.counts[field as string] = (group.counts[field as string] || 0) + 1;
      }
    }
  }

  const result: T[] = [];
  
  for (const [periodKey, group] of grouped.entries()) {
    const firstItem = group.items[0];
    const aggregated = { ...firstItem, [dateKey]: periodKey } as T;
    
    // Apply sums
    for (const field of sumFields) {
      if (field in group.sums) {
        (aggregated as Record<string, unknown>)[field as string] = group.sums[field as string];
      }
    }
    
    // Apply averages
    for (const field of avgFields) {
      if (field in group.sums && field in group.counts && group.counts[field as string] > 0) {
        (aggregated as Record<string, unknown>)[field as string] = 
          Math.round((group.sums[field as string] / group.counts[field as string]) * 10) / 10;
      }
    }
    
    result.push(aggregated);
  }

  // Sort by date
  return result.sort((a, b) => {
    const dateA = a[dateKey] as string;
    const dateB = b[dateKey] as string;
    return dateA.localeCompare(dateB);
  });
}

/**
 * Aggregate conversation stats by period
 */
function aggregateConversationStats(
  stats: PDFData['conversationStats'],
  grouping: ReportGrouping
): PDFData['conversationStats'] {
  return aggregateArray(
    stats,
    grouping,
    'date',
    ['total', 'active', 'closed']
  );
}

/**
 * Aggregate lead stats by period
 */
function aggregateLeadStats(
  stats: PDFData['leadStats'],
  grouping: ReportGrouping
): PDFData['leadStats'] {
  return aggregateArray(
    stats,
    grouping,
    'date',
    ['total']
  );
}

/**
 * Aggregate lead conversion trend by period
 */
function aggregateLeadConversionTrend(
  trend: PDFData['leadConversionTrend'],
  grouping: ReportGrouping
): PDFData['leadConversionTrend'] {
  return aggregateArray(
    trend,
    grouping,
    'date',
    ['total', 'new', 'contacted', 'qualified', 'won', 'lost']
  );
}

/**
 * Aggregate booking trend by period
 */
function aggregateBookingTrend(
  trend: PDFData['bookingTrend'],
  grouping: ReportGrouping
): PDFData['bookingTrend'] {
  return aggregateArray(
    trend,
    grouping,
    'date',
    ['confirmed', 'completed', 'cancelled', 'noShow']
  );
}

/**
 * Aggregate AI performance trend by period (uses averages for rates)
 */
function aggregateAIPerformanceTrend(
  trend: PDFData['aiPerformanceTrend'],
  grouping: ReportGrouping
): PDFData['aiPerformanceTrend'] {
  return aggregateArray(
    trend,
    grouping,
    'date',
    [], // No sums
    ['containment_rate', 'resolution_rate'] // Average these
  );
}

/**
 * Aggregate traffic source trend by period
 */
function aggregateTrafficSourceTrend(
  trend: PDFData['trafficSourceTrend'],
  grouping: ReportGrouping
): PDFData['trafficSourceTrend'] {
  return aggregateArray(
    trend,
    grouping,
    'date',
    ['direct', 'organic', 'paid', 'social', 'email', 'referral']
  );
}

/**
 * Aggregate usage metrics by period
 */
function aggregateUsageMetrics(
  metrics: PDFData['usageMetrics'],
  grouping: ReportGrouping
): PDFData['usageMetrics'] {
  return aggregateArray(
    metrics,
    grouping,
    'date',
    ['conversations', 'messages', 'api_calls']
  );
}

/**
 * Main entry point: Aggregate all time-series data in PDFData based on grouping
 */
export function aggregatePDFData(data: PDFData, grouping: ReportGrouping): PDFData {
  // If daily grouping, return unchanged
  if (grouping === 'day') {
    return data;
  }

  return {
    ...data,
    
    // Aggregate time-series data
    conversationStats: aggregateConversationStats(data.conversationStats, grouping),
    leadStats: aggregateLeadStats(data.leadStats, grouping),
    leadConversionTrend: aggregateLeadConversionTrend(data.leadConversionTrend, grouping),
    bookingTrend: aggregateBookingTrend(data.bookingTrend, grouping),
    aiPerformanceTrend: aggregateAIPerformanceTrend(data.aiPerformanceTrend, grouping),
    trafficSourceTrend: aggregateTrafficSourceTrend(data.trafficSourceTrend, grouping),
    usageMetrics: aggregateUsageMetrics(data.usageMetrics, grouping),
    
    // These are preserved unchanged (not time-series or already aggregated):
    // - KPIs (totalConversations, totalLeads, etc.)
    // - conversationFunnel
    // - peakActivity
    // - leadSourceBreakdown
    // - bookingStats (by location, not time)
    // - satisfactionStats, csatDistribution, recentFeedback
    // - aiPerformanceStats
    // - trafficSources
    // - topPages, pageEngagement, pageDepthDistribution
    // - visitorLocations, visitorCities
    // - agentPerformance
  };
}

/**
 * Aggregate AnalyticsExportData (for CSV exports) based on grouping
 */
export function aggregateAnalyticsExportData(
  data: AnalyticsExportData,
  grouping: ReportGrouping
): AnalyticsExportData {
  if (grouping === 'day') {
    return data;
  }

  // Get dynamic keys for leadStats (all keys except 'date')
  const leadStatsKeys = data.leadStats[0] 
    ? Object.keys(data.leadStats[0]).filter(k => k !== 'date')
    : ['total'];

  // Get dynamic keys for leadConversionTrend
  const leadConversionKeys = data.leadConversionTrend?.[0]
    ? Object.keys(data.leadConversionTrend[0]).filter(k => k !== 'date')
    : [];

  return {
    ...data,
    
    // Aggregate time-series data (cast through unknown to handle generic function)
    conversationStats: aggregateArray(
      data.conversationStats as unknown as Record<string, unknown>[],
      grouping,
      'date',
      ['total', 'active', 'closed']
    ) as unknown as typeof data.conversationStats || [],
    
    leadStats: aggregateArray(
      data.leadStats as unknown as Record<string, unknown>[],
      grouping,
      'date',
      leadStatsKeys
    ) as unknown as typeof data.leadStats || [],
    
    usageMetrics: aggregateArray(
      data.usageMetrics as unknown as Record<string, unknown>[],
      grouping,
      'date',
      ['conversations', 'messages', 'api_calls']
    ) as unknown as typeof data.usageMetrics || [],
    
    bookingTrend: aggregateArray(
      data.bookingTrend as unknown as Record<string, unknown>[] | undefined,
      grouping,
      'date',
      ['confirmed', 'completed', 'cancelled', 'noShow', 'total']
    ) as unknown as typeof data.bookingTrend,
    
    trafficSourceTrend: aggregateArray(
      data.trafficSourceTrend as unknown as Record<string, unknown>[] | undefined,
      grouping,
      'date',
      ['direct', 'organic', 'paid', 'social', 'email', 'referral', 'total']
    ) as unknown as typeof data.trafficSourceTrend,
    
    leadConversionTrend: aggregateArray(
      data.leadConversionTrend as unknown as Record<string, unknown>[] | undefined,
      grouping,
      'date',
      leadConversionKeys
    ) as unknown as typeof data.leadConversionTrend,
    
    // Non-time-series data preserved unchanged
  };
}
