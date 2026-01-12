/**
 * Admin Prompts Page
 * 
 * Configure baseline prompt modifier for all agents.
 * Includes version history and security guardrails.
 * 
 * @module pages/admin/AdminPrompts
 */

import { useState, useEffect } from 'react';
import { 
  BaselinePromptEditor, 
  PromptPreview, 
  PromptVersionHistory, 
  SecurityGuardrailsCard 
} from '@/components/admin/prompts';
import { PromptTestChat } from '@/components/admin/prompts';
import { usePlatformConfig } from '@/hooks/admin';

/**
 * Baseline prompt configuration page for Super Admin.
 */
export function AdminPrompts() {
  const { config, loading, updateConfig, isUpdating } = usePlatformConfig('baseline_prompt');
  const { config: guardrailsConfig, loading: guardrailsLoading, updateConfig: updateGuardrails } = usePlatformConfig('security_guardrails');
  
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    if (config?.value) {
      const value = config.value as { prompt?: string };
      setPromptValue(value.prompt || '');
    }
  }, [config]);

  const handlePromptChange = async (newPrompt: string) => {
    await updateConfig({ value: { prompt: newPrompt } });
    setPromptValue(newPrompt);
  };

  const handleGuardrailsChange = async (guardrails: Record<string, boolean>) => {
    await updateGuardrails({ value: guardrails });
  };

  const guardrailsValue = guardrailsConfig?.value as Record<string, boolean> | undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Baseline Prompt</h1>
        <p className="text-sm text-muted-foreground">
          Configure the global prompt modifier applied to all agents
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          <BaselinePromptEditor
            value={promptValue}
            onChange={handlePromptChange}
            loading={loading}
            saving={isUpdating}
            version={config?.version ?? undefined}
            lastUpdated={config?.updated_at ?? undefined}
          />
          
          <SecurityGuardrailsCard
            config={guardrailsValue}
            onChange={handleGuardrailsChange}
            loading={guardrailsLoading}
          />
        </div>

        {/* Right Column - Preview & Test */}
        <div className="space-y-6">
          <PromptPreview prompt={promptValue} />
          <PromptTestChat baselinePrompt={promptValue} />
          <PromptVersionHistory />
        </div>
      </div>
    </div>
  );
}
