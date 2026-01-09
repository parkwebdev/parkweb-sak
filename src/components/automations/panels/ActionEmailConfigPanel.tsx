/**
 * ActionEmailConfigPanel Component
 * 
 * Configuration panel for email action nodes.
 * Simplified, dummy-proof version with smart defaults.
 * 
 * @module components/automations/panels/ActionEmailConfigPanel
 */

import { useCallback } from 'react';
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
import { VariableInput } from './VariableInput';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import { EMAIL_RECIPIENT_OPTIONS } from './panelTypes';
import type { ActionEmailNodeData } from '@/types/automations';

interface ActionEmailConfigPanelProps {
  nodeId: string;
  data: ActionEmailNodeData;
}

export function ActionEmailConfigPanel({ nodeId, data }: ActionEmailConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleUpdate = useCallback(
    (updates: Partial<ActionEmailNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  // Check if current "to" value is a custom email (not lead's email)
  const isCustomRecipient = data.to && 
    data.to !== '{{lead.email}}' && 
    !data.to.startsWith('{{');

  return (
    <div className="space-y-4">
      {/* To - Simple dropdown for lead's email */}
      <div className="space-y-2">
        <Label>Send to</Label>
        <Select
          value={data.to || '{{lead.email}}'}
          onValueChange={(value) => handleUpdate({ to: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_RECIPIENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs text-muted-foreground">
          Email will be sent to the lead that triggered this automation
        </p>
      </div>

      {/* From Name - Plain text, no variables */}
      <div className="space-y-2">
        <Label htmlFor="fromName">From name</Label>
        <Input
          id="fromName"
          placeholder="Your Company Name"
          value={data.fromName || ''}
          onChange={(e) => handleUpdate({ fromName: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          The name that appears as the sender
        </p>
      </div>

      {/* Subject - Text with variable insertion */}
      <VariableInput
        label="Subject"
        placeholder="Thanks for reaching out, {{lead.name}}!"
        value={data.subject || ''}
        onChange={(value) => handleUpdate({ subject: value })}
        categories={['lead', 'trigger', 'environment']}
      />

      {/* Body - Text with variable insertion */}
      <VariableInput
        label="Email body (HTML)"
        placeholder="<p>Hi {{lead.name}},</p>&#10;<p>Thank you for your interest...</p>"
        value={data.body || ''}
        onChange={(value) => handleUpdate({ body: value })}
        categories={['lead', 'conversation', 'trigger', 'environment']}
        multiline
        rows={8}
        className="font-mono text-xs"
      />

      {/* Advanced Settings */}
      <AdvancedModeToggle storageKey="email">
        {/* Reply To - Plain email input */}
        <div className="space-y-2">
          <Label htmlFor="replyTo">Reply-to address</Label>
          <Input
            id="replyTo"
            type="email"
            placeholder="support@yourcompany.com"
            value={data.replyTo || ''}
            onChange={(e) => handleUpdate({ replyTo: e.target.value })}
          />
          <p className="text-2xs text-muted-foreground">
            Where replies will be sent (optional)
          </p>
        </div>

        {/* Custom Recipient Override */}
        <div className="space-y-2">
          <Label htmlFor="customTo">Custom recipient (override)</Label>
          <Input
            id="customTo"
            type="email"
            placeholder="someone@example.com"
            value={isCustomRecipient ? data.to : ''}
            onChange={(e) => handleUpdate({ to: e.target.value || '{{lead.email}}' })}
          />
          <p className="text-2xs text-muted-foreground">
            Send to a specific email instead of the lead
          </p>
        </div>
      </AdvancedModeToggle>
    </div>
  );
}
