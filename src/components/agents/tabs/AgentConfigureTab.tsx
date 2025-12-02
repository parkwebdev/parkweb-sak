import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Lightbulb01 } from '@untitledui/icons';
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

export const AgentConfigureTab = ({ agent, onUpdate, onFormChange }: AgentConfigureTabProps) => {
  const deploymentConfig = (agent.deployment_config as any) || {};
  
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
    top_p: deploymentConfig.top_p || 1.0,
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
    system_prompt: agent.system_prompt,
  });

  useEffect(() => {
    onFormChange?.(hasChanges);
  }, [hasChanges, onFormChange]);

  const handleUpdate = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
  };

  // Export save function for parent
  (AgentConfigureTab as any).handleSave = async () => {
    if (hasChanges) {
      const { top_p, system_prompt, ...coreFields } = formData;
      await onUpdate(agent.id, {
        ...coreFields,
        system_prompt,
        deployment_config: {
          ...deploymentConfig,
          top_p,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Identity */}
        <div className="space-y-4 p-5 rounded-lg bg-muted/30 border">
          <div>
            <h3 className="text-sm font-semibold mb-1">Identity</h3>
            <p className="text-xs text-muted-foreground">Define your agent's basic information</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                placeholder="My Agent"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="status" className="text-sm">Status</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.status === 'active' ? 'Agent is live' : 'Agent is inactive'}
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => 
                  handleUpdate({ status: checked ? 'active' : 'draft' })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                placeholder="A brief description of what this agent does"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Model & Generation */}
        <div className="space-y-4">
          {/* Model & Generation Settings */}
          <div className="p-5 rounded-lg bg-muted/30 border space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">Model & Generation</h3>
              <p className="text-xs text-muted-foreground">Configure AI model and response parameters</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select value={formData.model} onValueChange={(value) => handleUpdate({ model: value })}>
                  <SelectTrigger id="model">
                    <SelectValue>
                      {MODELS.find(m => m.value === formData.model)?.label || 'Select model'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature" className="text-sm">Temperature</Label>
                  <span className="text-sm font-mono text-muted-foreground">{formData.temperature}</span>
                </div>
                <div className="relative">
                  <Slider
                    id="temperature"
                    value={[formData.temperature]}
                    onValueChange={([value]) => handleUpdate({ temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    className="[&_[role=slider]]:border-primary [&_[role=slider]]:ring-offset-background [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-indigo-500 [&_.bg-primary]:to-purple-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher = more creative, Lower = more focused
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top_p" className="text-sm">Top P</Label>
                  <span className="text-sm font-mono text-muted-foreground">{formData.top_p}</span>
                </div>
                <div className="relative">
                  <Slider
                    id="top_p"
                    value={[formData.top_p]}
                    onValueChange={([value]) => handleUpdate({ top_p: value })}
                    min={0}
                    max={1}
                    step={0.05}
                    className="[&_[role=slider]]:border-primary [&_[role=slider]]:ring-offset-background [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-indigo-500 [&_.bg-primary]:to-purple-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Controls response diversity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens" className="text-sm">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => handleUpdate({ max_tokens: parseInt(e.target.value) })}
                  min={1}
                  max={8000}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum response length
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt - Full Width Below */}
      <div className="p-5 rounded-lg bg-muted/30 border space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">System Prompt</h3>
          <p className="text-xs text-muted-foreground">Define how your agent should behave, respond, and interact with users</p>
        </div>

        <div className="space-y-3">
          <Textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => handleUpdate({ system_prompt: e.target.value })}
            placeholder="You are a helpful assistant that..."
            rows={12}
            required
            className="font-mono text-sm resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Define your agent's personality, tone, knowledge boundaries, and capabilities</span>
            <span className="font-mono">{formData.system_prompt.length} characters</span>
          </div>
        </div>

        {/* Collapsible Tips Section */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors group">
            <Lightbulb01 className="h-4 w-4 text-amber-500" />
            <span>Tips for better prompts</span>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">• Define personality first</p>
                  <p className="text-xs text-muted-foreground pl-3">
                    Start with tone, voice, and character traits
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">• Set topic boundaries</p>
                  <p className="text-xs text-muted-foreground pl-3">
                    Specify what the agent should and shouldn't discuss
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">• Include example responses</p>
                  <p className="text-xs text-muted-foreground pl-3">
                    Show the style and format you want
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">• Be specific about tone</p>
                  <p className="text-xs text-muted-foreground pl-3">
                    Professional, casual, friendly, formal, etc.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">• Define response structure</p>
                  <p className="text-xs text-muted-foreground pl-3">
                    Bullet points, paragraphs, step-by-step, etc.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">• Add safety guardrails</p>
                  <p className="text-xs text-muted-foreground pl-3">
                    Prevent harmful, biased, or off-topic responses
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};