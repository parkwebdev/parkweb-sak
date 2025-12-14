/**
 * ComparisonPeriodSelector Component
 * 
 * Selector for choosing comparison date ranges in analytics.
 * Supports presets like previous period, previous year, and custom.
 * @module components/analytics/ComparisonPeriodSelector
 */

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from './DateRangePicker';
import { Label } from '@/components/ui/label';

interface ComparisonPeriodSelectorProps {
  currentStartDate: Date;
  currentEndDate: Date;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
  onComparisonDateChange: (start: Date, end: Date) => void;
}

type ComparisonType = 'previous' | 'last-month' | 'last-year' | 'custom';

export const ComparisonPeriodSelector = ({
  currentStartDate,
  currentEndDate,
  comparisonStartDate,
  comparisonEndDate,
  onComparisonDateChange,
}: ComparisonPeriodSelectorProps) => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('previous');

  const handleComparisonTypeChange = (type: ComparisonType) => {
    setComparisonType(type);

    const currentDays = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

    let newStart: Date;
    let newEnd: Date;

    switch (type) {
      case 'previous':
        // Previous period of same length
        newEnd = new Date(currentStartDate);
        newEnd.setDate(newEnd.getDate() - 1);
        newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - currentDays);
        break;

      case 'last-month':
        // Same dates but one month earlier
        newStart = new Date(currentStartDate);
        newStart.setMonth(newStart.getMonth() - 1);
        newEnd = new Date(currentEndDate);
        newEnd.setMonth(newEnd.getMonth() - 1);
        break;

      case 'last-year':
        // Same dates but one year earlier
        newStart = new Date(currentStartDate);
        newStart.setFullYear(newStart.getFullYear() - 1);
        newEnd = new Date(currentEndDate);
        newEnd.setFullYear(newEnd.getFullYear() - 1);
        break;

      case 'custom':
        // Keep existing dates for custom
        return;

      default:
        return;
    }

    onComparisonDateChange(newStart, newEnd);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Compare to:</Label>
        <Select
          value={comparisonType}
          onValueChange={(value) => handleComparisonTypeChange(value as ComparisonType)}
        >
          <SelectTrigger size="sm" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="previous" className="py-1 text-xs">Previous period</SelectItem>
            <SelectItem value="last-month" className="py-1 text-xs">Same period last month</SelectItem>
            <SelectItem value="last-year" className="py-1 text-xs">Same period last year</SelectItem>
            <SelectItem value="custom" className="py-1 text-xs">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {comparisonType === 'custom' && (
        <div>
          <Label className="text-sm font-medium mb-2 block text-muted-foreground">
            Comparison Period
          </Label>
          <DateRangePicker
            startDate={comparisonStartDate}
            endDate={comparisonEndDate}
            onDateChange={onComparisonDateChange}
            showExternalPresets={false}
          />
        </div>
      )}
    </div>
  );
};

