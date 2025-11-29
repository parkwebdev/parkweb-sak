import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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
    json_mode: deploymentConfig.json_mode || false,
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
    top_p: deploymentConfig.top_p || 1.0,
    json_mode: deploymentConfig.json_mode || false,
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
      const { top_p, json_mode, ...coreFields } = formData;
      await onUpdate(agent.id, {
        ...coreFields,
        deployment_config: {
          ...deploymentConfig,
          top_p,
          json_mode,
        },
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Basic Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-4">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                placeholder="My Assistant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => handleUpdate({ status: checked ? 'active' : 'draft' })}
                />
                <Label htmlFor="status" className="text-sm font-normal">
                  {formData.status === 'active' ? 'Active' : 'Draft'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.status === 'active' ? 'Agent is live and accepting conversations' : 'Agent is in draft mode'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              placeholder="A helpful AI assistant that..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Brief description of what this agent does</p>
          </div>
        </CardContent>
      </Card>

      {/* Model Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-4">Model Settings</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={formData.model} onValueChange={(value) => handleUpdate({ model: value })}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {MODELS.find(m => m.value === formData.model)?.description}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="json_mode"
              checked={formData.json_mode}
              onCheckedChange={(checked) => handleUpdate({ json_mode: checked })}
            />
            <Label htmlFor="json_mode" className="text-sm font-normal">
              JSON Response Mode
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">Enable structured JSON output format</p>
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Generation Settings</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[formData.temperature]}
              onValueChange={([value]) => handleUpdate({ temperature: value })}
            />
            <p className="text-xs text-muted-foreground">Lower values are more focused, higher values are more creative</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="top_p">Top P</Label>
              <span className="text-sm text-muted-foreground">{formData.top_p.toFixed(2)}</span>
            </div>
            <Slider
              id="top_p"
              min={0}
              max={1}
              step={0.01}
              value={[formData.top_p]}
              onValueChange={([value]) => handleUpdate({ top_p: value })}
            />
            <p className="text-xs text-muted-foreground">Controls diversity via nucleus sampling (1.0 = no filtering)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_tokens">Max Tokens</Label>
            <Input
              id="max_tokens"
              type="number"
              min="100"
              max="8000"
              step="100"
              value={formData.max_tokens}
              onChange={(e) => handleUpdate({ max_tokens: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Maximum response length (100-8000 tokens)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
