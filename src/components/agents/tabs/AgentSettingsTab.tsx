import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

interface AgentSettingsTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
}

export const AgentSettingsTab = ({ agent, onUpdate }: AgentSettingsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    system_prompt: agent.system_prompt,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(agent.id, formData);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    system_prompt: agent.system_prompt,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
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

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
            rows={6}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Controls randomness (0-2)</p>
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
              onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Maximum response length</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="submit" disabled={loading || !hasChanges}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
