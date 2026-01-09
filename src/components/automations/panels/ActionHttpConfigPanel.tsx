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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableInput } from './VariableInput';
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

  const headersString = data.headers
    ? JSON.stringify(data.headers, null, 2)
    : '';

  const handleHeadersChange = (value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : undefined;
      handleUpdate({ headers: parsed });
    } catch {
      // Allow invalid JSON while typing
    }
  };

  const showBody = data.method && ['POST', 'PUT', 'PATCH'].includes(data.method);
  const responseVar = data.responseVariable || 'response';

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
      <VariableInput
        label="URL"
        placeholder="https://api.example.com/endpoint"
        value={data.url || ''}
        onChange={(value) => handleUpdate({ url: value })}
        categories={['lead', 'trigger', 'environment']}
      />

      {/* Headers */}
      <VariableInput
        label="Headers (JSON)"
        placeholder={'{"Authorization": "Bearer {{env.api_key}}"}'}
        value={headersString}
        onChange={handleHeadersChange}
        categories={['environment', 'trigger']}
        multiline
        rows={3}
        className="font-mono text-xs"
      />

      {/* Body (for POST/PUT/PATCH) */}
      {showBody && (
        <VariableInput
          label="Request Body"
          placeholder={'{"name": "{{lead.name}}"}'}
          value={data.body || ''}
          onChange={(value) => handleUpdate({ body: value })}
          categories={['lead', 'conversation', 'trigger', 'environment']}
          multiline
          rows={4}
          className="font-mono text-xs"
        />
      )}

      {/* Response Variable */}
      <div className="space-y-2">
        <Label>Save response as</Label>
        <Input
          placeholder="response"
          value={data.responseVariable || ''}
          onChange={(e) => handleUpdate({ responseVariable: e.target.value })}
        />
        <div className="text-2xs text-muted-foreground space-y-1">
          <p>Access in later nodes:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs font-mono">
            {`{{variables.${responseVar}.body}}`}
          </code>
        </div>
      </div>
    </div>
  );
}
