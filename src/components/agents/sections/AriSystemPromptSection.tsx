/**
 * AriSystemPromptSection
 * 
 * System prompt editor for defining agent personality.
 */

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AriSectionHeader } from './AriSectionHeader';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AriSystemPromptSectionProps {
  agent: Agent;
  onUpdate: (id: string, updates: Partial<Agent>) => Promise<Agent | null | void>;
}

export const AriSystemPromptSection: React.FC<AriSystemPromptSectionProps> = ({ agent, onUpdate }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSystemPrompt(agent.system_prompt);
  }, [agent.id, agent.system_prompt]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setSystemPrompt(value);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await onUpdate(agent.id, { system_prompt: value });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 1000);
  };

  return (
    <div>
      <AriSectionHeader
        title="System Prompt"
        description="Define your agent's personality, role, and communication style"
        showSaved={showSaved}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="system-prompt" className="text-sm font-medium">
            Instructions for Ari
          </Label>
          <Textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="You are a helpful assistant..."
            rows={16}
            className="font-mono text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This prompt defines how Ari responds to users. Be specific about tone, expertise, and any rules.
          </p>
        </div>
      </div>
    </div>
  );
};
