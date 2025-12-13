/**
 * BusinessHoursEditor Component
 * 
 * Per-day business hours configuration with toggles and time pickers.
 * 
 * @module components/agents/locations/BusinessHoursEditor
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { BusinessHours, DayHours } from '@/types/locations';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const time12 = `${hour12}:${minute} ${period}`;
  return { value: time24, label: time12 };
});

interface BusinessHoursEditorProps {
  value: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

export const BusinessHoursEditor: React.FC<BusinessHoursEditorProps> = ({
  value,
  onChange,
}) => {
  const getDay = (dayKey: string): DayHours => {
    return value[dayKey as keyof BusinessHours] || { isOpen: false };
  };

  const updateDay = (dayKey: string, dayValue: DayHours) => {
    onChange({
      ...value,
      [dayKey]: dayValue,
    });
  };

  const toggleDay = (dayKey: string, isOpen: boolean) => {
    const current = getDay(dayKey);
    updateDay(dayKey, {
      ...current,
      isOpen,
      open: isOpen ? (current.open || '09:00') : undefined,
      close: isOpen ? (current.close || '17:00') : undefined,
    });
  };

  const updateTime = (dayKey: string, field: 'open' | 'close', time: string) => {
    const current = getDay(dayKey);
    updateDay(dayKey, {
      ...current,
      [field]: time,
    });
  };

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const day = getDay(key);
        return (
          <div
            key={key}
            className="flex items-center gap-4 py-2 border-b border-border last:border-0"
          >
            <div className="w-28 flex items-center gap-2">
              <Switch
                checked={day.isOpen}
                onCheckedChange={(checked) => toggleDay(key, checked)}
                aria-label={`Toggle ${label}`}
              />
              <Label className="text-sm font-normal">{label}</Label>
            </div>

            {day.isOpen ? (
              <div className="flex items-center gap-2 text-sm">
                <Select
                  value={day.open || '09:00'}
                  onValueChange={(time) => updateTime(key, 'open', time)}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select
                  value={day.close || '17:00'}
                  onValueChange={(time) => updateTime(key, 'close', time)}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
