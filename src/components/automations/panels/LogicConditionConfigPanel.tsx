/**
 * LogicConditionConfigPanel Component
 * 
 * Configuration panel for conditional branch nodes.
 * Simplified with human-readable field labels and context-aware value inputs.
 * 
 * @module components/automations/panels/LogicConditionConfigPanel
 */

import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '@/stores/automationFlowStore';
import { SmartFieldInput } from './SmartFieldInput';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import { VariableInput } from './VariableInput';
import { CONDITION_FIELD_OPTIONS } from './panelTypes';
import type { LogicConditionNodeData } from '@/types/automations';

interface LogicConditionConfigPanelProps {
  nodeId: string;
  data: LogicConditionNodeData;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Is greater than' },
  { value: 'less_than', label: 'Is less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
] as const;

/**
 * Map variable path to the field key for SmartFieldInput
 */
function getFieldKeyFromPath(path: string): string {
  // Extract field name from path like '{{lead.status}}' -> 'status'
  const match = path.match(/\{\{lead\.(.+?)\}\}/);
  return match ? match[1] : '';
}

export function LogicConditionConfigPanel({ nodeId, data }: LogicConditionConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const condition = data.condition || { field: '', operator: 'equals', value: '' };

  const handleFieldChange = useCallback(
    (field: string) => {
      // Reset value when field changes
      updateNodeData(nodeId, {
        condition: { ...condition, field, value: '' },
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
  const fieldKey = getFieldKeyFromPath(condition.field);

  return (
    <div className="space-y-4">
      {/* Field Selection - Human-readable dropdown */}
      <div className="space-y-2">
        <Label htmlFor="condition-field">If this field...</Label>
        <Select value={condition.field} onValueChange={handleFieldChange}>
          <SelectTrigger id="condition-field">
            <SelectValue placeholder="Select a field to check" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_FIELD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator */}
      <div className="space-y-2">
        <Label htmlFor="condition-operator">...matches this condition</Label>
        <Select value={condition.operator} onValueChange={handleOperatorChange}>
          <SelectTrigger id="condition-operator">
            <SelectValue placeholder="Select condition" />
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

      {/* Value - Context-aware input */}
      {!isValueHidden && (
        <SmartFieldInput
          field={fieldKey}
          value={String(condition.value || '')}
          onChange={handleValueChange}
          label="Value"
          placeholder="Value to compare"
        />
      )}

      {/* Info box */}
      <div className="p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground">
          The automation will take the <strong>Yes</strong> path if the condition is true, 
          or the <strong>No</strong> path if false.
        </p>
      </div>

      {/* Advanced - Custom variable path */}
      <AdvancedModeToggle storageKey="condition">
        <VariableInput
          label="Custom field (override)"
          value={condition.field}
          onChange={handleFieldChange}
          placeholder="{{custom.variable.path}}"
          categories={['lead', 'conversation', 'trigger', 'environment']}
        />
        <VariableInput
          label="Custom value (with variables)"
          value={String(condition.value || '')}
          onChange={handleValueChange}
          placeholder="{{another.variable}}"
          categories={['lead', 'conversation', 'trigger', 'environment']}
        />
      </AdvancedModeToggle>
    </div>
  );
}
