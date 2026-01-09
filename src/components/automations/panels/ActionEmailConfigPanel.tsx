/**
 * ActionEmailConfigPanel Component
 * 
 * Configuration panel for email action nodes.
 * 
 * @module components/automations/panels/ActionEmailConfigPanel
 */

import { useCallback } from 'react';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableInput } from './VariableInput';
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

  return (
    <div className="space-y-4">
      {/* To */}
      <VariableInput
        label="To"
        placeholder="{{lead.email}}"
        value={data.to || ''}
        onChange={(value) => handleUpdate({ to: value })}
        categories={['lead', 'trigger']}
      />

      {/* From Name */}
      <VariableInput
        label="From Name"
        placeholder="Your Company"
        value={data.fromName || ''}
        onChange={(value) => handleUpdate({ fromName: value })}
        categories={['environment']}
      />

      {/* Subject */}
      <VariableInput
        label="Subject"
        placeholder="Email subject"
        value={data.subject || ''}
        onChange={(value) => handleUpdate({ subject: value })}
        categories={['lead', 'trigger', 'environment']}
      />

      {/* Body */}
      <VariableInput
        label="Body (HTML)"
        placeholder="<h1>Hello {{lead.name}}</h1>&#10;<p>Your message here...</p>"
        value={data.body || ''}
        onChange={(value) => handleUpdate({ body: value })}
        categories={['lead', 'conversation', 'trigger', 'environment']}
        multiline
        rows={6}
        className="font-mono text-xs"
      />

      {/* Reply To */}
      <VariableInput
        label="Reply To (optional)"
        placeholder="reply@example.com"
        value={data.replyTo || ''}
        onChange={(value) => handleUpdate({ replyTo: value })}
        categories={['environment']}
      />
    </div>
  );
}
