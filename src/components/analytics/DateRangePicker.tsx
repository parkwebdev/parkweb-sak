/**
 * DateRangePicker Component
 * 
 * Dual calendar picker for selecting date ranges.
 * Used throughout analytics for filtering by time period.
 * @module components/analytics/DateRangePicker
 */

import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  showExternalPresets?: boolean;
}

const presets = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

export const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDateChange,
  showExternalPresets = true 
}: DateRangePickerProps) => {

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    
    if (days === 0) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(start.getDate() - days);
    }
    
    onDateChange(start, end);
  };

  return (
    <div className="p-3 space-y-3">
      <CalendarComponent
        mode="range"
        selected={{ from: startDate, to: endDate }}
        onSelect={(range) => {
          if (range?.from && range?.to) {
            onDateChange(range.from, range.to);
          }
        }}
        numberOfMonths={2}
        className={cn("pointer-events-auto")}
      />
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">Quick Select</p>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              className="text-sm px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-left"
              onClick={() => handlePresetClick(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
