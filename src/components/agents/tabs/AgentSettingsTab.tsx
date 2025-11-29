import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

const MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Default)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
];

interface AgentSettingsTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onFormChange?: (hasChanges: boolean) => void;
}

export const AgentSettingsTab = ({ agent, onUpdate, onFormChange }: AgentSettingsTabProps) => {
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    system_prompt: agent.system_prompt,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    system_prompt: agent.system_prompt,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
  });

  useEffect(() => {
    onFormChange?.(hasChanges);
  }, [hasChanges, onFormChange]);

  const handleUpdate = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
  };

  // Export save function for parent
  (AgentSettingsTab as any).handleSave = async () => {
    if (hasChanges) {
      await onUpdate(agent.id, formData);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Basic information about your agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              placeholder="A helpful AI assistant that..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">Optional brief description of what this agent does</p>
          </div>
        </CardContent>
      </Card>

      {/* Model Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>Select the AI model and configure its parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={formData.model} onValueChange={(value) => handleUpdate({ model: value })}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleUpdate({ temperature: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Controls randomness (0 = focused, 2 = creative)</p>
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
              <p className="text-xs text-muted-foreground">Maximum response length</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Card */}
      <Card>
        <CardHeader>
          <CardTitle>Behavior</CardTitle>
          <CardDescription>Define how your agent should behave and respond</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => handleUpdate({ system_prompt: e.target.value })}
              placeholder="You are a helpful assistant that..."
              rows={8}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Instructions that define your agent's personality, tone, and capabilities
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
