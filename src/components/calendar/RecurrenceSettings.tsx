import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getRecurrenceDescription } from '@/lib/recurrence';
import type { RecurrenceRule, RecurrenceFrequency, RecurrenceEndType } from '@/types/calendar';

interface RecurrenceSettingsProps {
  recurrence: RecurrenceRule | undefined;
  onChange: (recurrence: RecurrenceRule | undefined) => void;
  baseDate: Date;
}

const WEEKDAYS = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

export const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  recurrence,
  onChange,
  baseDate,
}) => {
  // Default recurrence rule
  const rule: RecurrenceRule = recurrence || {
    frequency: 'weekly',
    interval: 1,
    endType: 'never',
    daysOfWeek: [baseDate.getDay()],
  };

  const updateRule = (updates: Partial<RecurrenceRule>) => {
    onChange({ ...rule, ...updates });
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = rule.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    updateRule({ daysOfWeek: newDays.length > 0 ? newDays : [baseDate.getDay()] });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
      {/* Frequency and Interval */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground min-w-fit">Repeat every</Label>
        <Input
          type="number"
          min={1}
          max={99}
          value={rule.interval}
          onChange={(e) => updateRule({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
          size="sm"
          className="w-16"
        />
        <Select
          value={rule.frequency}
          onValueChange={(v) => updateRule({ frequency: v as RecurrenceFrequency })}
        >
          <SelectTrigger size="sm" className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{rule.interval === 1 ? 'day' : 'days'}</SelectItem>
            <SelectItem value="weekly">{rule.interval === 1 ? 'week' : 'weeks'}</SelectItem>
            <SelectItem value="monthly">{rule.interval === 1 ? 'month' : 'months'}</SelectItem>
            <SelectItem value="yearly">{rule.interval === 1 ? 'year' : 'years'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Day of Week picker for weekly recurrence */}
      {rule.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Repeat on</Label>
          <div className="flex gap-1">
            {WEEKDAYS.map((day) => (
              <Button
                key={day.value}
                type="button"
                variant={rule.daysOfWeek?.includes(day.value) ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => toggleDayOfWeek(day.value)}
                title={day.fullLabel}
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* End condition */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Ends</Label>
        <div className="flex flex-col gap-2">
          <Select
            value={rule.endType}
            onValueChange={(v) => updateRule({ endType: v as RecurrenceEndType })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="after">After X occurrences</SelectItem>
              <SelectItem value="on">On date</SelectItem>
            </SelectContent>
          </Select>

          {rule.endType === 'after' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={rule.endAfterOccurrences || 10}
                onChange={(e) => updateRule({ endAfterOccurrences: Math.max(1, parseInt(e.target.value) || 10) })}
                size="sm"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">occurrences</span>
            </div>
          )}

          {rule.endType === 'on' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !rule.endDate && "text-muted-foreground"
                  )}
                >
                  {rule.endDate ? format(new Date(rule.endDate), 'PPP') : 'Pick end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={rule.endDate ? new Date(rule.endDate) : undefined}
                  onSelect={(date) => updateRule({ endDate: date || undefined })}
                  initialFocus
                  disabled={(date) => date < baseDate}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Preview description */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        {getRecurrenceDescription(rule)}
      </div>
    </div>
  );
};
