/**
 * AIGenerateConfigPanel Component
 * 
 * Configuration panel for AI text generation nodes.
 * Simplified with prompt templates and advanced settings hidden by default.
 * 
 * @module components/automations/panels/AIGenerateConfigPanel
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { File06 } from '@untitledui/icons';
import { useFlowStore } from '@/stores/automationFlowStore';
import { VariableInput } from './VariableInput';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import { PROMPT_TEMPLATES } from './panelTypes';
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
  const [templateOpen, setTemplateOpen] = useState(false);

  const handleChange = <K extends keyof AIGenerateNodeData>(
    field: K,
    value: AIGenerateNodeData[K]
  ) => {
    updateNodeData(nodeId, { [field]: value });
  };

  const applyTemplate = (prompt: string) => {
    handleChange('prompt', prompt);
    setTemplateOpen(false);
  };

  const outputVar = data.outputVariable || 'ai_response';

  return (
    <div className="space-y-4">
      {/* Prompt with Templates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt">What should the AI do?</Label>
          <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <File06 size={14} aria-hidden="true" className="mr-1" />
                Templates
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="p-2 border-b border-border">
                <p className="text-xs font-medium">Quick templates</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {PROMPT_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyTemplate(template.prompt)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <div className="text-sm font-medium">{template.label}</div>
                    <div className="text-2xs text-muted-foreground truncate">
                      {template.prompt.slice(0, 50)}...
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <VariableInput
          value={data.prompt || ''}
          onChange={(value) => handleChange('prompt', value)}
          placeholder="Describe what you want the AI to generate..."
          categories={['lead', 'conversation', 'trigger', 'environment']}
          multiline
          rows={5}
        />
      </div>

      {/* Response Type (simplified label) */}
      <div className="space-y-2">
        <Label htmlFor="outputFormat">Response type</Label>
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

      {/* Output Variable Preview (read-only style) */}
      <div className="p-3 bg-muted/50 rounded-md space-y-1">
        <p className="text-xs text-muted-foreground">Use this in later nodes:</p>
        <code className="block bg-background px-2 py-1 rounded text-xs font-mono border border-border">
          {`{{variables.${outputVar}}}`}
        </code>
      </div>

      {/* Advanced Settings */}
      <AdvancedModeToggle storageKey="ai_generate">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">AI Model</Label>
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
            <Label htmlFor="temperature">Creativity</Label>
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
          <Label htmlFor="maxTokens">Max response length</Label>
          <Input
            id="maxTokens"
            type="number"
            value={data.maxTokens ?? 500}
            onChange={(e) => handleChange('maxTokens', parseInt(e.target.value, 10) || 500)}
            min={1}
            max={4096}
          />
          <p className="text-2xs text-muted-foreground">
            Maximum tokens in the response
          </p>
        </div>

        {/* Output Variable */}
        <div className="space-y-2">
          <Label htmlFor="outputVariable">Variable name</Label>
          <Input
            id="outputVariable"
            value={data.outputVariable || ''}
            onChange={(e) => handleChange('outputVariable', e.target.value)}
            placeholder="ai_response"
            className="font-mono text-xs"
          />
        </div>
      </AdvancedModeToggle>
    </div>
  );
}
