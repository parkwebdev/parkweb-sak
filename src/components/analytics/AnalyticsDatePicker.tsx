/**
 * AnalyticsDatePicker Component
 * 
 * Unified date picker with integrated comparison period selection.
 * Combines date range selection, presets, and comparison options in one popover.
 * @module components/analytics/AnalyticsDatePicker
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, ChevronDown } from '@untitledui/icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ComparisonType = 'previous' | 'last-month' | 'last-year' | 'custom';

interface AnalyticsDatePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  comparisonMode: boolean;
  onComparisonModeChange: (enabled: boolean) => void;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
  onComparisonDateChange: (start: Date, end: Date) => void;
}

const presets = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

export const AnalyticsDatePicker = ({
  startDate,
  endDate,
  onDateChange,
  comparisonMode,
  onComparisonModeChange,
  comparisonStartDate,
  comparisonEndDate,
  onComparisonDateChange,
}: AnalyticsDatePickerProps) => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('previous');
  const [open, setOpen] = useState(false);

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
    
    // Auto-update comparison dates if comparison mode is on
    if (comparisonMode && comparisonType !== 'custom') {
      updateComparisonDates(comparisonType, start, end);
    }
  };

  const updateComparisonDates = (type: ComparisonType, currentStart: Date, currentEnd: Date) => {
    const currentDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

    let newStart: Date;
    let newEnd: Date;

    switch (type) {
      case 'previous':
        newEnd = new Date(currentStart);
        newEnd.setDate(newEnd.getDate() - 1);
        newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - currentDays);
        break;

      case 'last-month':
        newStart = new Date(currentStart);
        newStart.setMonth(newStart.getMonth() - 1);
        newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() - 1);
        break;

      case 'last-year':
        newStart = new Date(currentStart);
        newStart.setFullYear(newStart.getFullYear() - 1);
        newEnd = new Date(currentEnd);
        newEnd.setFullYear(newEnd.getFullYear() - 1);
        break;

      case 'custom':
        return;

      default:
        return;
    }

    onComparisonDateChange(newStart, newEnd);
  };

  const handleComparisonTypeChange = (type: ComparisonType) => {
    setComparisonType(type);
    if (type !== 'custom') {
      updateComparisonDates(type, startDate, endDate);
    }
  };

  const handleComparisonModeToggle = (enabled: boolean) => {
    onComparisonModeChange(enabled);
    if (enabled && comparisonType !== 'custom') {
      updateComparisonDates(comparisonType, startDate, endDate);
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const formatShortDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[200px] justify-between">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">
              {formatDateRange(startDate, endDate)}
              {comparisonMode && (
                <span className="text-muted-foreground ml-1">
                  vs {formatShortDateRange(comparisonStartDate, comparisonEndDate)}
                </span>
              )}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Primary Date Range Calendar */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Date Range
            </Label>
            <CalendarComponent
              mode="range"
              selected={{ from: startDate, to: endDate }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onDateChange(range.from, range.to);
                  if (comparisonMode && comparisonType !== 'custom') {
                    updateComparisonDates(comparisonType, range.from, range.to);
                  }
                }
              }}
              numberOfMonths={2}
              className={cn("pointer-events-auto")}
            />
          </div>

          {/* Quick Select Presets */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Select</p>
            <div className="grid grid-cols-5 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  className="text-xs px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-center"
                  onClick={() => handlePresetClick(preset.days)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Compare Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="compare-toggle" className="text-sm font-medium cursor-pointer">
                Compare to previous period
              </Label>
              <Switch
                id="compare-toggle"
                checked={comparisonMode}
                onCheckedChange={handleComparisonModeToggle}
                aria-label="Toggle comparison mode"
              />
            </div>

            {comparisonMode && (
              <div className="space-y-3 pl-0.5">
                <Select
                  value={comparisonType}
                  onValueChange={(value) => handleComparisonTypeChange(value as ComparisonType)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Previous period</SelectItem>
                    <SelectItem value="last-month">Same period last month</SelectItem>
                    <SelectItem value="last-year">Same period last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                {/* Show comparison date range info or custom picker */}
                {comparisonType === 'custom' ? (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Comparison Period
                    </Label>
                    <CalendarComponent
                      mode="range"
                      selected={{ from: comparisonStartDate, to: comparisonEndDate }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          onComparisonDateChange(range.from, range.to);
                        }
                      }}
                      numberOfMonths={2}
                      className={cn("pointer-events-auto")}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Comparing: {formatDateRange(comparisonStartDate, comparisonEndDate)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
