/**
 * ActionHttpConfigPanel Component
 * 
 * Configuration panel for HTTP request action nodes.
 * 
 * @module components/automations/panels/ActionHttpConfigPanel
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
import type { ActionHttpNodeData } from '@/types/automations';

interface ActionHttpConfigPanelProps {
  nodeId: string;
  data: ActionHttpNodeData;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function ActionHttpConfigPanel({ nodeId, data }: ActionHttpConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleUpdate = useCallback(
    (updates: Partial<ActionHttpNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  return (
    <div className="space-y-4">
      {/* Method */}
      <div className="space-y-2">
        <Label>HTTP Method</Label>
        <Select
          value={data.method || 'GET'}
          onValueChange={(value) => handleUpdate({ method: value as ActionHttpNodeData['method'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          placeholder="https://api.example.com/endpoint"
          value={data.url || ''}
          onChange={(e) => handleUpdate({ url: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Use {'{{variable}}'} to insert variables
        </p>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <Label>Headers (JSON)</Label>
        <Textarea
          placeholder='{"Authorization": "Bearer {{token}}"}'
          value={data.headers ? JSON.stringify(data.headers, null, 2) : ''}
          onChange={(e) => {
            try {
              const headers = e.target.value ? JSON.parse(e.target.value) : undefined;
              handleUpdate({ headers });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          rows={3}
          className="font-mono text-xs"
        />
      </div>

      {/* Body (for POST/PUT/PATCH) */}
      {data.method && ['POST', 'PUT', 'PATCH'].includes(data.method) && (
        <div className="space-y-2">
          <Label>Request Body</Label>
          <Textarea
            placeholder='{"key": "value"}'
            value={data.body || ''}
            onChange={(e) => handleUpdate({ body: e.target.value })}
            rows={4}
            className="font-mono text-xs"
          />
        </div>
      )}

      {/* Response Variable */}
      <div className="space-y-2">
        <Label>Store Response In</Label>
        <Input
          placeholder="response"
          value={data.responseVariable || ''}
          onChange={(e) => handleUpdate({ responseVariable: e.target.value })}
        />
        <p className="text-2xs text-muted-foreground">
          Variable name to store the response data
        </p>
      </div>
    </div>
  );
}
