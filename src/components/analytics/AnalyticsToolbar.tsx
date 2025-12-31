/**
 * Analytics Toolbar
 * 
 * Simplified toolbar with preset date picker and refresh.
 * @module components/analytics/AnalyticsToolbar
 */

import { Button } from '@/components/ui/button';
import { RefreshCcw01 } from '@untitledui/icons';
import { AnalyticsDatePicker } from './AnalyticsDatePicker';
import { type AnalyticsDatePreset } from './constants';

interface AnalyticsToolbarProps {
  /** Currently selected date preset */
  selectedPreset: AnalyticsDatePreset;
  /** Callback when date preset changes */
  onPresetChange: (preset: AnalyticsDatePreset) => void;
  /** Callback to refresh analytics data */
  onRefresh: () => void;
  /** Whether data is currently loading */
  isLoading?: boolean;
}

/**
 * Toolbar component for analytics pages.
 * Provides date selection and refresh functionality.
 */
export function AnalyticsToolbar({
  selectedPreset,
  onPresetChange,
  onRefresh,
  isLoading = false,
}: AnalyticsToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <AnalyticsDatePicker
        selectedPreset={selectedPreset}
        onPresetChange={onPresetChange}
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-9"
        aria-label="Refresh analytics"
      >
        <RefreshCcw01 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
