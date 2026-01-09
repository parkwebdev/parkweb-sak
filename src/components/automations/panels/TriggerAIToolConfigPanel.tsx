/**
 * TriggerAIToolConfigPanel Component
 * 
 * Configuration panel for Ari Action trigger nodes.
 * Allows setting action name, when to use it, and info to collect.
 * 
 * @module components/automations/panels/TriggerAIToolConfigPanel
 */

import { useCallback } from 'react';
import { Plus, Trash01, InfoCircle } from '@untitledui/icons';
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
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
] as const;

export function TriggerAIToolConfigPanel({ nodeId, data }: TriggerAIToolConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleActionNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Sanitize: lowercase, underscores only
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
      {/* Helpful context callout */}
      <div className="bg-accent/50 border border-accent rounded-md p-3 flex gap-2">
        <InfoCircle size={16} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Ari will use this action during conversations when appropriate. 
          For example: schedule callbacks, check availability, or send notifications.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="action-name">Action Name</Label>
        <Input
          id="action-name"
          value={data.toolName || ''}
          onChange={handleActionNameChange}
          placeholder="schedule_callback"
          className="font-mono text-sm"
        />
        <p className="text-2xs text-muted-foreground">
          e.g. schedule_callback, check_availability, send_confirmation
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="when-to-use">When should Ari use this?</Label>
        <Textarea
          id="when-to-use"
          value={data.toolDescription || ''}
          onChange={handleDescriptionChange}
          placeholder="When a customer wants to schedule a callback or phone consultation..."
          rows={3}
        />
        <p className="text-2xs text-muted-foreground">
          Describe the situation when Ari should trigger this action.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Information to collect</Label>
          <Button variant="ghost" size="sm" onClick={addParameter}>
            <Plus size={14} className="mr-1" aria-hidden="true" />
            Add
          </Button>
        </div>

        {(!data.parameters || data.parameters.length === 0) && (
          <p className="text-sm text-muted-foreground py-2">
            No information needed. Ari will run this action without collecting any details.
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
                    placeholder="e.g. phone_number, preferred_time"
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
                    placeholder="What should Ari ask for? e.g. 'The customer's phone number'"
                  />
                </div>
                <IconButton
                  label="Remove"
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
