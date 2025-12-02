import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

const MODELS = [
  { 
    value: 'google/gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash (Default)',
    description: 'Balanced speed and quality. Best for most use cases.'
  },
  { 
    value: 'google/gemini-2.5-pro', 
    label: 'Gemini 2.5 Pro',
    description: 'Strongest reasoning and multimodal capabilities. Higher cost.'
  },
  { 
    value: 'google/gemini-3-pro-preview', 
    label: 'Gemini 3 Pro (Preview)',
    description: 'Next-generation model. Experimental preview.'
  },
  { 
    value: 'openai/gpt-5', 
    label: 'GPT-5',
    description: 'Powerful all-rounder with excellent reasoning.'
  },
  { 
    value: 'openai/gpt-5-mini', 
    label: 'GPT-5 Mini',
    description: 'Lower cost alternative with strong performance.'
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

export const AgentConfigureTab = ({ agent, onUpdate, onFormChange }: AgentConfigureTabProps) => {
  const deploymentConfig = (agent.deployment_config as any) || {};
  
  // Determine initial response length preset
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
    
    // If response length preset changes, update max_tokens
    if (updates.response_length_preset && updates.response_length_preset !== 'custom') {
      const preset = RESPONSE_LENGTH_PRESETS.find(p => p.value === updates.response_length_preset);
      if (preset) {
        newFormData.max_tokens = preset.tokens;
      }
    }
    
    // If max_tokens is manually changed, switch to custom preset
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

  // Export save function for parent
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

  return (
    <TooltipProvider>
      <div className="space-y-6 min-h-full pb-8">
        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Identity */}
        <div className="p-5 rounded-lg bg-muted/30 border space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Agent Identity</h3>
            <p className="text-xs text-muted-foreground">Define how your agent presents itself</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Agent Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                placeholder="My AI Agent"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                placeholder="Brief description of what this agent does"
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                <p className="text-xs text-muted-foreground">
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
        </div>

        {/* Column 2: Model & Generation */}
        <div className="p-5 rounded-lg bg-muted/30 border space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Model & Generation</h3>
            <p className="text-xs text-muted-foreground">Configure AI model and generation parameters</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs font-medium">AI Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleUpdate({ model: value })}
              >
                <SelectTrigger id="model" className="h-9 text-sm">
                  <SelectValue placeholder="Select a model">
                    {MODELS.find(m => m.value === formData.model)?.label || "Select a model"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{model.label}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              {/* Response Length Preset */}
              <div className="space-y-1.5">
                <Label htmlFor="response_length" className="text-xs font-medium">Response Length</Label>
                <Select
                  value={formData.response_length_preset}
                  onValueChange={(value) => handleUpdate({ response_length_preset: value })}
                >
                  <SelectTrigger id="response_length" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_LENGTH_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value} className="py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show manual max_tokens input only when Custom is selected */}
              {formData.response_length_preset === 'custom' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="max_tokens" className="text-xs font-medium">Max Tokens</Label>
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
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="temperature" className="text-xs font-medium">Temperature</Label>
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
                  <span className="text-xs text-muted-foreground font-mono">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="presence_penalty" className="text-xs font-medium">Presence Penalty</Label>
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
                  <span className="text-xs text-muted-foreground font-mono">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="frequency_penalty" className="text-xs font-medium">Frequency Penalty</Label>
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
                  <span className="text-xs text-muted-foreground font-mono">
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

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="top_p" className="text-xs font-medium">Top P</Label>
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
                  <span className="text-xs text-muted-foreground font-mono">
                    {formData.top_p?.toFixed(2) ?? '0.90'}
                  </span>
                </div>
                <Slider
                  id="top_p"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[formData.top_p ?? 0.9]}
                  onValueChange={([value]) => handleUpdate({ top_p: value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: System Prompt */}
        <div className="p-5 rounded-lg bg-muted/30 border space-y-4">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-sm font-semibold mb-1">System Prompt</h3>
              <p className="text-xs text-muted-foreground">Define how your agent should behave</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex group">
                  <LightbulbIcon className="h-4 w-4 text-amber-500" />
                  <LightbulbIconFilled className="h-4 w-4 text-amber-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium mb-1">Tips for great prompts:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside marker:text-muted-foreground/60">
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
            value={formData.system_prompt}
            onChange={(e) => handleUpdate({ system_prompt: e.target.value })}
            placeholder="You are a helpful assistant that..."
            className="min-h-[300px] text-sm font-mono resize-none"
          />
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};
