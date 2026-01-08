/**
 * ActionTaskConfigPanel Component
 * 
 * Configuration panel for task creation action nodes.
 * 
 * @module components/automations/panels/ActionTaskConfigPanel
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { ActionTaskNodeData } from '@/types/automations';

interface ActionTaskConfigPanelProps {
  nodeId: string;
  data: ActionTaskNodeData;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export function ActionTaskConfigPanel({ nodeId, data }: ActionTaskConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleUpdate = useCallback(
    (updates: Partial<ActionTaskNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  return (
    <div className="space-y-4">
      {/* Task Title */}
      <div className="space-y-2">
        <Label>Task Title</Label>
        <Input
          placeholder="Follow up with {{leadName}}"
          value={data.taskTitle || ''}
          onChange={(e) => handleUpdate({ taskTitle: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Use {'{{variable}}'} to insert dynamic values
        </p>
      </div>

      {/* Task Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Task details and instructions..."
          value={data.taskDescription || ''}
          onChange={(e) => handleUpdate({ taskDescription: e.target.value })}
          rows={3}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={data.priority || 'medium'}
          onValueChange={(value) => handleUpdate({ priority: value as ActionTaskNodeData['priority'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <Label>Assignee</Label>
        <Input
          placeholder="user@example.com or {{assignee}}"
          value={data.assignee || ''}
          onChange={(e) => handleUpdate({ assignee: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Email or user ID of the assignee
        </p>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Due Date</Label>
        <Input
          placeholder="+3 days, 2025-12-31, or {{dueDate}}"
          value={data.dueDate || ''}
          onChange={(e) => handleUpdate({ dueDate: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Relative (+3 days), absolute, or variable
        </p>
      </div>

      {/* Lead ID (optional link) */}
      <div className="space-y-2">
        <Label>Link to Lead (optional)</Label>
        <Input
          placeholder="{{leadId}}"
          value={data.leadId || ''}
          onChange={(e) => handleUpdate({ leadId: e.target.value })}
        />
      </div>
    </div>
  );
}
