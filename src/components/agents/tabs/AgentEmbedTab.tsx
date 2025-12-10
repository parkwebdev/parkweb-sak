import { useState, useEffect, useRef } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { AgentSettingsLayout } from '../AgentSettingsLayout';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { LoadingState } from '@/components/ui/loading-state';
import { 
  AppearanceSection, 
  ContentSection, 
  ContactFormSection, 
  InstallationSection,
  PlaygroundSection 
} from '../embed/sections';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';

type Agent = Tables<'agents'>;

type EmbedSettingsTab = 'appearance' | 'content' | 'contact-form' | 'installation' | 'playground';

interface AgentEmbedTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: Partial<Agent>) => Promise<unknown>;
}

const MENU_ITEMS: Array<{ id: EmbedSettingsTab; label: string }> = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'content', label: 'Content' },
  { id: 'contact-form', label: 'Contact Form' },
  { id: 'installation', label: 'Installation' },
  { id: 'playground', label: 'Playground' },
];

const SECTION_DESCRIPTIONS: Record<EmbedSettingsTab, string> = {
  'appearance': 'Customize colors and visual styling',
  'content': 'Configure messages and navigation',
  'contact-form': 'Set up lead capture form',
  'installation': 'Get your embed code',
  'playground': 'Test your widget live',
};

export const AgentEmbedTab = ({ agent, onUpdate }: AgentEmbedTabProps) => {
  const { config, loading, saveConfig, generateEmbedCode } = useEmbeddedChatConfig(agent.id);
  const [localConfig, setLocalConfig] = useState(config);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<EmbedSettingsTab>('appearance');
  const saveTimerRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    // Enable embedded chat by default
    const deploymentConfig = ((agent.deployment_config || {}) as AgentDeploymentConfig);
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
    return <LoadingState text="Loading embed settings..." />;
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceSection config={localConfig} onConfigChange={handleConfigChange} />;
      case 'content':
        return <ContentSection config={localConfig} onConfigChange={handleConfigChange} />;
      case 'contact-form':
        return <ContactFormSection config={localConfig} onConfigChange={handleConfigChange} />;
      case 'installation':
        return <InstallationSection embedCode={generateEmbedCode()} />;
      case 'playground':
        return <PlaygroundSection config={localConfig} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full min-h-0">
      <AgentSettingsLayout<EmbedSettingsTab>
        activeTab={activeTab}
        onTabChange={setActiveTab}
        menuItems={MENU_ITEMS}
        title="Widget Settings"
        description={SECTION_DESCRIPTIONS[activeTab]}
        headerExtra={<SavedIndicator show={showSaved} />}
      >
        <div className="max-w-2xl">
          {renderSection()}
        </div>
      </AgentSettingsLayout>
    </div>
  );
};
