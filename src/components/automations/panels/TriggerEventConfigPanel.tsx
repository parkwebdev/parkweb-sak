/**
 * TriggerEventConfigPanel Component
 * 
 * Configuration panel for event trigger nodes.
 * Allows selecting event source, type, and conditions.
 * 
 * @module components/automations/panels/TriggerEventConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { TriggerEventNodeData } from '@/types/automations';

interface TriggerEventConfigPanelProps {
  nodeId: string;
  data: TriggerEventNodeData;
}

const EVENT_SOURCES = [
  { value: 'lead', label: 'Lead' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'booking', label: 'Booking' },
] as const;

const EVENT_TYPES = [
  { value: 'INSERT', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
  { value: 'any', label: 'Any change' },
] as const;

export function TriggerEventConfigPanel({ nodeId, data }: TriggerEventConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleEventSourceChange = useCallback(
    (value: string) => {
      updateNodeData(nodeId, { eventSource: value as TriggerEventNodeData['eventSource'] });
    },
    [nodeId, updateNodeData]
  );

  const handleEventTypeChange = useCallback(
    (value: string) => {
      updateNodeData(nodeId, { eventType: value as TriggerEventNodeData['eventType'] });
    },
    [nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-source">Event Source</Label>
        <Select value={data.eventSource || 'lead'} onValueChange={handleEventSourceChange}>
          <SelectTrigger id="event-source">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs text-muted-foreground">
          Which entity should trigger this automation?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-type">Event Type</Label>
        <Select value={data.eventType || 'any'} onValueChange={handleEventTypeChange}>
          <SelectTrigger id="event-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs text-muted-foreground">
          What type of event should trigger the automation?
        </p>
      </div>
    </div>
  );
}
