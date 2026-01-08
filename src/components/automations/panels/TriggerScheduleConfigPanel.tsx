/**
 * TriggerScheduleConfigPanel Component
 * 
 * Configuration panel for schedule trigger nodes.
 * Allows setting cron expression and timezone.
 * 
 * @module components/automations/panels/TriggerScheduleConfigPanel
 */

import { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { TriggerScheduleNodeData } from '@/types/automations';

interface TriggerScheduleConfigPanelProps {
  nodeId: string;
  data: TriggerScheduleNodeData;
}

const SCHEDULE_PRESETS = [
  { value: '* * * * *', label: 'Every minute' },
  { value: '*/5 * * * *', label: 'Every 5 minutes' },
  { value: '*/15 * * * *', label: 'Every 15 minutes' },
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 9 * * 1-5', label: 'Weekdays at 9 AM' },
  { value: '0 9 * * 1', label: 'Weekly on Monday' },
  { value: 'custom', label: 'Custom cron expression' },
] as const;

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const;

export function TriggerScheduleConfigPanel({ nodeId, data }: TriggerScheduleConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [isCustom, setIsCustom] = useState(
    !SCHEDULE_PRESETS.some((p) => p.value === data.cronExpression && p.value !== 'custom')
  );

  const handlePresetChange = useCallback(
    (value: string) => {
      if (value === 'custom') {
        setIsCustom(true);
      } else {
        setIsCustom(false);
        updateNodeData(nodeId, { cronExpression: value });
      }
    },
    [nodeId, updateNodeData]
  );

  const handleCronChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(nodeId, { cronExpression: e.target.value });
    },
    [nodeId, updateNodeData]
  );

  const handleTimezoneChange = useCallback(
    (value: string) => {
      updateNodeData(nodeId, { timezone: value });
    },
    [nodeId, updateNodeData]
  );

  const currentPreset = isCustom
    ? 'custom'
    : SCHEDULE_PRESETS.find((p) => p.value === data.cronExpression)?.value || 'custom';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="schedule-preset">Schedule</Label>
        <Select value={currentPreset} onValueChange={handlePresetChange}>
          <SelectTrigger id="schedule-preset">
            <SelectValue placeholder="Select schedule" />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <div className="space-y-2">
          <Label htmlFor="cron-expression">Cron Expression</Label>
          <Input
            id="cron-expression"
            value={data.cronExpression || ''}
            onChange={handleCronChange}
            placeholder="* * * * *"
            className="font-mono text-sm"
          />
          <p className="text-2xs text-muted-foreground">
            Format: minute hour day-of-month month day-of-week
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={data.timezone || 'UTC'} onValueChange={handleTimezoneChange}>
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
