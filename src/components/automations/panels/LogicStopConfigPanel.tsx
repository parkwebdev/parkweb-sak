/**
 * LogicStopConfigPanel Component
 * 
 * Configuration panel for stop/end nodes.
 * Allows setting an optional reason for stopping.
 * 
 * @module components/automations/panels/LogicStopConfigPanel
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { LogicStopNodeData } from '@/types/automations';

interface LogicStopConfigPanelProps {
  nodeId: string;
  data: LogicStopNodeData;
}

export function LogicStopConfigPanel({ nodeId, data }: LogicStopConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleLabelChange = useCallback(
    (label: string) => {
      updateNodeData(nodeId, { label });
    },
    [nodeId, updateNodeData]
  );

  const handleReasonChange = useCallback(
    (reason: string) => {
      updateNodeData(nodeId, { reason });
    },
    [nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stop-label">Label</Label>
        <Input
          id="stop-label"
          value={data.label || 'Stop'}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Stop"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stop-reason">Reason (optional)</Label>
        <Textarea
          id="stop-reason"
          value={data.reason || ''}
          onChange={(e) => handleReasonChange(e.target.value)}
          placeholder="e.g., Lead already processed"
          rows={3}
        />
        <p className="text-2xs text-muted-foreground">
          Add context for why the automation ends here. Helpful for debugging.
        </p>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          This node ends the automation. No further steps will be executed.
        </p>
      </div>
    </div>
  );
}
