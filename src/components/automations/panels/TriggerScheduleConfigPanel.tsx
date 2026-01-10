/**
 * TriggerScheduleConfigPanel Component
 * 
 * Configuration panel for schedule trigger nodes.
 * Human-friendly UI for setting frequency, time, and timezone.
 * 
 * @module components/automations/panels/TriggerScheduleConfigPanel
 */

import { useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import { cn } from '@/lib/utils';
import type { TriggerScheduleNodeData } from '@/types/automations';

interface TriggerScheduleConfigPanelProps {
  nodeId: string;
  data: TriggerScheduleNodeData;
}

// US-focused timezone options
const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'UTC', label: 'UTC' },
] as const;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const;

// Internal schedule config representation
interface ScheduleConfig {
  frequency: 'minutes' | 'hourly' | 'daily' | 'weekly';
  interval?: number;
  time?: string; // "09:00" format
  daysOfWeek?: number[];
}

// Convert UI config to cron expression
function configToCron(config: ScheduleConfig): string {
  switch (config.frequency) {
    case 'minutes':
      return `*/${config.interval || 5} * * * *`;
    case 'hourly':
      return `${config.interval || 0} * * * *`;
    case 'daily': {
      const [hour, minute] = (config.time || '09:00').split(':');
      return `${parseInt(minute, 10)} ${parseInt(hour, 10)} * * *`;
    }
    case 'weekly': {
      const [hour, minute] = (config.time || '09:00').split(':');
      const days = (config.daysOfWeek || [1]).join(',');
      return `${parseInt(minute, 10)} ${parseInt(hour, 10)} * * ${days}`;
    }
    default:
      return '0 9 * * *';
  }
}

// Convert cron to UI config (for editing existing)
function cronToConfig(cron: string): ScheduleConfig {
  if (!cron) return { frequency: 'daily', time: '09:00' };
  
  const parts = cron.split(' ');
  if (parts.length !== 5) return { frequency: 'daily', time: '09:00' };
  
  const [minute, hour, , , dayOfWeek] = parts;
  
  // Every X minutes
  if (minute.startsWith('*/') && hour === '*') {
    return { frequency: 'minutes', interval: parseInt(minute.slice(2), 10) };
  }
  
  // Hourly
  if (minute !== '*' && hour === '*') {
    return { frequency: 'hourly', interval: parseInt(minute, 10) };
  }
  
  // Weekly
  if (dayOfWeek !== '*') {
    const days = dayOfWeek.split(',').map(Number);
    return { 
      frequency: 'weekly', 
      time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      daysOfWeek: days,
    };
  }
  
  // Daily
  return { 
    frequency: 'daily', 
    time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
  };
}

// Convert 24h to 12h format
function to12Hour(time24: string): { hour: number; minute: string; ampm: 'AM' | 'PM' } {
  const [hour, minute] = time24.split(':').map(Number);
  return {
    hour: hour === 0 ? 12 : hour > 12 ? hour - 12 : hour,
    minute: String(minute).padStart(2, '0'),
    ampm: hour >= 12 ? 'PM' : 'AM',
  };
}

