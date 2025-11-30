import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AgentBehaviorTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onFormChange?: (hasChanges: boolean) => void;
}

export const AgentBehaviorTab = ({ agent, onUpdate, onFormChange }: AgentBehaviorTabProps) => {
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);

  const hasChanges = systemPrompt !== agent.system_prompt;

  useEffect(() => {
    onFormChange?.(hasChanges);
  }, [hasChanges, onFormChange]);

  // Export save function for parent
  (AgentBehaviorTab as any).handleSave = async () => {
    if (hasChanges) {
      await onUpdate(agent.id, { system_prompt: systemPrompt });
    }
  };

  return (
    <div className="max-w-4xl space-y-3">
      <div>
        <h3 className="text-sm font-medium mb-1">System Prompt</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Define how your agent should behave, respond, and interact with users
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="system_prompt" className="sr-only">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant that..."
          rows={18}
          required
          className="font-mono text-sm resize-none"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Instructions that define your agent's personality, tone, and capabilities</span>
          <span>{systemPrompt.length} characters</span>
        </div>
      </div>
    </div>
  );
};
