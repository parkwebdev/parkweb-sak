/**
 * TriggerEventConfigPanel Component
 * 
 * Configuration panel for event trigger nodes.
 * Shows user-friendly event options that match backend format.
 * 
 * @module components/automations/panels/TriggerEventConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { TriggerEventNodeData, AutomationEventType } from '@/types/automations';

interface TriggerEventConfigPanelProps {
  nodeId: string;
  data: TriggerEventNodeData;
}

const EVENT_OPTIONS = [
  {
    category: 'Leads',
    events: [
      { value: 'lead.created', label: 'New lead is created' },
      { value: 'lead.updated', label: 'Lead is updated' },
      { value: 'lead.stage_changed', label: 'Lead moves to a new stage' },
    ],
  },
  {
    category: 'Conversations',
    events: [
      { value: 'conversation.created', label: 'New conversation starts' },
      { value: 'conversation.closed', label: 'Conversation is closed' },
      { value: 'conversation.human_takeover', label: 'Human takeover requested' },
    ],
  },
  {
    category: 'Messages',
    events: [
      { value: 'message.received', label: 'New message received' },
    ],
  },
] as const;

export function TriggerEventConfigPanel({ nodeId, data }: TriggerEventConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleEventChange = useCallback(
    (value: string) => {
      updateNodeData(nodeId, { event: value as AutomationEventType });
    },
    [nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-type">When this happens</Label>
        <Select value={data.event || 'lead.created'} onValueChange={handleEventChange}>
          <SelectTrigger id="event-type">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_OPTIONS.map((group) => (
              <SelectGroup key={group.category}>
                <SelectLabel>{group.category}</SelectLabel>
                {group.events.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs text-muted-foreground">
          Choose what triggers this automation
        </p>
      </div>
    </div>
  );
}
