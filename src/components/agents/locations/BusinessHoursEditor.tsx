/**
 * BusinessHoursEditor Component
 * 
 * Per-day business hours configuration with label-left/switch-right pattern.
 * Matches the ToggleSettingRow design system used throughout the app.
 * 
 * @module components/agents/locations/BusinessHoursEditor
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatedItem } from '@/components/ui/animated-item';
import { Copy07 } from '@untitledui/icons';
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

// Format time for display under label
const formatTimeDisplay = (time: string) => {
  const option = TIME_OPTIONS.find(opt => opt.value === time);
  return option?.label || time;
};

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

  const copyToWeekdays = () => {
    const monday = getDay('monday');
    if (!monday.isOpen) return;
    
    const weekdays = ['tuesday', 'wednesday', 'thursday', 'friday'];
    const updated = { ...value };
    weekdays.forEach(day => {
      updated[day as keyof BusinessHours] = {
        isOpen: monday.isOpen,
        open: monday.open,
        close: monday.close,
      };
    });
    onChange(updated);
  };

  const mondayHours = getDay('monday');
  const canCopyToWeekdays = mondayHours.isOpen;

  return (
    <div className="space-y-1">
      {canCopyToWeekdays && (
        <div className="pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToWeekdays}
            className="text-xs"
          >
            <Copy07 size={14} className="mr-1.5" />
            Copy Monday to weekdays
          </Button>
        </div>
      )}
      {DAYS.map(({ key, label }, index) => {
        const day = getDay(key);
        return (
          <AnimatedItem key={key} motionProps={{ transition: { delay: index * 0.03 } }}>
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              {/* Left side: Label and hours summary */}
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm font-medium">{label}</Label>
                {day.isOpen ? (
                  <span className="text-xs text-muted-foreground">
                    {formatTimeDisplay(day.open || '09:00')} – {formatTimeDisplay(day.close || '17:00')}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Closed</span>
                )}
              </div>

              {/* Right side: Time selects (when open) + Switch */}
              <div className="flex items-center gap-3">
                {day.isOpen && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={day.open || '09:00'}
                      onValueChange={(time) => updateTime(key, 'open', time)}
                    >
                      <SelectTrigger className="w-[100px] h-8">
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
                    <span className="text-muted-foreground text-sm">to</span>
                    <Select
                      value={day.close || '17:00'}
                      onValueChange={(time) => updateTime(key, 'close', time)}
                    >
                      <SelectTrigger className="w-[100px] h-8">
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
                )}
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={(checked) => toggleDay(key, checked)}
                  aria-label={`Toggle ${label}`}
                />
              </div>
            </div>
          </AnimatedItem>
        );
      })}
    </div>
  );
};
