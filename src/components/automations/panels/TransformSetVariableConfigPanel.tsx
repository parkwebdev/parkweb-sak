/**
 * TransformSetVariableConfigPanel Component
 * 
 * Configuration panel for setting custom variables in automations.
 * Allows defining variable name and value expression.
 * 
 * @module components/automations/panels/TransformSetVariableConfigPanel
 */

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
import type { TransformSetVariableNodeData } from '@/types/automations';

interface TransformSetVariableConfigPanelProps {
  nodeId: string;
  data: TransformSetVariableNodeData;
}

const VALUE_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
] as const;

export function TransformSetVariableConfigPanel({ nodeId, data }: TransformSetVariableConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleChange = <K extends keyof TransformSetVariableNodeData>(
    field: K,
    value: TransformSetVariableNodeData[K]
  ) => {
    updateNodeData(nodeId, { [field]: value });
  };

  const variableName = data.variableName || '';

  return (
    <div className="space-y-4">
      {/* Variable Name */}
      <div className="space-y-2">
        <Label htmlFor="variableName">Variable name</Label>
        <Input
          id="variableName"
          value={data.variableName || ''}
          onChange={(e) => handleChange('variableName', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          placeholder="my_variable"
          className="font-mono text-xs"
        />
        <p className="text-2xs text-muted-foreground">
          Only letters, numbers, and underscores
        </p>
      </div>

      {/* Value Type */}
      <div className="space-y-2">
        <Label htmlFor="valueType">Value type</Label>
        <Select
          value={data.valueType || 'string'}
          onValueChange={(value) => handleChange('valueType', value as 'string' | 'number' | 'boolean' | 'json')}
        >
          <SelectTrigger id="valueType">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {VALUE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value Expression */}
      <div className="space-y-2">
        <Label htmlFor="valueExpression">Value</Label>
        <VariableInput
          value={data.valueExpression || ''}
          onChange={(value) => handleChange('valueExpression', value)}
          placeholder="Enter value or use {{variables}}"
          categories={['lead', 'conversation', 'trigger', 'environment']}
          multiline
          rows={3}
        />
        <p className="text-2xs text-muted-foreground">
          Use variables like {"{{lead.name}}"} or static values
        </p>
      </div>

      {/* Output Variable Preview */}
      {variableName && (
        <div className="p-3 bg-muted/50 rounded-md space-y-1">
          <p className="text-xs text-muted-foreground">Use this in later nodes:</p>
          <code className="block bg-background px-2 py-1 rounded text-xs font-mono border border-border">
            {`{{variables.${variableName}}}`}
          </code>
        </div>
      )}
    </div>
  );
}
