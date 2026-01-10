/**
 * AIExtractConfigPanel Component
 * 
 * Configuration panel for AI extraction nodes.
 * Simplified with human-readable input options and friendly field type labels.
 * 
 * @module components/automations/panels/AIExtractConfigPanel
 */

import { useCallback, useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useFlowStore } from '@/stores/automationFlowStore';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import { VariableInput } from './VariableInput';
import { INPUT_SOURCES } from './panelTypes';
import type { AIExtractNodeData, AIExtractField } from '@/types/automations';

interface AIExtractConfigPanelProps {
  nodeId: string;
  data: AIExtractNodeData;
}

// Friendly labels for field types
const FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
] as const;

// Field presets for common extraction use cases
const FIELD_PRESETS = {
  contact: [
    { name: 'name', type: 'string' as const, description: 'Full name of the person', required: true },
    { name: 'email', type: 'email' as const, description: 'Email address', required: false },
    { name: 'phone', type: 'phone' as const, description: 'Phone number', required: false },
    { name: 'company', type: 'string' as const, description: 'Company or organization name', required: false },
  ],
  meeting: [
    { name: 'date', type: 'date' as const, description: 'Preferred meeting date', required: true },
    { name: 'time_preference', type: 'string' as const, description: 'Morning, afternoon, or specific time', required: false },
    { name: 'meeting_type', type: 'string' as const, description: 'Call, video, or in-person', required: false },
  ],
  inquiry: [
    { name: 'topic', type: 'string' as const, description: 'Main topic or product of interest', required: true },
    { name: 'budget', type: 'string' as const, description: 'Budget range if mentioned', required: false },
    { name: 'timeline', type: 'string' as const, description: 'When they need a solution', required: false },
    { name: 'decision_maker', type: 'boolean' as const, description: 'Whether they are the decision maker', required: false },
  ],
};

export function AIExtractConfigPanel({ nodeId, data }: AIExtractConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [presetOpen, setPresetOpen] = useState(false);

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

  const applyPreset = (presetKey: keyof typeof FIELD_PRESETS) => {
    handleChange('fields', [...FIELD_PRESETS[presetKey]]);
    setPresetOpen(false);
  };

  const outputVar = data.outputVariable || 'extracted';

  return (
    <div className="space-y-4">
      {/* Input Source - Human-readable dropdown */}
      <div className="space-y-2">
        <Label>Extract from</Label>
        <Select
          value={data.input || ''}
          onValueChange={(value) => handleChange('input', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select the text to extract from" />
          </SelectTrigger>
          <SelectContent>
            {INPUT_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fields to Extract */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fields to extract</Label>
          <div className="flex gap-1">
            <Popover open={presetOpen} onOpenChange={setPresetOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  Presets
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-0">
                <div className="p-2 border-b border-border">
                  <p className="text-xs font-medium">Quick presets</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => applyPreset('contact')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    Contact info (name, email, phone)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('meeting')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    Meeting details (date, time, type)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('inquiry')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    Lead qualification (topic, budget)
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={addField}>
              <Plus size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {(data.fields || []).map((field: AIExtractField, index: number) => (
            <div key={index} className="p-3 border rounded-md space-y-2 bg-muted/30">
              <div className="flex items-center gap-2">
                <Input
                  value={field.name}
                  onChange={(e) => updateField(index, 'name', e.target.value)}
                  placeholder="Field name (e.g., company_name)"
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
                placeholder="Describe what to look for (helps AI accuracy)"
                size="sm"
              />
              <div className="flex items-center gap-2">
                <Switch
                  id={`required-${index}`}
                  checked={field.required}
                  onCheckedChange={(checked) => updateField(index, 'required', checked)}
                />
                <Label htmlFor={`required-${index}`} className="text-xs text-muted-foreground">
                  Required field
                </Label>
              </div>
            </div>
          ))}
          
          {(data.fields?.length || 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add fields you want the AI to extract from the text
            </p>
          )}
        </div>
      </div>

      {/* Output Preview */}
      <div className="p-3 bg-muted/50 rounded-md space-y-1">
        <p className="text-xs text-muted-foreground">Use extracted data in later nodes:</p>
        <code className="block bg-background px-2 py-1 rounded text-xs font-mono border border-border">
          {`{{variables.${outputVar}.field_name}}`}
        </code>
      </div>

      {/* Advanced Settings */}
      <AdvancedModeToggle storageKey="ai_extract">
        {/* Custom Input Source */}
        <VariableInput
          label="Custom input (override)"
          value={data.input || ''}
          onChange={(value) => handleChange('input', value)}
          placeholder="{{custom.variable.path}}"
          categories={['lead', 'conversation', 'trigger']}
        />

        {/* Output Variable */}
        <div className="space-y-2">
          <Label htmlFor="outputVariable">Variable name</Label>
          <Input
            id="outputVariable"
            value={data.outputVariable || ''}
            onChange={(e) => handleChange('outputVariable', e.target.value)}
            placeholder="extracted"
            className="font-mono text-xs"
          />
        </div>
      </AdvancedModeToggle>
    </div>
  );
}
