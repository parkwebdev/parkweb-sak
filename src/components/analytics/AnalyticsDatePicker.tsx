/**
 * Analytics Date Picker
 * 
 * A simple preset-based date picker for analytics.
 * Provides quick selection of common date ranges.
 * @module components/analytics/AnalyticsDatePicker
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@untitledui/icons';
import { ANALYTICS_DATE_PRESETS, type AnalyticsDatePreset } from './constants';

interface AnalyticsDatePickerProps {
  /** Currently selected date preset */
  selectedPreset: AnalyticsDatePreset;
  /** Callback when preset changes */
  onPresetChange: (preset: AnalyticsDatePreset) => void;
}

/**
 * Simplified date picker using preset options only.
 * Matches the Report Builder date selection style.
 */
export function AnalyticsDatePicker({
  selectedPreset,
  onPresetChange,
}: AnalyticsDatePickerProps) {
  const selectedLabel = ANALYTICS_DATE_PRESETS.find(p => p.value === selectedPreset)?.label || 'Last 30 Days';

  return (
    <Select value={selectedPreset} onValueChange={(value) => onPresetChange(value as AnalyticsDatePreset)}>
      <SelectTrigger className="w-[180px] h-9">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Select range">{selectedLabel}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {ANALYTICS_DATE_PRESETS.map((preset) => (
          <SelectItem key={preset.value} value={preset.value}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
