/**
 * Analytics Toolbar
 * 
 * Simplified toolbar with preset date picker and refresh.
 * @module components/analytics/AnalyticsToolbar
 */

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  /** Mock data mode */
  mockMode?: boolean;
  /** Callback when mock mode changes */
  onMockModeChange?: (enabled: boolean) => void;
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
  mockMode,
  onMockModeChange,
}: AnalyticsToolbarProps) {
  return (
    <div className="flex items-center justify-between">
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

      {onMockModeChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor="mock-toggle" className="text-sm text-muted-foreground cursor-pointer">
            {mockMode ? 'Mock Data' : 'Live Data'}
          </Label>
          <Switch
            id="mock-toggle"
            checked={mockMode}
            onCheckedChange={onMockModeChange}
            aria-label="Toggle mock data mode"
          />
        </div>
      )}
    </div>
  );
}
