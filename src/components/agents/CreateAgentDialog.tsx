/**
 * CreateAgentDialog Component
 * 
 * Dialog for creating a new AI agent with basic configuration.
 * Includes name, description, model selection, system prompt, and parameters.
 * @module components/agents/CreateAgentDialog
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from '@untitledui/icons';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    model: string;
    system_prompt: string;
    temperature: number;
    max_tokens: number;
  }) => Promise<any>;
}

const MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Default)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
];

export const CreateAgentDialog = ({ open, onOpenChange, onSubmit }: CreateAgentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { canCreateAgent, showLimitWarning } = usePlanLimits();
  const limitCheck = canCreateAgent();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model: 'google/gemini-2.5-flash',
    system_prompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    max_tokens: 2000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check limits before creating
    if (!limitCheck.allowed) {
      showLimitWarning('agents', limitCheck);
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        description: '',
        model: 'google/gemini-2.5-flash',
        system_prompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        max_tokens: 2000,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure your AI agent's basic settings. You can add tools and knowledge sources after creation.
          </DialogDescription>
        </DialogHeader>

        {limitCheck.isAtLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your plan limit of {limitCheck.limit} agents. Upgrade your plan to create more agents.
            </AlertDescription>
          </Alert>
        )}

        {limitCheck.isNearLimit && !limitCheck.isAtLimit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're using {limitCheck.current} of {limitCheck.limit} agents ({Math.round(limitCheck.percentage)}%). Consider upgrading soon.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer Support Agent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Handles customer inquiries and support tickets..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
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
            <Label htmlFor="system_prompt">System Prompt *</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="You are a helpful AI assistant that..."
              rows={4}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
