/**
 * TriggerManualConfigPanel Component
 * 
 * Configuration panel for manual trigger nodes.
 * Allows setting button label and confirmation options.
 * 
 * @module components/automations/panels/TriggerManualConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { TriggerManualNodeData } from '@/types/automations';

interface TriggerManualConfigPanelProps {
  nodeId: string;
  data: TriggerManualNodeData;
}

export function TriggerManualConfigPanel({ nodeId, data }: TriggerManualConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleButtonLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(nodeId, { buttonLabel: e.target.value });
    },
    [nodeId, updateNodeData]
  );

  const handleConfirmationChange = useCallback(
    (checked: boolean) => {
      updateNodeData(nodeId, { requireConfirmation: checked });
    },
    [nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="button-label">Button Label</Label>
        <Input
          id="button-label"
          value={data.buttonLabel || ''}
          onChange={handleButtonLabelChange}
          placeholder="Run automation"
        />
        <p className="text-2xs text-muted-foreground">
          Text shown on the button to trigger this automation.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="require-confirmation">Require Confirmation</Label>
          <p className="text-2xs text-muted-foreground">
            Ask for confirmation before running.
          </p>
        </div>
        <Switch
          id="require-confirmation"
          checked={data.requireConfirmation || false}
          onCheckedChange={handleConfirmationChange}
        />
      </div>
    </div>
  );
}
