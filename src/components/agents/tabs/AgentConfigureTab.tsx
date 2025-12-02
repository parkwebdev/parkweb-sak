import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

const BEHAVIOR_SLIDERS = [
  {
    id: 'temperature' as const,
    label: 'Temperature',
    min: 0,
    max: 2,
    contextTitle: 'Creativity vs Consistency',
    contextDescription: 'Temperature controls the randomness of your agent\'s responses. At 0, responses are highly focused and deterministic—great for factual Q&A or support. At 1+, responses become more creative and varied—ideal for brainstorming or creative writing. Most agents work well between 0.5-0.8.',
    lowLabel: 'Focused & Predictable',
    highLabel: 'Creative & Varied',
  },
  {
    id: 'presence_penalty' as const,
    label: 'Presence Penalty',
    min: 0,
    max: 2,
    contextTitle: 'Topic Diversity',
    contextDescription: 'Presence penalty encourages your agent to explore new topics rather than dwelling on subjects already mentioned. At 0, the agent may repeatedly reference the same topics. Higher values push the agent to introduce fresh subjects. Useful for agents that need to cover broad ground or avoid redundancy.',
    lowLabel: 'May Repeat Topics',
    highLabel: 'Explores New Topics',
  },
  {
    id: 'frequency_penalty' as const,
    label: 'Frequency Penalty',
    min: 0,
    max: 2,
    contextTitle: 'Response Variation',
    contextDescription: 'Frequency penalty reduces word and phrase repetition within responses. At 0, the agent may use the same words or phrases multiple times. Higher values encourage more varied vocabulary. Helpful for agents that generate longer content or need to sound more natural.',
    lowLabel: 'May Repeat Phrases',
    highLabel: 'Varied Vocabulary',
  },
  {
    id: 'top_p' as const,
    label: 'Top P',
    min: 0,
    max: 1,
    contextTitle: 'Response Diversity (Advanced)',
    contextDescription: 'Top P (nucleus sampling) controls the pool of words the model considers for each token. At 1.0, all words are considered. Lower values restrict to only the most likely words, making output more focused. Most users should keep this at 1.0 and use Temperature instead for control.',
    lowLabel: 'Highly Focused',
    highLabel: 'Full Diversity',
  },
];

const CONFIGURE_MENU_ITEMS = [
  { id: 'identity' as const, label: 'Identity', description: 'Set your agent\'s name and description' },
  { id: 'model' as const, label: 'Model & Cost', description: 'Choose the AI model, response length, and view estimated costs' },
  { id: 'behavior' as const, label: 'Behavior', description: 'Fine-tune creativity, topic diversity, and response variation' },
  { id: 'prompt' as const, label: 'System Prompt', description: 'Define your agent\'s personality, role, and communication style' },
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
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
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
    <div className="space-y-6">
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
    </div>
  );

  const renderModelSection = () => (
    <div className="space-y-6">
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

      <div>
        <Label htmlFor="response-length">Response Length</Label>
        <Select
          value={formData.response_length_preset}
          onValueChange={(value) => handleUpdate({ response_length_preset: value })}
        >
          <SelectTrigger id="response-length" className="mt-1.5">
            <SelectValue>
              {RESPONSE_LENGTH_PRESETS.find(p => p.value === formData.response_length_preset)?.label}
            </SelectValue>
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
    </div>
  );

  const renderBehaviorSection = () => {
    const currentSliderInfo = BEHAVIOR_SLIDERS.find(s => s.id === activeSlider);
    
    return (
      <div className="flex gap-8">
        {/* Left column: Sliders */}
        <div className="flex-1 space-y-6">
          {BEHAVIOR_SLIDERS.map((slider) => (
            <div 
              key={slider.id}
              className="space-y-3"
              onMouseEnter={() => setActiveSlider(slider.id)}
              onMouseLeave={() => setActiveSlider(null)}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor={slider.id}>{slider.label}</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {(formData[slider.id as keyof typeof formData] as number)?.toFixed(2) || (slider.id === 'top_p' ? '1.00' : '0.00')}
                </span>
              </div>
              <Slider
                id={slider.id}
                min={slider.min}
                max={slider.max}
                step={0.01}
                value={[(formData[slider.id as keyof typeof formData] as number) || (slider.id === 'top_p' ? 1 : slider.id === 'temperature' ? 0.7 : 0)]}
                onValueChange={([value]) => handleUpdate({ [slider.id]: value })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{slider.lowLabel}</span>
                <span>{slider.highLabel}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right column: Contextual info panel */}
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-8 p-4 rounded-lg bg-accent/30 border border-border/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlider || 'default'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {currentSliderInfo ? (
                  <>
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      {currentSliderInfo.contextTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentSliderInfo.contextDescription}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Hover over a slider to see detailed information about how it affects your agent's behavior.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  const renderPromptSection = () => (
    <div className="space-y-6">
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
        title="Configure"
        description={CONFIGURE_MENU_ITEMS.find(item => item.id === activeSection)?.description || ''}
      >
        {activeSection === 'identity' && renderIdentitySection()}
        {activeSection === 'model' && renderModelSection()}
        {activeSection === 'behavior' && renderBehaviorSection()}
        {activeSection === 'prompt' && renderPromptSection()}
      </AgentSettingsLayout>
    </TooltipProvider>
  );
};
