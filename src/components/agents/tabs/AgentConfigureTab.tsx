import React, { useState, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type Agent = Tables<'agents'>;

const MODELS = [
  { 
    value: 'google/gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash (Default)',
    description: 'Balanced speed and quality. Best for most use cases.',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30
  },
  { 
    value: 'google/gemini-2.5-pro', 
    label: 'Gemini 2.5 Pro',
    description: 'Strongest reasoning and multimodal capabilities. Higher cost.',
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00
  },
  { 
    value: 'google/gemini-3-pro-preview', 
    label: 'Gemini 3 Pro (Preview)',
    description: 'Next-generation model. Experimental preview.',
    inputCostPer1M: 2.00,
    outputCostPer1M: 8.00
  },
  { 
    value: 'openai/gpt-5', 
    label: 'GPT-5',
    description: 'Powerful all-rounder with excellent reasoning.',
    inputCostPer1M: 5.00,
    outputCostPer1M: 15.00
  },
  { 
    value: 'openai/gpt-5-mini', 
    label: 'GPT-5 Mini',
    description: 'Lower cost alternative with strong performance.',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60
  },
];

interface AgentConfigureTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onFormChange?: (hasChanges: boolean) => void;
}

const RESPONSE_LENGTH_PRESETS = [
  { value: 'concise', label: 'Concise', tokens: 500, description: 'Short, direct answers' },
  { value: 'balanced', label: 'Balanced', tokens: 2000, description: 'Standard responses' },
  { value: 'detailed', label: 'Detailed', tokens: 4000, description: 'In-depth explanations' },
  { value: 'custom', label: 'Custom', tokens: 0, description: 'Manual control' },
];

type ConfigureSection = 'identity' | 'model' | 'behavior' | 'prompt';

const CONFIGURE_MENU_ITEMS = [
  { id: 'identity' as const, label: 'Identity' },
  { id: 'model' as const, label: 'Model & Cost' },
  { id: 'behavior' as const, label: 'Behavior' },
  { id: 'prompt' as const, label: 'System Prompt' },
];

const calculateEstimatedCost = (model: string, maxTokens: number) => {
  const modelData = MODELS.find(m => m.value === model);
  if (!modelData) return null;
  
  const avgInputTokens = 500;
  const inputCost = (avgInputTokens / 1_000_000) * modelData.inputCostPer1M;
  const outputCost = (maxTokens / 1_000_000) * modelData.outputCostPer1M;
  
  return {
    perRequest: inputCost + outputCost,
    per1000Requests: (inputCost + outputCost) * 1000,
    tier: (inputCost + outputCost) < 0.001 ? 'Budget' : (inputCost + outputCost) < 0.005 ? 'Standard' : 'Premium'
  };
};

