/**
 * Analytics Constants
 * 
 * Shared constants and types for analytics components.
 * @module components/analytics/constants
 */

/**
 * Comparison period type for analytics date picker.
 */
export type ComparisonType = 'previous' | 'last-month' | 'last-year' | 'custom';

/**
 * Date preset configuration for quick date range selection.
 */
export interface DatePreset {
  /** Display label for the preset */
  label: string;
  /** Number of days from today (0 = today only) */
  days: number;
}

/**
 * Available date range presets for analytics.
 * Used in AnalyticsDatePicker and other date selection components.
 */
export const DATE_PRESETS: DatePreset[] = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
] as const;

/**
 * Comparison type options for the date picker.
 */
export const COMPARISON_OPTIONS = [
  { value: 'previous' as ComparisonType, label: 'Previous period' },
  { value: 'last-month' as ComparisonType, label: 'Same period last month' },
  { value: 'last-year' as ComparisonType, label: 'Same period last year' },
  { value: 'custom' as ComparisonType, label: 'Custom range' },
] as const;
