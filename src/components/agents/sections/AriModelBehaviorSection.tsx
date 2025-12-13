/**
 * AriModelBehaviorSection
 * 
 * Model selection and behavior parameters.
 */

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircleIcon } from '@/components/ui/info-circle-icon';
import { AriSectionHeader } from './AriSectionHeader';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';

// Import model icons
import GeminiIcon from '@/assets/model-icons/gemini.svg';
import OpenAIIcon from '@/assets/model-icons/openai.svg';
import ClaudeIcon from '@/assets/model-icons/claude.svg';
import MetaIcon from '@/assets/model-icons/meta.svg';
import DeepSeekIcon from '@/assets/model-icons/deepseek.svg';
import QwenIcon from '@/assets/model-icons/qwen.svg';
import MistralIcon from '@/assets/model-icons/mistral.svg';

type Agent = Tables<'agents'>;

interface AriModelBehaviorSectionProps {
  agent: Agent;
  onUpdate: (id: string, updates: Partial<Agent>) => Promise<Agent | null | void>;
}

// Model capability definitions
interface ModelCapabilities {
  temperature: { supported: boolean; min?: number; max?: number; default?: number };
  topP: { supported: boolean; min?: number; max?: number; default?: number };
  presencePenalty: { supported: boolean; min?: number; max?: number; default?: number };
  frequencyPenalty: { supported: boolean; min?: number; max?: number; default?: number };
  topK: { supported: boolean; min?: number; max?: number; default?: number };
}

const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'google/gemini-2.5-flash': {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 64, default: 40 },
  },
  'google/gemini-2.5-pro': {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 64, default: 40 },
  },
  'openai/gpt-4o': {
    temperature: { supported: true, min: 0, max: 2, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: false },
  },
  'anthropic/claude-sonnet-4': {
    temperature: { supported: true, min: 0, max: 1, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 500, default: 0 },
  },
};

const getModelCapabilities = (model: string): ModelCapabilities => {
  return MODEL_CAPABILITIES[model] || {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: false },
  };
};

const getModelIcon = (provider: string, size: number = 18) => {
  const iconMap: Record<string, string> = {
    google: GeminiIcon,
    gemini: GeminiIcon,
    openai: OpenAIIcon,
    anthropic: ClaudeIcon,
    claude: ClaudeIcon,
    meta: MetaIcon,
    llama: MetaIcon,
    deepseek: DeepSeekIcon,
    qwen: QwenIcon,
    mistral: MistralIcon,
  };
  const src = iconMap[provider];
  if (!src) return null;
  const darkModeClass = provider === 'openai' ? 'dark:invert' : '';
  return <img src={src} alt="" className={`shrink-0 ${darkModeClass}`} style={{ width: size, height: size }} />;
};

// Grouped models by provider
const MODEL_GROUPS = [
  {
    provider: 'google',
    label: 'Google',
    models: [
      { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', recommended: true },
      { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    models: [
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
    ],
  },
  {
    provider: 'anthropic',
    label: 'Anthropic',
    models: [
      { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', recommended: true },
      { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
    ],
  },
  {
    provider: 'other',
    label: 'Other',
    models: [
      { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', iconProvider: 'qwen' },
      { value: 'mistralai/mistral-medium-3.1', label: 'Mistral Medium 3.1', iconProvider: 'mistral' },
      { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', iconProvider: 'meta' },
      { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3', iconProvider: 'deepseek' },
    ],
  },
];

// Flat list for value lookups
const ALL_MODELS = MODEL_GROUPS.flatMap(g => 
  g.models.map(m => ({ ...m, provider: (m as any).iconProvider || g.provider }))
);

const RESPONSE_LENGTH_PRESETS = [
  { value: 'concise', label: 'Concise', tokens: 500 },
  { value: 'balanced', label: 'Balanced', tokens: 2000 },
  { value: 'detailed', label: 'Detailed', tokens: 4000 },
];

export const AriModelBehaviorSection: React.FC<AriModelBehaviorSectionProps> = ({ agent, onUpdate }) => {
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const deploymentConfig = (agent.deployment_config || {}) as AgentDeploymentConfig;

  const [formData, setFormData] = useState({
    model: agent.model,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    top_p: deploymentConfig.top_p || 1.0,
    top_k: deploymentConfig.top_k || 40,
  });

  useEffect(() => {
    const config = (agent.deployment_config || {}) as AgentDeploymentConfig;
    setFormData({
      model: agent.model,
      temperature: agent.temperature || 0.7,
      max_tokens: agent.max_tokens || 2000,
      top_p: config.top_p || 1.0,
      top_k: config.top_k || 40,
    });
  }, [agent.id]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const saveToDatabase = async (data: typeof formData) => {
    const { top_p, top_k, ...coreFields } = data;
    await onUpdate(agent.id, {
      ...coreFields,
      deployment_config: {
        ...deploymentConfig,
        top_p,
        top_k,
      },
    });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleUpdate = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveToDatabase(newFormData), 1000);
  };

  const capabilities = getModelCapabilities(formData.model);

  return (
    <div>
      <AriSectionHeader
        title="Model & Behavior"
        description="Choose your AI model and fine-tune response creativity"
        showSaved={showSaved}
      />

      <div className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">AI Model</Label>
          <Select value={formData.model} onValueChange={(value) => handleUpdate({ model: value })}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_GROUPS.map((group) => (
                <SelectGroup key={group.provider}>
                  <SelectLabel className="flex items-center gap-2 py-2 px-2">
                    {getModelIcon(group.provider, 16)}
                    <span className="font-semibold text-foreground">{group.label}</span>
                  </SelectLabel>
                  {group.models.map((model) => {
                    const iconProvider = (model as any).iconProvider || group.provider;
                    return (
                      <SelectItem 
                        key={model.value} 
                        value={model.value}
                        className="data-[state=checked]:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          {getModelIcon(iconProvider, 16)}
                          <span>{model.label}</span>
                          {model.recommended && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Popular</Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Response Length */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Response Length</Label>
          <Select 
            value={RESPONSE_LENGTH_PRESETS.find(p => p.tokens === formData.max_tokens)?.value || 'balanced'}
            onValueChange={(value) => {
              const preset = RESPONSE_LENGTH_PRESETS.find(p => p.value === value);
              if (preset) handleUpdate({ max_tokens: preset.tokens });
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESPONSE_LENGTH_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperature */}
        {capabilities.temperature.supported && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Temperature</Label>
              <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[formData.temperature]}
              onValueChange={([value]) => handleUpdate({ temperature: value })}
              min={capabilities.temperature.min}
              max={capabilities.temperature.max}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>
        )}

        {/* Top P */}
        {capabilities.topP.supported && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Top P</Label>
              <span className="text-sm text-muted-foreground">{formData.top_p.toFixed(2)}</span>
            </div>
            <Slider
              value={[formData.top_p]}
              onValueChange={([value]) => handleUpdate({ top_p: value })}
              min={capabilities.topP.min}
              max={capabilities.topP.max}
              step={0.05}
            />
          </div>
        )}

        {/* Top K (Gemini) */}
        {capabilities.topK.supported && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Top K</Label>
              <span className="text-sm text-muted-foreground">{formData.top_k}</span>
            </div>
            <Slider
              value={[formData.top_k]}
              onValueChange={([value]) => handleUpdate({ top_k: value })}
              min={capabilities.topK.min}
              max={capabilities.topK.max}
              step={1}
            />
          </div>
        )}
      </div>
    </div>
  );
};
