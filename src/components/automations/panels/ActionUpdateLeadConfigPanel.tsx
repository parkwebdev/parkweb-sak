/**
 * ActionUpdateLeadConfigPanel Component
 * 
 * Configuration panel for lead update action nodes.
 * 
 * @module components/automations/panels/ActionUpdateLeadConfigPanel
 */

import { useCallback } from 'react';
import { Plus, Trash01 } from '@untitledui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableReference } from './VariableReference';
import type { ActionUpdateLeadNodeData, LeadFieldUpdate } from '@/types/automations';

interface ActionUpdateLeadConfigPanelProps {
  nodeId: string;
  data: ActionUpdateLeadNodeData;
}

const LEAD_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'status', label: 'Status' },
  { value: 'stage_id', label: 'Stage' },
  { value: 'data.priority', label: 'Priority' },
  { value: 'data.notes', label: 'Notes' },
];

export function ActionUpdateLeadConfigPanel({ nodeId, data }: ActionUpdateLeadConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleUpdate = useCallback(
    (updates: Partial<ActionUpdateLeadNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  const addField = useCallback(() => {
    const fields = data.fields || [];
    handleUpdate({
      fields: [...fields, { field: 'name', value: '' }],
    });
  }, [data.fields, handleUpdate]);

  const updateField = useCallback(
    (index: number, update: Partial<LeadFieldUpdate>) => {
      const fields = [...(data.fields || [])];
      fields[index] = { ...fields[index], ...update };
      handleUpdate({ fields });
    },
    [data.fields, handleUpdate]
  );

  const removeField = useCallback(
    (index: number) => {
      const fields = (data.fields || []).filter((_, i) => i !== index);
      handleUpdate({ fields });
    },
    [data.fields, handleUpdate]
  );

  return (
    <div className="space-y-4">
      {/* Variable Reference */}
      <VariableReference showLead showEnvironment />

      {/* Lead Source */}
      <div className="space-y-2">
        <Label>Lead Source</Label>
        <Input
          placeholder="{{lead.id}}"
          value={data.leadId || '{{lead.id}}'}
          onChange={(e) => handleUpdate({ leadId: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Leave as {'{{lead.id}}'} to use the trigger lead
        </p>
      </div>

      {/* Fields to Update */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fields to Update</Label>
          <Button variant="ghost" size="sm" onClick={addField}>
            <Plus size={14} aria-hidden="true" className="mr-1" />
            Add Field
          </Button>
        </div>

        {(!data.fields || data.fields.length === 0) && (
          <p className="text-sm text-muted-foreground italic py-2">
            No fields configured. Click "Add Field" to start.
          </p>
        )}

        {data.fields?.map((field, index) => (
          <div key={index} className="space-y-2 p-3 border border-border rounded-md">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={field.field}
                  onValueChange={(value) => updateField(index, { field: value })}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              placeholder="New value or {{variable}}"
              value={field.value}
              onChange={(e) => updateField(index, { value: e.target.value })}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
