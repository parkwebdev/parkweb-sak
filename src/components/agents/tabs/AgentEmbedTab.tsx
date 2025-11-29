import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { EmbedSettingsPanel } from '../embed/EmbedSettingsPanel';
import { EmbedPreviewPanel } from '../embed/EmbedPreviewPanel';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AgentEmbedTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onFormChange?: (hasChanges: boolean) => void;
}

export const AgentEmbedTab = ({ agent, onUpdate, onFormChange }: AgentEmbedTabProps) => {
  const { config, loading, saveConfig, generateEmbedCode } = useEmbeddedChatConfig(agent.id);
  const [localConfig, setLocalConfig] = useState(config);
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    // Enable embedded chat by default
    const deploymentConfig = (agent.deployment_config as any) || {};
    if (!deploymentConfig.embedded_chat_enabled) {
      onUpdate(agent.id, {
        deployment_config: {
          ...deploymentConfig,
          embedded_chat_enabled: true,
        },
      });
    }
  }, []);

  const handleConfigChange = (updates: Partial<typeof config>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    saveConfig(updates);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading embed settings...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
      {/* Left Panel - Settings */}
      <div className="space-y-4">
        <EmbedSettingsPanel
          config={localConfig}
          onConfigChange={handleConfigChange}
          embedCode={generateEmbedCode()}
        />
      </div>

      {/* Right Panel - Preview */}
      <div className="hidden lg:block">
        <EmbedPreviewPanel config={localConfig} />
      </div>
    </div>
  );
};
