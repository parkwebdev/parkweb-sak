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
import { useLeadStages } from '@/hooks/useLeadStages';
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
      { value: 'lead.deleted', label: 'Lead is deleted' },
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
  {
    category: 'Bookings',
    events: [
      { value: 'booking.created', label: 'New booking is created' },
      { value: 'booking.confirmed', label: 'Booking is confirmed' },
      { value: 'booking.cancelled', label: 'Booking is cancelled' },
      { value: 'booking.completed', label: 'Booking is completed' },
      { value: 'booking.no_show', label: 'Visitor is a no-show' },
    ],
  },
] as const;

export function TriggerEventConfigPanel({ nodeId, data }: TriggerEventConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const { stages } = useLeadStages();

  const handleEventChange = useCallback(
    (value: string) => {
      // Clear filters when event type changes
      updateNodeData(nodeId, { event: value as AutomationEventType, filters: undefined });
    },
    [nodeId, updateNodeData]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      const currentFilters = (data.filters as Record<string, unknown>) || {};
      const newFilters = value
        ? { ...currentFilters, [key]: value }
        : Object.fromEntries(Object.entries(currentFilters).filter(([k]) => k !== key));
      updateNodeData(nodeId, { filters: Object.keys(newFilters).length > 0 ? newFilters : undefined });
    },
    [nodeId, data.filters, updateNodeData]
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

      {/* Conditions UI for lead.stage_changed */}
      {data.event === 'lead.stage_changed' && stages && stages.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="stage-filter">Only when stage changes to</Label>
          <Select
            value={((data.filters as Record<string, unknown>)?.stage_id as string) || 'any'}
            onValueChange={(v) => handleFilterChange('stage_id', v === 'any' ? null : v)}
          >
            <SelectTrigger id="stage-filter">
              <SelectValue placeholder="Any stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any stage</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-2xs text-muted-foreground">
            Optional: filter to a specific stage
          </p>
        </div>
      )}
    </div>
  );
}
