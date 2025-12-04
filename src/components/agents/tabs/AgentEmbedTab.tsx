import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { EmbedSettingsPanel } from '../embed/EmbedSettingsPanel';
import { EmbedPreviewPanel } from '../embed/EmbedPreviewPanel';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
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
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  
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
  }, [agent.id, agent.deployment_config, onUpdate]);

  const handleConfigChange = (updates: Partial<typeof config>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Debounce save by 1 second
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveConfig(updates);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        // Error toast already handled in saveConfig
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading embed settings...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-full min-h-0">
      {/* Left Panel - Settings */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-sm font-medium text-muted-foreground">Embed Configuration</h3>
          <SavedIndicator show={showSaved} />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmbedSettingsPanel
            config={localConfig}
            onConfigChange={handleConfigChange}
            embedCode={generateEmbedCode()}
          />
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="hidden lg:block">
        <EmbedPreviewPanel config={localConfig} />
      </div>
    </div>
  );
};
