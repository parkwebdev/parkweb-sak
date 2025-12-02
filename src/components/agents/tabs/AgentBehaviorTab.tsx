import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Lightbulb01 } from '@untitledui/icons';
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
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">System Prompt</h3>
        <p className="text-sm text-muted-foreground">
          Define how your agent should behave, respond, and interact with users
        </p>
      </div>

      <div className="space-y-3">
        <Textarea
          id="system_prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant that..."
          rows={22}
          required
          className="font-mono text-sm resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Define your agent's personality, tone, knowledge boundaries, and capabilities</span>
          <span className="font-mono">{systemPrompt.length} characters</span>
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
  );
};