export const AgentConfigureTab: React.FC<AgentConfigureTabProps> = ({ agent, onUpdate, onFormChange }) => {
  const [activeSection, setActiveSection] = useState<ConfigureSection>('identity');
  const deploymentConfig = (agent.deployment_config as any) || {};
  
  const getInitialPreset = () => {
    const tokens = agent.max_tokens || 2000;
    if (tokens === 500) return 'concise';
    if (tokens === 2000) return 'balanced';
    if (tokens === 4000) return 'detailed';
    return 'custom';
  };

  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
    top_p: deploymentConfig.top_p || 1.0,
    presence_penalty: deploymentConfig.presence_penalty || 0,
    frequency_penalty: deploymentConfig.frequency_penalty || 0,
    response_length_preset: getInitialPreset(),
    system_prompt: agent.system_prompt,
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
    top_p: deploymentConfig.top_p || 1.0,
    presence_penalty: deploymentConfig.presence_penalty || 0,
    frequency_penalty: deploymentConfig.frequency_penalty || 0,
    response_length_preset: getInitialPreset(),
    system_prompt: agent.system_prompt,
  });

  useEffect(() => {
    onFormChange?.(hasChanges);
  }, [hasChanges, onFormChange]);

  const handleUpdate = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    
    if (updates.response_length_preset && updates.response_length_preset !== 'custom') {
      const preset = RESPONSE_LENGTH_PRESETS.find(p => p.value === updates.response_length_preset);
      if (preset) {
        newFormData.max_tokens = preset.tokens;
      }
    }
    
    if (updates.max_tokens !== undefined && updates.response_length_preset === undefined) {
      const matchingPreset = RESPONSE_LENGTH_PRESETS.find(p => p.tokens === updates.max_tokens);
      if (!matchingPreset || matchingPreset.value === 'custom') {
        newFormData.response_length_preset = 'custom';
      } else {
        newFormData.response_length_preset = matchingPreset.value;
      }
    }
    
    setFormData(newFormData);
  };

  (AgentConfigureTab as any).handleSave = async () => {
    if (hasChanges) {
      const { top_p, presence_penalty, frequency_penalty, response_length_preset, system_prompt, ...coreFields } = formData;
      await onUpdate(agent.id, {
        ...coreFields,
        system_prompt,
        deployment_config: {
          ...deploymentConfig,
          top_p,
          presence_penalty,
          frequency_penalty,
        },
      });
    }
  };

  const costEstimate = calculateEstimatedCost(formData.model, formData.max_tokens);

  const renderIdentitySection = () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          placeholder="e.g., Customer Support Bot"
          className="mt-1.5"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          placeholder="Brief description of what this agent does"
          className="mt-1.5 min-h-[80px]"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <Label htmlFor="status" className="text-sm font-medium">Agent Status</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.status === 'active' ? 'Agent is live' : formData.status === 'paused' ? 'Agent is paused' : 'Agent is in draft'}
          </p>
        </div>
        <Switch
          id="status"
          checked={formData.status === 'active'}
          onCheckedChange={(checked) => handleUpdate({ status: checked ? 'active' : 'draft' })}
        />
      </div>
    </div>
  );

  const renderModelSection = () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="model">AI Model</Label>
        <Select
          value={formData.model}
          onValueChange={(value) => handleUpdate({ model: value })}
        >
          <SelectTrigger id="model" className="mt-1.5">
            <SelectValue placeholder="Select a model">
              {MODELS.find(m => m.value === formData.model)?.label || "Select a model"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{model.label}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {costEstimate && (
        <Card className="p-4 bg-accent/50 border-border">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">💰 Estimated Cost</h4>
            <Badge variant={costEstimate.tier === 'Budget' ? 'secondary' : costEstimate.tier === 'Standard' ? 'default' : 'destructive'}>
              {costEstimate.tier}
            </Badge>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per request:</span>
              <span className="font-medium text-foreground">${costEstimate.perRequest.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per 1,000 requests:</span>
              <span className="font-medium text-foreground">${costEstimate.per1000Requests.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              Based on ~500 input tokens per request
            </p>
          </div>
        </Card>
      )}

      <div>
        <Label htmlFor="response-length">Response Length</Label>
        <Select
          value={formData.response_length_preset}
          onValueChange={(value) => handleUpdate({ response_length_preset: value })}
        >
          <SelectTrigger id="response-length" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESPONSE_LENGTH_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.response_length_preset === 'custom' && (
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="max_tokens">Max Tokens (Advanced)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex group">
                  <InfoCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <InfoCircleIconFilled className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Maximum response length in tokens. ~4 characters per token.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="max_tokens"
            type="number"
            min={100}
            max={32000}
            step={100}
            value={formData.max_tokens ?? 2000}
            onChange={(e) => handleUpdate({ max_tokens: parseInt(e.target.value) })}
            className="mt-1.5"
          />
        </div>
      )}
    </div>
  );

  const renderBehaviorSection = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="temperature">Temperature</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex group">
                  <InfoCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <InfoCircleIconFilled className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>How creative or predictable responses are. Lower values give more focused, consistent answers. Higher values give more varied, creative responses.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {formData.temperature?.toFixed(2) ?? '0.70'}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.01}
          value={[formData.temperature ?? 0.7]}
          onValueChange={([value]) => handleUpdate({ temperature: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="presence_penalty">Presence Penalty</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex group">
                  <InfoCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <InfoCircleIconFilled className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Encourages the agent to talk about new topics. Higher values make the agent less likely to repeat subjects already discussed.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {formData.presence_penalty?.toFixed(2) ?? '0.00'}
          </span>
        </div>
        <Slider
          id="presence_penalty"
          min={0}
          max={2}
          step={0.01}
          value={[formData.presence_penalty ?? 0]}
          onValueChange={([value]) => handleUpdate({ presence_penalty: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="frequency_penalty">Frequency Penalty</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex group">
                  <InfoCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <InfoCircleIconFilled className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reduces repetitive responses. Higher values make the agent less likely to repeat the same phrases or words within a response.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {formData.frequency_penalty?.toFixed(2) ?? '0.00'}
          </span>
        </div>
        <Slider
          id="frequency_penalty"
          min={0}
          max={2}
          step={0.01}
          value={[formData.frequency_penalty ?? 0]}
          onValueChange={([value]) => handleUpdate({ frequency_penalty: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="top_p">Top P</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex group">
                  <InfoCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <InfoCircleIconFilled className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Controls response diversity. Lower values make responses more focused and deterministic. Keep at 1.0 unless you need specific control.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {formData.top_p?.toFixed(2) ?? '1.00'}
          </span>
        </div>
        <Slider
          id="top_p"
          min={0}
          max={1}
          step={0.01}
          value={[formData.top_p ?? 1.0]}
          onValueChange={([value]) => handleUpdate({ top_p: value })}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderPromptSection = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex group">
                <LightbulbIcon className="h-4 w-4 text-amber-500" />
                <LightbulbIconFilled className="h-4 w-4 text-amber-500" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium mb-1">Tips for great prompts:</p>
              <ul className="text-xs text-muted-foreground marker:text-muted-foreground/60 space-y-1 list-disc list-inside">
                <li>Be specific about the agent's role and expertise</li>
                <li>Define the tone and communication style</li>
                <li>Include any rules or limitations</li>
                <li>Specify how to handle edge cases</li>
                <li>Add examples of desired behavior</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>

        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => handleUpdate({ system_prompt: e.target.value })}
          placeholder="You are a helpful assistant that..."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <AgentSettingsLayout
        activeTab={activeSection}
        onTabChange={(tab) => setActiveSection(tab as ConfigureSection)}
        menuItems={CONFIGURE_MENU_ITEMS}
        title="Agent Configuration"
        description="Configure your agent's behavior and capabilities"
      >
        {activeSection === 'identity' && renderIdentitySection()}
        {activeSection === 'model' && renderModelSection()}
        {activeSection === 'behavior' && renderBehaviorSection()}
        {activeSection === 'prompt' && renderPromptSection()}
      </AgentSettingsLayout>
    </TooltipProvider>
  );
};
