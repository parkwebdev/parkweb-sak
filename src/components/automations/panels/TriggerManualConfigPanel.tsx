/**
 * TriggerManualConfigPanel Component
 * 
 * Configuration panel for manual trigger nodes.
 * Allows setting action name and confirmation options.
 * 
 * @module components/automations/panels/TriggerManualConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFlowStore } from '@/stores/automationFlowStore';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import type { TriggerManualNodeData } from '@/types/automations';

interface TriggerManualConfigPanelProps {
  nodeId: string;
  data: TriggerManualNodeData;
}

export function TriggerManualConfigPanel({ nodeId, data }: TriggerManualConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleActionNameChange = useCallback(
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
        <Label htmlFor="action-name">Button Label</Label>
        <Input
          id="action-name"
          value={data.buttonLabel || ''}
          onChange={handleActionNameChange}
          placeholder="Run automation"
        />
        <p className="text-2xs text-muted-foreground">
          Text shown on the button when triggering this automation.
        </p>
      </div>

      <AdvancedModeToggle storageKey="manual-trigger-panel">
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
      </AdvancedModeToggle>
    </div>
  );
}
