/**
 * ActionSupabaseConfigPanel Component
 * 
 * Configuration panel for Supabase database action nodes.
 * 
 * @module components/automations/panels/ActionSupabaseConfigPanel
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
import type { ActionSupabaseNodeData } from '@/types/automations';

interface ActionSupabaseConfigPanelProps {
  nodeId: string;
  data: ActionSupabaseNodeData;
}

const OPERATIONS = ['select', 'insert', 'update', 'delete', 'upsert'] as const;

const COMMON_TABLES = [
  'leads',
  'conversations',
  'messages',
  'calendar_events',
  'notifications',
] as const;

export function ActionSupabaseConfigPanel({ nodeId, data }: ActionSupabaseConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleUpdate = useCallback(
    (updates: Partial<ActionSupabaseNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  return (
    <div className="space-y-4">
      {/* Operation */}
      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={data.operation || 'select'}
          onValueChange={(value) => handleUpdate({ operation: value as ActionSupabaseNodeData['operation'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATIONS.map((op) => (
              <SelectItem key={op} value={op}>
                {op.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="space-y-2">
        <Label>Table</Label>
        <Select
          value={data.table || ''}
          onValueChange={(value) => handleUpdate({ table: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a table" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TABLES.map((table) => (
              <SelectItem key={table} value={table}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs text-muted-foreground">
          Or enter a custom table name below
        </p>
        <Input
          placeholder="Custom table name"
          value={data.table || ''}
          onChange={(e) => handleUpdate({ table: e.target.value })}
        />
      </div>

      {/* Filters (for select, update, delete) */}
      {data.operation !== 'insert' && (
        <div className="space-y-2">
          <Label>Filters (JSON)</Label>
          <Textarea
            placeholder='{"status": "active", "user_id": "{{userId}}"}'
            value={data.filters ? JSON.stringify(data.filters, null, 2) : ''}
            onChange={(e) => {
              try {
                const filters = e.target.value ? JSON.parse(e.target.value) : undefined;
                handleUpdate({ filters });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={3}
            className="font-mono text-xs"
          />
          <p className="text-2xs text-muted-foreground">
            Use {'{{variable}}'} to reference variables
          </p>
        </div>
      )}

      {/* Data (for insert, update, upsert) */}
      {data.operation && ['insert', 'update', 'upsert'].includes(data.operation) && (
        <div className="space-y-2">
          <Label>Data (JSON)</Label>
          <Textarea
            placeholder='{"name": "{{leadName}}", "email": "{{email}}"}'
            value={data.data ? JSON.stringify(data.data, null, 2) : ''}
            onChange={(e) => {
              try {
                const dataValue = e.target.value ? JSON.parse(e.target.value) : undefined;
                handleUpdate({ data: dataValue });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            className="font-mono text-xs"
          />
        </div>
      )}

      {/* Select columns (for select) */}
      {data.operation === 'select' && (
        <div className="space-y-2">
          <Label>Select Columns</Label>
          <Input
            placeholder="*, id, name, email"
            value={data.columns || ''}
            onChange={(e) => handleUpdate({ columns: e.target.value })}
          />
          <p className="text-2xs text-muted-foreground">
            Comma-separated list of columns, or * for all
          </p>
        </div>
      )}

      {/* Response Variable */}
      <div className="space-y-2">
        <Label>Store Result In</Label>
        <Input
          placeholder="result"
          value={data.responseVariable || ''}
          onChange={(e) => handleUpdate({ responseVariable: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Variable name to store the query result
        </p>
      </div>
    </div>
  );
}
