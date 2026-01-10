/**
 * TriggerEventNode Component
 * 
 * Trigger node for event-based automation starts.
 * Displays user-friendly event labels matching backend format.
 * 
 * @module components/automations/nodes/TriggerEventNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Zap } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { TriggerEventNodeData } from '@/types/automations';

/** Human-readable labels for each event type */
const EVENT_LABELS: Record<string, string> = {
  // Lead events
  'lead.created': 'new lead is created',
  'lead.updated': 'lead is updated',
  'lead.stage_changed': 'lead changes stage',
  'lead.deleted': 'lead is deleted',
  // Conversation events
  'conversation.created': 'new conversation starts',
  'conversation.closed': 'conversation is closed',
  'conversation.human_takeover': 'human takeover is requested',
  // Message events
  'message.received': 'new message is received',
  // Booking events
  'booking.created': 'new booking is created',
  'booking.updated': 'booking is updated',
  'booking.confirmed': 'booking is confirmed',
  'booking.cancelled': 'booking is cancelled',
  'booking.completed': 'booking is completed',
  'booking.no_show': 'visitor is a no-show',
  'booking.deleted': 'booking is deleted',
};

export const TriggerEventNode = memo(function TriggerEventNode(props: NodeProps) {
  const data = props.data as TriggerEventNodeData;
  
  // Get the event label, defaulting to 'lead.created'
  const event = data.event || 'lead.created';
  const eventLabel = EVENT_LABELS[event] || event;
  
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-foreground">When</span>
          <span className="text-xs font-medium text-foreground">{eventLabel}</span>
        </div>
        {data.filters && Object.keys(data.filters).length > 0 && (
          <div className="text-2xs text-muted-foreground">
            + filters applied
          </div>
        )}
      </div>
    </BaseNode>
  );
});
