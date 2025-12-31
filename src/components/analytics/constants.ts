/**
 * Analytics Constants
 * 
 * Shared constants and types for analytics components.
 * @module components/analytics/constants
 */

/**
 * Date preset type for analytics date picker.
 */
export type AnalyticsDatePreset = 
  | 'today' 
  | 'last7' 
  | 'last30' 
  | 'last60' 
  | 'last90' 
  | 'thisMonth' 
  | 'lastMonth';

/**
 * Date preset configuration for quick date range selection.
 */
export interface DatePresetOption {
  /** Unique identifier for the preset */
  value: AnalyticsDatePreset;
  /** Display label for the preset */
  label: string;
}

/**
 * Available date range presets for analytics.
 * Used in AnalyticsDatePicker and other date selection components.
 */
export const ANALYTICS_DATE_PRESETS: DatePresetOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last60', label: 'Last 60 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

/**
 * Convert a date preset to a start and end date range.
 */
export function getDateRangeFromPreset(preset: AnalyticsDatePreset): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return { start: today, end };
    case 'last7':
      const last7Start = new Date(today);
      last7Start.setDate(last7Start.getDate() - 6);
      return { start: last7Start, end };
    case 'last30':
      const last30Start = new Date(today);
      last30Start.setDate(last30Start.getDate() - 29);
      return { start: last30Start, end };
    case 'last60':
      const last60Start = new Date(today);
      last60Start.setDate(last60Start.getDate() - 59);
      return { start: last60Start, end };
    case 'last90':
      const last90Start = new Date(today);
      last90Start.setDate(last90Start.getDate() - 89);
      return { start: last90Start, end };
    case 'thisMonth':
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: thisMonthStart, end };
    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: lastMonthStart, end: lastMonthEnd };
    default:
      return { start: today, end };
  }
}
