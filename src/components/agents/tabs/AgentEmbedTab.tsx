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
  const [embedEnabled, setEmbedEnabled] = useState(
    (agent.deployment_config as any)?.embedded_chat_enabled || false
  );

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConfigChange = (updates: Partial<typeof config>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    saveConfig(updates);
  };

  const handleToggleEmbed = async (checked: boolean) => {
    setEmbedEnabled(checked);
    await onUpdate(agent.id, {
      deployment_config: {
        ...((agent.deployment_config as any) || {}),
        embedded_chat_enabled: checked,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading embed settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div>
          <h3 className="text-sm font-medium">Embedded Chat Widget</h3>
          <p className="text-xs text-muted-foreground">
            Add a chat bubble to your website for customer engagement
          </p>
        </div>
        <Switch checked={embedEnabled} onCheckedChange={handleToggleEmbed} />
      </div>

      {embedEnabled && (
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
      )}

      {!embedEnabled && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Enable the embedded chat widget to start customizing
        </div>
      )}
    </div>
  );
};
