/**
 * TriggerEventNode Component
 * 
 * Trigger node for event-based automation starts.
 * Fires when lead, conversation, or booking events occur.
 * 
 * @module components/automations/nodes/TriggerEventNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Zap } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { TriggerEventNodeData } from '@/types/automations';

const EVENT_SOURCE_LABELS: Record<string, string> = {
  lead: 'Lead',
  conversation: 'Conversation',
  booking: 'Booking',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  INSERT: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  any: 'Any change',
};

export const TriggerEventNode = memo(function TriggerEventNode(props: NodeProps) {
  const data = props.data as TriggerEventNodeData;
  
  // Default to 'lead' and 'INSERT' if not set (handles legacy/incomplete data)
  const eventSource = data.eventSource || 'lead';
  const eventType = data.eventType || 'INSERT';
  
  const sourceLabel = EVENT_SOURCE_LABELS[eventSource] || eventSource;
  const typeLabel = EVENT_TYPE_LABELS[eventType] || eventType;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Zap size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-amber-500"
      hasInput={false}
      hasOutput={true}
      category="Trigger"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">When</span>
          <span className="font-medium text-foreground">{sourceLabel}</span>
          <span className="text-muted-foreground">is</span>
          <span className="font-medium text-foreground">{typeLabel.toLowerCase()}</span>
        </div>
        {data.conditions && data.conditions.length > 0 && (
          <div className="text-2xs text-muted-foreground">
            + {data.conditions.length} condition{data.conditions.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </BaseNode>
  );
});
