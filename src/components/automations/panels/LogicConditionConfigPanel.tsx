/**
 * LogicConditionConfigPanel Component
 * 
 * Configuration panel for conditional branch nodes.
 * Allows setting up condition field, operator, and value.
 * 
 * @module components/automations/panels/LogicConditionConfigPanel
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { LogicConditionNodeData } from '@/types/automations';

interface LogicConditionConfigPanelProps {
  nodeId: string;
  data: LogicConditionNodeData;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
] as const;

export function LogicConditionConfigPanel({ nodeId, data }: LogicConditionConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const condition = data.condition || { field: '', operator: 'equals', value: '' };

  const handleFieldChange = useCallback(
    (field: string) => {
      updateNodeData(nodeId, {
        condition: { ...condition, field },
      });
    },
    [nodeId, condition, updateNodeData]
  );

  const handleOperatorChange = useCallback(
    (operator: string) => {
      updateNodeData(nodeId, {
        condition: { ...condition, operator: operator as typeof condition.operator },
      });
    },
    [nodeId, condition, updateNodeData]
  );

  const handleValueChange = useCallback(
    (value: string) => {
      updateNodeData(nodeId, {
        condition: { ...condition, value },
      });
    },
    [nodeId, condition, updateNodeData]
  );

  const isValueHidden = condition.operator === 'is_empty' || condition.operator === 'is_not_empty';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="condition-field">Field</Label>
        <Input
          id="condition-field"
          value={condition.field}
          onChange={(e) => handleFieldChange(e.target.value)}
          placeholder="e.g., {{lead.status}}"
        />
        <p className="text-2xs text-muted-foreground">
          Use variable syntax like {'{{lead.status}}'} or {'{{variables.count}}'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition-operator">Operator</Label>
        <Select value={condition.operator} onValueChange={handleOperatorChange}>
          <SelectTrigger id="condition-operator">
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isValueHidden && (
        <div className="space-y-2">
          <Label htmlFor="condition-value">Value</Label>
          <Input
            id="condition-value"
            value={String(condition.value || '')}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Value to compare"
          />
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          The automation will branch based on whether this condition is true or false.
        </p>
      </div>
    </div>
  );
}
