/**
 * AriSystemPromptSection
 * 
 * System prompt editor for defining agent personality.
 */

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { AriSectionHeader } from './AriSectionHeader';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AriSystemPromptSectionProps {
  agent: Agent;
  onUpdate: (id: string, updates: Partial<Agent>) => Promise<Agent | null | void>;
}

const PROMPT_TIPS = [
  "Start with a clear role definition (e.g., 'You are a customer support specialist...')",
  "Specify the tone and personality (friendly, professional, casual, etc.)",
  "Include any rules or constraints (what NOT to do)",
  "Add context about your business or domain expertise",
  "Mention how to handle edge cases or when to escalate",
];

export const AriSystemPromptSection: React.FC<AriSystemPromptSectionProps> = ({ agent, onUpdate }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);
  const [isHoveringTip, setIsHoveringTip] = useState(false);
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
          <div className="flex items-center gap-2">
            <Label htmlFor="system-prompt" className="text-sm font-medium">
              Instructions for Ari
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onMouseEnter={() => setIsHoveringTip(true)}
                    onMouseLeave={() => setIsHoveringTip(false)}
                  >
                    {isHoveringTip ? (
                      <LightbulbIconFilled className="h-4 w-4 text-warning" />
                    ) : (
                      <LightbulbIcon className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-4">
                  <p className="font-medium mb-2">Tips for a great prompt:</p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    {PROMPT_TIPS.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
