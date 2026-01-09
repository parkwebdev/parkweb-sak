/**
 * AIExtractConfigPanel Component
 * 
 * Configuration panel for AI extraction nodes.
 * Allows defining fields to extract from text.
 * 
 * @module components/automations/panels/AIExtractConfigPanel
 */

import { useCallback } from 'react';
import { Plus, Trash01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableSelect } from './VariableSelect';
import type { AIExtractNodeData, AIExtractField } from '@/types/automations';

interface AIExtractConfigPanelProps {
  nodeId: string;
  data: AIExtractNodeData;
}

const FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
] as const;

export function AIExtractConfigPanel({ nodeId, data }: AIExtractConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleChange = <K extends keyof AIExtractNodeData>(
    field: K,
    value: AIExtractNodeData[K]
  ) => {
    updateNodeData(nodeId, { [field]: value });
  };

  const addField = useCallback(() => {
    const fields = [...(data.fields || [])];
    fields.push({ name: '', type: 'string', description: '', required: false });
    handleChange('fields', fields);
  }, [data.fields]);

  const updateField = useCallback((
    index: number, 
    field: 'name' | 'type' | 'description' | 'required', 
    value: string | boolean
  ) => {
    const fields = [...(data.fields || [])];
    fields[index] = { ...fields[index], [field]: value };
    handleChange('fields', fields);
  }, [data.fields]);

  const removeField = useCallback((index: number) => {
    const fields = (data.fields || []).filter((_: AIExtractField, i: number) => i !== index);
    handleChange('fields', fields);
  }, [data.fields]);

  const outputVar = data.outputVariable || 'extracted_data';

  return (
    <div className="space-y-4">
      {/* Input Source */}
      <VariableSelect
        label="Input text"
        value={data.input || ''}
        onValueChange={(value) => handleChange('input', value)}
        categories={['lead', 'conversation', 'trigger']}
        placeholder="Select input source"
      />

      {/* Fields to Extract */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fields to Extract</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addField}
          >
            <Plus size={16} aria-hidden="true" />
            Add
          </Button>
        </div>
        
        <div className="space-y-3">
          {(data.fields || []).map((field: AIExtractField, index: number) => (
            <div key={index} className="p-3 border rounded-md space-y-2 bg-muted/50">
              <div className="flex items-center gap-2">
                <Input
                  value={field.name}
                  onChange={(e) => updateField(index, 'name', e.target.value)}
                  placeholder="Field name"
                  size="sm"
                  className="flex-1 font-mono"
                />
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(index, 'type', value)}
                >
                  <SelectTrigger className="w-24" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <IconButton
                  label="Remove field"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  <Trash01 size={16} aria-hidden="true" />
                </IconButton>
              </div>
              <Input
                value={field.description || ''}
                onChange={(e) => updateField(index, 'description', e.target.value)}
                placeholder="Description (helps AI find the right data)"
                size="sm"
              />
              <div className="flex items-center gap-2">
                <Switch
                  id={`required-${index}`}
                  checked={field.required}
                  onCheckedChange={(checked) => updateField(index, 'required', checked)}
                />
                <Label htmlFor={`required-${index}`} className="text-xs text-muted-foreground">
                  Required
                </Label>
              </div>
            </div>
          ))}
          
          {(data.fields?.length || 0) === 0 && (
            <p className="text-2xs text-muted-foreground text-center py-4">
              Add fields to extract from the input text
            </p>
          )}
        </div>
      </div>

      {/* Output Variable */}
      <div className="space-y-2">
        <Label htmlFor="outputVariable">Save result as</Label>
        <Input
          id="outputVariable"
          value={data.outputVariable || ''}
          onChange={(e) => handleChange('outputVariable', e.target.value)}
          placeholder="extracted_data"
        />
        <div className="text-2xs text-muted-foreground space-y-1">
          <p>Access in later nodes:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs font-mono">
            {`{{variables.${outputVar}.fieldName}}`}
          </code>
        </div>
      </div>
    </div>
  );
}
