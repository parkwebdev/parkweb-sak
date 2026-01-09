/**
 * AIGenerateConfigPanel Component
 * 
 * Configuration panel for AI text generation nodes.
 * Allows setting prompt, model, and output settings.
 * 
 * @module components/automations/panels/AIGenerateConfigPanel
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableInput } from './VariableInput';
import type { AIGenerateNodeData } from '@/types/automations';

interface AIGenerateConfigPanelProps {
  nodeId: string;
  data: AIGenerateNodeData;
}

const AI_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Default)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
] as const;

const OUTPUT_FORMATS = [
  { value: 'text', label: 'Plain Text' },
  { value: 'json', label: 'JSON' },
] as const;

export function AIGenerateConfigPanel({ nodeId, data }: AIGenerateConfigPanelProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleChange = <K extends keyof AIGenerateNodeData>(
    field: K,
    value: AIGenerateNodeData[K]
  ) => {
    updateNodeData(nodeId, { [field]: value });
  };

  const outputVar = data.outputVariable || 'ai_response';

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <VariableInput
        label="Prompt"
        placeholder="Enter your prompt. Use variables for dynamic values."
        value={data.prompt || ''}
        onChange={(value) => handleChange('prompt', value)}
        categories={['lead', 'conversation', 'trigger', 'environment']}
        multiline
        rows={5}
      />

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          value={data.model || 'google/gemini-2.5-flash'}
          onValueChange={(value) => handleChange('model', value)}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-xs text-muted-foreground">
            {(data.temperature ?? 0.7).toFixed(1)}
          </span>
        </div>
        <Slider
          id="temperature"
          value={[data.temperature ?? 0.7]}
          onValueChange={([value]) => handleChange('temperature', value)}
          min={0}
          max={2}
          step={0.1}
        />
        <p className="text-2xs text-muted-foreground">
          Lower = more focused, Higher = more creative
        </p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <Label htmlFor="maxTokens">Max Tokens</Label>
        <Input
          id="maxTokens"
          type="number"
          value={data.maxTokens ?? 500}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value, 10) || 500)}
          min={1}
          max={4096}
        />
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <Label htmlFor="outputFormat">Output Format</Label>
        <Select
          value={data.outputFormat || 'text'}
          onValueChange={(value) => handleChange('outputFormat', value as 'text' | 'json')}
        >
          <SelectTrigger id="outputFormat">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {OUTPUT_FORMATS.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Output Variable */}
      <div className="space-y-2">
        <Label htmlFor="outputVariable">Save response as</Label>
        <Input
          id="outputVariable"
          value={data.outputVariable || ''}
          onChange={(e) => handleChange('outputVariable', e.target.value)}
          placeholder="ai_response"
        />
        <div className="text-2xs text-muted-foreground space-y-1">
          <p>Access in later nodes:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs font-mono">
            {`{{variables.${outputVar}}}`}
          </code>
        </div>
      </div>
    </div>
  );
}
