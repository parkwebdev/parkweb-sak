/**
 * TriggerAIToolConfigPanel Component
 * 
 * Configuration panel for AI tool trigger nodes.
 * Allows setting tool name, description, and parameters.
 * 
 * @module components/automations/panels/TriggerAIToolConfigPanel
 */

import { useCallback } from 'react';
import { Plus, Trash01 } from '@untitledui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IconButton } from '@/components/ui/icon-button';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { TriggerAIToolNodeData } from '@/types/automations';

interface TriggerAIToolConfigPanelProps {
  nodeId: string;
  data: TriggerAIToolNodeData;
}

const PARAM_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
] as const;

export function TriggerAIToolConfigPanel({ nodeId, data }: TriggerAIToolConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleToolNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Sanitize tool name: lowercase, underscores only
      const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      updateNodeData(nodeId, { toolName: value });
    },
    [nodeId, updateNodeData]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(nodeId, { toolDescription: e.target.value });
    },
    [nodeId, updateNodeData]
  );

  const addParameter = useCallback(() => {
    const newParam = {
      name: '',
      type: 'string' as const,
      description: '',
      required: false,
    };
    updateNodeData(nodeId, {
      parameters: [...(data.parameters || []), newParam],
    });
  }, [nodeId, data.parameters, updateNodeData]);

  const updateParameter = useCallback(
    (index: number, field: string, value: unknown) => {
      const params = [...(data.parameters || [])];
      params[index] = { ...params[index], [field]: value };
      updateNodeData(nodeId, { parameters: params });
    },
    [nodeId, data.parameters, updateNodeData]
  );

  const removeParameter = useCallback(
    (index: number) => {
      const params = [...(data.parameters || [])];
      params.splice(index, 1);
      updateNodeData(nodeId, { parameters: params });
    },
    [nodeId, data.parameters, updateNodeData]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tool-name">Tool Name</Label>
        <Input
          id="tool-name"
          value={data.toolName || ''}
          onChange={handleToolNameChange}
          placeholder="my_custom_tool"
          className="font-mono text-sm"
        />
        <p className="text-2xs text-muted-foreground">
          Lowercase with underscores. This is how the AI will call this tool.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tool-description">Description</Label>
        <Textarea
          id="tool-description"
          value={data.toolDescription || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe what this tool does so the AI knows when to use it..."
          rows={3}
        />
        <p className="text-2xs text-muted-foreground">
          Help the AI understand when to use this tool.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Parameters</Label>
          <Button variant="ghost" size="sm" onClick={addParameter}>
            <Plus size={14} className="mr-1" aria-hidden="true" />
            Add
          </Button>
        </div>

        {(!data.parameters || data.parameters.length === 0) && (
          <p className="text-sm text-muted-foreground py-2">
            No parameters defined. The AI will call this tool without any inputs.
          </p>
        )}

        <div className="space-y-3">
          {data.parameters?.map((param, index) => (
            <div
              key={index}
              className="border border-border rounded-md p-3 space-y-2 bg-muted/30"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={param.name}
                    onChange={(e) => updateParameter(index, 'name', e.target.value)}
                    placeholder="Parameter name"
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={param.type}
                      onValueChange={(v) => updateParameter(index, 'type', v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARAM_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={param.required}
                        onCheckedChange={(v) => updateParameter(index, 'required', v)}
                      />
                      <span className="text-xs text-muted-foreground">Required</span>
                    </div>
                  </div>
                  <Input
                    value={param.description}
                    onChange={(e) => updateParameter(index, 'description', e.target.value)}
                    placeholder="Parameter description"
                  />
                </div>
                <IconButton
                  label="Remove parameter"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParameter(index)}
                >
                  <Trash01 size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
