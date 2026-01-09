/**
 * ActionEmailConfigPanel Component
 * 
 * Configuration panel for email action nodes.
 * 
 * @module components/automations/panels/ActionEmailConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableReference } from './VariableReference';
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
      {/* Variable Reference */}
      <VariableReference showLead showEnvironment />

      {/* To */}
      <div className="space-y-2">
        <Label>To</Label>
        <Input
          placeholder="{{lead.email}}"
          value={data.to || ''}
          onChange={(e) => handleUpdate({ to: e.target.value })}
        />
      </div>

      {/* From Name */}
      <div className="space-y-2">
        <Label>From Name</Label>
        <Input
          placeholder="Your Company"
          value={data.fromName || ''}
          onChange={(e) => handleUpdate({ fromName: e.target.value })}
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          placeholder="Email subject"
          value={data.subject || ''}
          onChange={(e) => handleUpdate({ subject: e.target.value })}
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label>Body (HTML)</Label>
        <Textarea
          placeholder="<h1>Hello {{lead.name}}</h1>&#10;<p>Your message here...</p>"
          value={data.body || ''}
          onChange={(e) => handleUpdate({ body: e.target.value })}
          rows={6}
          className="font-mono text-xs"
        />
      </div>

      {/* Reply To */}
      <div className="space-y-2">
        <Label>Reply To (optional)</Label>
        <Input
          placeholder="reply@example.com"
          value={data.replyTo || ''}
          onChange={(e) => handleUpdate({ replyTo: e.target.value })}
        />
      </div>
    </div>
  );
}
