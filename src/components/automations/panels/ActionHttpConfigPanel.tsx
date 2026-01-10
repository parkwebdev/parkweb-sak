/**
 * ActionHttpConfigPanel Component
 * 
 * Configuration panel for HTTP request action nodes.
 * Includes Quick Mode for common webhook setups.
 * 
 * @module components/automations/panels/ActionHttpConfigPanel
 */

import { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableInput } from './VariableInput';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import type { ActionHttpNodeData } from '@/types/automations';

interface ActionHttpConfigPanelProps {
  nodeId: string;
  data: ActionHttpNodeData;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

type QuickModeType = 'webhook' | 'slack' | 'custom';

/**
 * Preset configurations for quick mode
 */
const QUICK_MODE_PRESETS = {
  webhook: {
    method: 'POST' as const,
    bodyTemplate: `{
  "lead_name": "{{lead.name}}",
  "lead_email": "{{lead.email}}",
  "event": "{{trigger.event}}"
}`,
  },
  slack: {
    method: 'POST' as const,
    bodyTemplate: `{
  "text": "New lead: {{lead.name}} ({{lead.email}})"
}`,
  },
  custom: {
    method: 'GET' as const,
    bodyTemplate: '',
  },
};

/**
 * Detect quick mode from current configuration
 */
function detectQuickMode(data: ActionHttpNodeData): QuickModeType {
  if (!data.url) return 'webhook';
  if (data.url.includes('slack.com') || data.url.includes('hooks.slack')) return 'slack';
  if (data.method === 'POST' && data.body?.includes('lead_name')) return 'webhook';
  return 'custom';
}

export function ActionHttpConfigPanel({ nodeId, data }: ActionHttpConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [quickMode, setQuickMode] = useState<QuickModeType>(() => detectQuickMode(data));

  const handleUpdate = useCallback(
    (updates: Partial<ActionHttpNodeData>) => {
      updateNodeData(nodeId, { ...data, ...updates });
    },
    [nodeId, data, updateNodeData]
  );

  const handleQuickModeChange = (mode: QuickModeType) => {
    setQuickMode(mode);
    const preset = QUICK_MODE_PRESETS[mode];
    handleUpdate({
      method: preset.method,
      body: preset.bodyTemplate || data.body,
    });
  };

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
      {/* Quick Mode Selection */}
      <div className="space-y-3">
        <Label>What are you connecting to?</Label>
        <RadioGroup
          value={quickMode}
          onValueChange={(value) => handleQuickModeChange(value as QuickModeType)}
          className="grid grid-cols-3 gap-2"
        >
          <div>
            <RadioGroupItem
              value="webhook"
              id="webhook"
              className="peer sr-only"
            />
            <label
              htmlFor="webhook"
              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium">Webhook</span>
              <span className="text-2xs text-muted-foreground">Zapier, Make, n8n</span>
            </label>
          </div>
          <div>
            <RadioGroupItem
              value="slack"
              id="slack"
              className="peer sr-only"
            />
            <label
              htmlFor="slack"
              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium">Slack</span>
              <span className="text-2xs text-muted-foreground">Send messages</span>
            </label>
          </div>
          <div>
            <RadioGroupItem
              value="custom"
              id="custom"
              className="peer sr-only"
            />
            <label
              htmlFor="custom"
              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium">Custom</span>
              <span className="text-2xs text-muted-foreground">Any API</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* URL Input */}
      <VariableInput
        label={quickMode === 'slack' ? 'Slack Webhook URL' : quickMode === 'webhook' ? 'Webhook URL' : 'API URL'}
        placeholder={
          quickMode === 'slack' 
            ? 'https://hooks.slack.com/services/...'
            : quickMode === 'webhook'
            ? 'https://hooks.zapier.com/...'
            : 'https://api.example.com/endpoint'
        }
        value={data.url || ''}
        onChange={(value) => handleUpdate({ url: value })}
        categories={['environment']}
      />

      {/* Helpful hint for webhook mode */}
      {quickMode === 'webhook' && !data.url && (
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Paste your webhook URL from Zapier, Make, n8n, or any automation tool. 
            We'll send lead data automatically when this automation runs.
          </p>
        </div>
      )}

      {/* Helpful hint for Slack mode */}
      {quickMode === 'slack' && !data.url && (
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Create an <strong>Incoming Webhook</strong> in your Slack workspace settings, 
            then paste the URL here.
          </p>
        </div>
      )}

      {/* Method (only show for custom mode) */}
      {quickMode === 'custom' && (
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
      )}

      {/* Body (for POST/PUT/PATCH) */}
      {showBody && (
        <VariableInput
          label={quickMode === 'slack' ? 'Message' : 'Request Body'}
          placeholder={quickMode === 'slack' ? '{"text": "Your message here"}' : '{"name": "{{lead.name}}"}'}
          value={data.body || ''}
          onChange={(value) => handleUpdate({ body: value })}
          categories={['lead', 'conversation', 'trigger', 'environment']}
          multiline
          rows={4}
          className="font-mono text-xs"
        />
      )}

      <AdvancedModeToggle storageKey="http-panel">
        {/* Method override for non-custom modes */}
        {quickMode !== 'custom' && (
          <div className="space-y-2">
            <Label>HTTP Method (Override)</Label>
            <Select
              value={data.method || 'POST'}
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
        )}

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
      </AdvancedModeToggle>
    </div>
  );
}