// Convert 12h to 24h format
function to24Hour(hour: number, minute: string, ampm: 'AM' | 'PM'): string {
  let h = hour;
  if (ampm === 'PM' && hour !== 12) h = hour + 12;
  if (ampm === 'AM' && hour === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

export function TriggerScheduleConfigPanel({ nodeId, data }: TriggerScheduleConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  
  // Parse current cron to config
  const config = useMemo(() => cronToConfig(data.cronExpression), [data.cronExpression]);
  
  // Parse time for daily/weekly
  const timeComponents = useMemo(() => {
    return to12Hour(config.time || '09:00');
  }, [config.time]);

  const updateCron = useCallback(
    (newConfig: Partial<ScheduleConfig>) => {
      const merged = { ...config, ...newConfig };
      const cron = configToCron(merged);
      updateNodeData(nodeId, { cronExpression: cron });
    },
    [config, nodeId, updateNodeData]
  );

  const handleFrequencyChange = useCallback(
    (value: string) => {
      const freq = value as ScheduleConfig['frequency'];
      const newConfig: ScheduleConfig = { frequency: freq };
      
      // Set sensible defaults for each frequency
      if (freq === 'minutes') {
        newConfig.interval = 5;
      } else if (freq === 'hourly') {
        newConfig.interval = 0;
      } else if (freq === 'daily') {
        newConfig.time = '09:00';
      } else if (freq === 'weekly') {
        newConfig.time = '09:00';
        newConfig.daysOfWeek = [1]; // Monday
      }
      
      updateCron(newConfig);
    },
    [updateCron]
  );

  const handleIntervalChange = useCallback(
    (value: string) => {
      updateCron({ interval: parseInt(value, 10) });
    },
    [updateCron]
  );

  const handleTimeChange = useCallback(
    (hour: number, minute: string, ampm: 'AM' | 'PM') => {
      updateCron({ time: to24Hour(hour, minute, ampm) });
    },
    [updateCron]
  );

  const handleDayToggle = useCallback(
    (day: number) => {
      const currentDays = config.daysOfWeek || [1];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);
      
      // Must have at least one day selected
      if (newDays.length === 0) return;
      
      updateCron({ daysOfWeek: newDays });
    },
    [config.daysOfWeek, updateCron]
  );

  const handleTimezoneChange = useCallback(
    (value: string) => {
      updateNodeData(nodeId, { timezone: value });
    },
    [nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      {/* Frequency */}
      <div className="space-y-2">
        <Label htmlFor="frequency">How often?</Label>
        <Select value={config.frequency} onValueChange={handleFrequencyChange}>
          <SelectTrigger id="frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Every few minutes</SelectItem>
            <SelectItem value="hourly">Every hour</SelectItem>
            <SelectItem value="daily">Once a day</SelectItem>
            <SelectItem value="weekly">Specific days of the week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Minutes interval */}
      {config.frequency === 'minutes' && (
        <div className="space-y-2">
          <Label htmlFor="interval">Run every</Label>
          <Select 
            value={String(config.interval || 5)} 
            onValueChange={handleIntervalChange}
          >
            <SelectTrigger id="interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Hourly - at minute */}
      {config.frequency === 'hourly' && (
        <div className="space-y-2">
          <Label htmlFor="at-minute">At minute</Label>
          <Select 
            value={String(config.interval || 0)} 
            onValueChange={handleIntervalChange}
          >
            <SelectTrigger id="at-minute">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">:00 (top of hour)</SelectItem>
              <SelectItem value="15">:15</SelectItem>
              <SelectItem value="30">:30</SelectItem>
              <SelectItem value="45">:45</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Daily/Weekly - time picker */}
      {(config.frequency === 'daily' || config.frequency === 'weekly') && (
        <div className="space-y-2">
          <Label>At what time?</Label>
          <div className="flex gap-2">
            <Select 
              value={String(timeComponents.hour)} 
              onValueChange={(v) => handleTimeChange(parseInt(v, 10), timeComponents.minute, timeComponents.ampm)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                  <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={timeComponents.minute} 
              onValueChange={(v) => handleTimeChange(timeComponents.hour, v, timeComponents.ampm)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00">:00</SelectItem>
                <SelectItem value="15">:15</SelectItem>
                <SelectItem value="30">:30</SelectItem>
                <SelectItem value="45">:45</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={timeComponents.ampm} 
              onValueChange={(v) => handleTimeChange(timeComponents.hour, timeComponents.minute, v as 'AM' | 'PM')}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Weekly - day picker */}
      {config.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label>On which days?</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleDayToggle(day.value)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md border transition-colors",
                  (config.daysOfWeek || []).includes(day.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <AdvancedModeToggle storageKey="schedule-trigger-panel">
        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select 
            value={data.timezone || 'America/New_York'} 
            onValueChange={handleTimezoneChange}
          >
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {US_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-2xs text-muted-foreground">
            Default: Eastern Time (ET)
          </p>
        </div>
      </AdvancedModeToggle>
    </div>
  );
}
