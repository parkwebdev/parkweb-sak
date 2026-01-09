/**
 * AIClassifyConfigPanel Component
 * 
 * Configuration panel for AI classification nodes.
 * Simplified with human-readable input options and category presets.
 * 
 * @module components/automations/panels/AIClassifyConfigPanel
 */

import { useCallback, useState } from 'react';
import { Plus, Trash01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { useFlowStore } from '@/stores/automationFlowStore';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import { VariableInput } from './VariableInput';
import { INPUT_SOURCES, CATEGORY_PRESETS } from './panelTypes';
import type { AIClassifyNodeData, AIClassifyCategory } from '@/types/automations';

interface AIClassifyConfigPanelProps {
  nodeId: string;
  data: AIClassifyNodeData;
}

export function AIClassifyConfigPanel({ nodeId, data }: AIClassifyConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [presetOpen, setPresetOpen] = useState(false);

  const handleChange = <K extends keyof AIClassifyNodeData>(
    field: K,
    value: AIClassifyNodeData[K]
  ) => {
    updateNodeData(nodeId, { [field]: value });
  };

  const addCategory = useCallback(() => {
    const categories = [...(data.categories || [])];
    categories.push({ name: '', description: '' });
    handleChange('categories', categories);
  }, [data.categories]);

  const updateCategory = useCallback((
    index: number, 
    field: 'name' | 'description', 
    value: string
  ) => {
    const categories = [...(data.categories || [])];
    categories[index] = { ...categories[index], [field]: value };
    handleChange('categories', categories);
  }, [data.categories]);

  const removeCategory = useCallback((index: number) => {
    const categories = (data.categories || []).filter((_: AIClassifyCategory, i: number) => i !== index);
    handleChange('categories', categories);
  }, [data.categories]);

  const applyPreset = (presetKey: keyof typeof CATEGORY_PRESETS) => {
    handleChange('categories', [...CATEGORY_PRESETS[presetKey]]);
    setPresetOpen(false);
  };

  const outputVar = data.outputVariable || 'classification';

  return (
    <div className="space-y-4">
      {/* Input Source - Human-readable dropdown */}
      <div className="space-y-2">
        <Label>What to classify</Label>
        <Select
          value={data.input || ''}
          onValueChange={(value) => handleChange('input', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select what to analyze" />
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

      {/* Categories with Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
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
                    onClick={() => applyPreset('sentiment')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    Sentiment (Positive/Neutral/Negative)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('intent')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    Intent (Purchase/Support/Info)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('urgency')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    Urgency (High/Normal/Low)
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={addCategory}>
              <Plus size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          {(data.categories || []).map((category: AIClassifyCategory, index: number) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  value={category.name}
                  onChange={(e) => updateCategory(index, 'name', e.target.value)}
                  placeholder="Category name"
                  size="sm"
                />
                <Input
                  value={category.description || ''}
                  onChange={(e) => updateCategory(index, 'description', e.target.value)}
                  placeholder="When to use this category"
                  size="sm"
                />
              </div>
              <IconButton
                label="Remove category"
                variant="ghost"
                size="sm"
                onClick={() => removeCategory(index)}
              >
                <Trash01 size={16} aria-hidden="true" />
              </IconButton>
            </div>
          ))}
          
          {(data.categories?.length || 0) < 2 && (
            <p className="text-2xs text-destructive">
              Add at least 2 categories
            </p>
          )}
        </div>
      </div>

      {/* Output Preview */}
      <div className="p-3 bg-muted/50 rounded-md space-y-1">
        <p className="text-xs text-muted-foreground">Use this in later nodes:</p>
        <code className="block bg-background px-2 py-1 rounded text-xs font-mono border border-border">
          {`{{variables.${outputVar}.category}}`}
        </code>
      </div>

      {/* Advanced Settings */}
      <AdvancedModeToggle storageKey="ai_classify">
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
            placeholder="classification"
            className="font-mono text-xs"
          />
        </div>

        {/* Include Confidence */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="includeConfidence">Include confidence score</Label>
            <p className="text-2xs text-muted-foreground">
              Adds a confidence percentage to the output
            </p>
          </div>
          <Switch
            id="includeConfidence"
            checked={data.includeConfidence ?? true}
            onCheckedChange={(checked) => handleChange('includeConfidence', checked)}
          />
        </div>
      </AdvancedModeToggle>
    </div>
  );
}
