/**
 * TriggerScheduleNode Component
 * 
 * Trigger node for schedule-based automation starts.
 * Runs on a cron schedule in a specified timezone.
 * 
 * @module components/automations/nodes/TriggerScheduleNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Clock } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { TriggerScheduleNodeData } from '@/types/automations';

// Timezone labels for display
const TIMEZONE_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern',
  'America/Chicago': 'Central',
  'America/Denver': 'Mountain',
  'America/Los_Angeles': 'Pacific',
  'America/Phoenix': 'Arizona',
  'Pacific/Honolulu': 'Hawaii',
  'America/Anchorage': 'Alaska',
  'UTC': 'UTC',
};

/**
 * Convert a cron expression to human-readable format.
 */
function cronToReadable(cron: string): string {
  if (!cron) return 'Not configured';
  
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Every minute
  if (cron === '* * * * *') return 'Every minute';
  
  // Every X minutes
  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = minute.slice(2);
    return `Every ${interval} minutes`;
  }
  
  // Hourly
  if (minute !== '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const m = parseInt(minute, 10);
    if (m === 0) return 'Hourly at :00';
    return `Hourly at :${String(m).padStart(2, '0')}`;
  }
  
  // Format time for daily/weekly
  const formatTime = (h: string, m: string) => {
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    const ampm = hNum >= 12 ? 'PM' : 'AM';
    const h12 = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum;
    return `${h12}:${String(mNum).padStart(2, '0')} ${ampm}`;
  };
  
  // Daily
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${formatTime(hour, minute)}`;
  }
  
  // Weekly
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayParts = dayOfWeek.split(',').map((d) => days[parseInt(d, 10)] || d);
    
    // Special cases
    if (dayOfWeek === '1,2,3,4,5' || dayOfWeek === '1-5') {
      return `Weekdays at ${formatTime(hour, minute)}`;
    }
    if (dayOfWeek === '0,6') {
      return `Weekends at ${formatTime(hour, minute)}`;
    }
    
    return `${dayParts.join(', ')} at ${formatTime(hour, minute)}`;
  }
  
  return cron;
}

function getTimezoneLabel(tz: string): string {
  return TIMEZONE_LABELS[tz] || tz;
}

export const TriggerScheduleNode = memo(function TriggerScheduleNode(props: NodeProps) {
  const data = props.data as TriggerScheduleNodeData;
  const schedule = cronToReadable(data.cronExpression);
  const timezone = data.timezone || 'America/New_York';
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Clock size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-blue-500"
      hasInput={false}
      hasOutput={true}
      category="Trigger"
    >
      <div className="space-y-1">
        <div className="font-medium text-foreground">{schedule}</div>
        <div className="text-2xs text-muted-foreground">
          {getTimezoneLabel(timezone)}
        </div>
      </div>
    </BaseNode>
  );
});
