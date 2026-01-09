/**
 * AIClassifyConfigPanel Component
 * 
 * Configuration panel for AI classification nodes.
 * Allows defining categories and input source.
 * 
 * @module components/automations/panels/AIClassifyConfigPanel
 */

import { useCallback } from 'react';
import { Plus, Trash01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { IconButton } from '@/components/ui/icon-button';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableReference } from './VariableReference';
import type { AIClassifyNodeData, AIClassifyCategory } from '@/types/automations';

interface AIClassifyConfigPanelProps {
  nodeId: string;
  data: AIClassifyNodeData;
}

export function AIClassifyConfigPanel({ nodeId, data }: AIClassifyConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

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

  const outputVar = data.outputVariable || 'classification_result';

  return (
    <div className="space-y-4">
      {/* Variable Reference */}
      <VariableReference showLead showConversation showEnvironment />

      {/* Input Source */}
      <div className="space-y-2">
        <Label htmlFor="input">Input Variable</Label>
        <Input
          id="input"
          value={data.input || ''}
          onChange={(e) => handleChange('input', e.target.value)}
          placeholder="{{message.content}} or {{lead.data}}"
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addCategory}
          >
            <Plus size={16} aria-hidden="true" />
            Add
          </Button>
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
                  placeholder="Description (optional)"
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
              At least 2 categories required
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
          placeholder="classification_result"
        />
        <div className="text-2xs text-muted-foreground space-y-1">
          <p>Access in later nodes:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs font-mono">
            {`{{variables.${outputVar}.category}}`}
          </code>
        </div>
      </div>

      {/* Include Confidence */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="includeConfidence">Include Confidence</Label>
          <p className="text-2xs text-muted-foreground">
            Add confidence score to output
          </p>
        </div>
        <Switch
          id="includeConfidence"
          checked={data.includeConfidence || false}
          onCheckedChange={(checked) => handleChange('includeConfidence', checked)}
        />
      </div>
    </div>
  );
}
