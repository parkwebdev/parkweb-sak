/**
 * LogicDelayConfigPanel Component
 * 
 * Configuration panel for delay/wait nodes.
 * Allows setting delay duration with friendly units.
 * 
 * @module components/automations/panels/LogicDelayConfigPanel
 */

import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import type { LogicDelayNodeData } from '@/types/automations';

interface LogicDelayConfigPanelProps {
  nodeId: string;
  data: LogicDelayNodeData;
}

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

const UNIT_MS: Record<TimeUnit, number> = {
  seconds: 1000,
  minutes: 60000,
  hours: 3600000,
  days: 86400000,
};

function msToUnit(ms: number): { value: number; unit: TimeUnit } {
  if (ms >= 86400000 && ms % 86400000 === 0) {
    return { value: ms / 86400000, unit: 'days' };
  }
  if (ms >= 3600000 && ms % 3600000 === 0) {
    return { value: ms / 3600000, unit: 'hours' };
  }
  if (ms >= 60000 && ms % 60000 === 0) {
    return { value: ms / 60000, unit: 'minutes' };
  }
  return { value: ms / 1000, unit: 'seconds' };
}

export function LogicDelayConfigPanel({ nodeId, data }: LogicDelayConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const { value, unit } = useMemo(() => msToUnit(data.delayMs || 60000), [data.delayMs]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      const numValue = parseFloat(newValue) || 0;
      updateNodeData(nodeId, {
        delayMs: Math.round(numValue * UNIT_MS[unit]),
      });
    },
    [nodeId, unit, updateNodeData]
  );

  const handleUnitChange = useCallback(
    (newUnit: TimeUnit) => {
      updateNodeData(nodeId, {
        delayMs: Math.round(value * UNIT_MS[newUnit]),
      });
    },
    [nodeId, value, updateNodeData]
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      updateNodeData(nodeId, { delayDescription: description });
    },
    [nodeId, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait for</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-24"
          />
          <Select value={unit} onValueChange={handleUnitChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-2xs text-muted-foreground">
          The automation will pause before continuing.
        </p>
      </div>

      <AdvancedModeToggle storageKey="delay-panel">
        <div className="space-y-2">
          <Label htmlFor="delay-description">Description (optional)</Label>
          <Textarea
            id="delay-description"
            value={data.delayDescription || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="e.g., Wait for user to respond"
            rows={2}
          />
          <p className="text-2xs text-muted-foreground">
            Add context for why this delay exists
          </p>
        </div>
      </AdvancedModeToggle>
    </div>
  );
}
