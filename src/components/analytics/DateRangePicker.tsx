import { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@untitledui/icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  showExternalPresets?: boolean;
}

const presets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export const DateRangePicker = ({ startDate, endDate, onDateChange, showExternalPresets = true }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    
    if (days === 0) {
      start.setHours(0, 0, 0, 0);
    } else if (days === 1) {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(start.getDate() - days);
    }
    
    onDateChange(start, end);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal min-w-[280px]">
            <Calendar className="mr-2 h-4 w-4" />
            {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r border-border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium mb-2">Quick Select</p>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handlePresetClick(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium mb-2">Custom Range</p>
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
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {showExternalPresets && (
        <div className="flex gap-1">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
