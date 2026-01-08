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

/**
 * Convert a simple cron expression to human-readable format.
 * Only handles common patterns; complex cron expressions show as-is.
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
    return `Hourly at :${minute.padStart(2, '0')}`;
  }
  
  // Daily
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `Daily at ${h12}:${minute.padStart(2, '0')} ${ampm}`;
  }
  
  // Weekly
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayParts = dayOfWeek.split(',').map((d) => days[parseInt(d, 10)] || d);
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${dayParts.join(', ')} at ${h12}:${minute.padStart(2, '0')} ${ampm}`;
  }
  
  return cron;
}

export const TriggerScheduleNode = memo(function TriggerScheduleNode(props: NodeProps) {
  const data = props.data as TriggerScheduleNodeData;
  const schedule = cronToReadable(data.cronExpression);
  
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
        {data.timezone && (
          <div className="text-2xs text-muted-foreground">
            Timezone: {data.timezone}
          </div>
        )}
      </div>
    </BaseNode>
  );
});
