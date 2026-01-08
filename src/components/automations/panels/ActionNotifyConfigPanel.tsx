/**
 * ActionNotifyConfigPanel Component
 * 
 * Configuration panel for team notification action nodes.
 * 
 * @module components/automations/panels/ActionNotifyConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { ActionNotifyNodeData } from '@/types/automations';

interface ActionNotifyConfigPanelProps {
  nodeId: string;
  data: ActionNotifyNodeData;
}

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
] as const;

const CHANNEL_OPTIONS = [
  { value: 'in_app', label: 'In-App Notification' },
  { value: 'email', label: 'Email' },
  { value: 'both', label: 'Both' },
] as const;

export function ActionNotifyConfigPanel({ nodeId, data }: ActionNotifyConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleUpdate = useCallback(
    (updates: Partial<ActionNotifyNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  const handleRecipientsChange = useCallback(
    (value: string) => {
      // Parse comma-separated list into array
      const recipients = value
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
      handleUpdate({ recipients });
    },
    [handleUpdate]
  );

  return (
    <div className="space-y-4">
      {/* Notification Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          placeholder="New lead: {{leadName}}"
          value={data.notificationTitle || ''}
          onChange={(e) => handleUpdate({ notificationTitle: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Use {'{{variable}}'} to insert dynamic values
        </p>
      </div>

      {/* Notification Message */}
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          placeholder="A new lead has been created..."
          value={data.message || ''}
          onChange={(e) => handleUpdate({ message: e.target.value })}
          rows={3}
        />
      </div>

      {/* Notification Type */}
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={data.notificationType || 'info'}
          onValueChange={(value) => handleUpdate({ notificationType: value as ActionNotifyNodeData['notificationType'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Channel */}
      <div className="space-y-2">
        <Label>Channel</Label>
        <Select
          value={data.channel || 'in_app'}
          onValueChange={(value) => handleUpdate({ channel: value as ActionNotifyNodeData['channel'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_OPTIONS.map((channel) => (
              <SelectItem key={channel.value} value={channel.value}>
                {channel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        <Label>Recipients</Label>
        <Textarea
          placeholder="user1@example.com, user2@example.com"
          value={data.recipients?.join(', ') || ''}
          onChange={(e) => handleRecipientsChange(e.target.value)}
          rows={2}
        />
        <p className="text-2xs text-muted-foreground">
          Comma-separated list of emails or user IDs
        </p>
      </div>

      {/* Action URL (optional) */}
      <div className="space-y-2">
        <Label>Action URL (optional)</Label>
        <Input
          placeholder="/leads/{{leadId}}"
          value={data.actionUrl || ''}
          onChange={(e) => handleUpdate({ actionUrl: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Link to include in the notification
        </p>
      </div>
    </div>
  );
}
