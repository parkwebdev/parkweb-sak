import { useState, useEffect, useRef } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { AgentSettingsLayout } from '../AgentSettingsLayout';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { LoadingState } from '@/components/ui/loading-state';
import { ChatWidget } from '@/widget/ChatWidget';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { 
  AppearanceSection, 
  ContentSection, 
  ContactFormSection, 
  InstallationSection,
} from '../embed/sections';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';
import type { WidgetConfig } from '@/widget/api';

type Agent = Tables<'agents'>;

type EmbedSettingsTab = 'appearance' | 'content' | 'contact-form' | 'installation';

interface AgentEmbedTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: Partial<Agent>) => Promise<unknown>;
}

const MENU_ITEMS: Array<{ id: EmbedSettingsTab; label: string }> = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'content', label: 'Content' },
  { id: 'contact-form', label: 'Contact Form' },
  { id: 'installation', label: 'Installation' },
];

const SECTION_DESCRIPTIONS: Record<EmbedSettingsTab, string> = {
  'appearance': 'Customize colors and visual styling',
  'content': 'Configure messages and navigation',
  'contact-form': 'Set up lead capture form',
  'installation': 'Get your embed code',
};

export const AgentEmbedTab = ({ agent, onUpdate }: AgentEmbedTabProps) => {
  const { config, loading, saveConfig, generateEmbedCode } = useEmbeddedChatConfig(agent.id);
  const [localConfig, setLocalConfig] = useState(config);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<EmbedSettingsTab>('appearance');
  const saveTimerRef = useRef<NodeJS.Timeout>();
  
  // Fetch help articles and announcements for widget preview
  const { articles: helpArticles, categories: helpCategories } = useHelpArticles(config.agentId);
  const { announcements: allAnnouncements } = useAnnouncements(config.agentId || '');
  
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

  // Build widget config for preview
  const activeAnnouncements = allAnnouncements.filter(a => a.is_active).map(a => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle || '',
    image_url: a.image_url || null,
    background_color: a.background_color || '#ffffff',
    title_color: a.title_color || '#000000',
    action_type: a.action_type || '',
    action_url: a.action_url || null,
  }));

  const widgetConfig: WidgetConfig = {
    agentId: localConfig.agentId,
    agentName: localConfig.agentName,
    userId: localConfig.userId || '',
    position: localConfig.position,
    primaryColor: localConfig.primaryColor,
    useGradientHeader: localConfig.useGradientHeader,
    gradientStartColor: localConfig.gradientStartColor,
    gradientEndColor: localConfig.gradientEndColor,
    welcomeTitle: localConfig.welcomeTitle,
    welcomeSubtitle: localConfig.welcomeSubtitle,
    welcomeEmoji: localConfig.welcomeEmoji,
    showTeamAvatars: false,
    teamAvatarUrls: [],
    placeholder: localConfig.placeholder,
    animation: localConfig.animation,
    buttonAnimation: localConfig.animation,
    enableHomeTab: true,
    enableMessagesTab: localConfig.enableMessagesTab,
    enableHelpTab: localConfig.enableHelpTab,
    enableNewsTab: localConfig.enableNewsTab || false,
    showBottomNav: localConfig.showBottomNav,
    enableContactForm: localConfig.enableContactForm,
    contactFormTitle: localConfig.contactFormTitle,
    contactFormSubtitle: localConfig.contactFormSubtitle,
    customFields: localConfig.customFields,
    quickActions: localConfig.quickActions.map(qa => ({
      id: qa.id,
      label: qa.title,
      subtitle: qa.subtitle,
      icon: qa.icon,
      actionType: qa.action,
      action: qa.action,
    })),
    announcements: activeAnnouncements.map(a => ({
      id: a.id,
      title: a.title,
      subtitle: a.subtitle || undefined,
      image_url: a.image_url || undefined,
      background_color: a.background_color || '#ffffff',
      title_color: a.title_color || '#000000',
      action_type: a.action_type || undefined,
      action_url: a.action_url || undefined,
    })),
    helpCategories: helpCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || undefined,
      icon: undefined,
    })),
    helpArticles: helpArticles.map(art => {
      const category = helpCategories.find(c => c.name === art.category);
      return {
        id: art.id,
        category_id: category?.id || '',
        category: art.category,
        title: art.title,
        content: art.content,
        order: art.order || 0,
      };
    }),
    newsItems: [],
    enableVoiceMessages: true,
    enableFileAttachments: true,
    allowedFileTypes: ['image', 'document'],
    enableMessageReactions: true,
    showReadReceipts: true,
    showBranding: localConfig.showBranding,
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
      default:
        return null;
    }
  };

  const handleTabChange = (tab: EmbedSettingsTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="h-full min-h-0 relative">
      <AgentSettingsLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        menuItems={MENU_ITEMS}
        title="Widget Settings"
        description={SECTION_DESCRIPTIONS[activeTab]}
        headerExtra={<SavedIndicator show={showSaved} />}
      >
        <div className="max-w-2xl pb-[650px]">
          {renderSection()}
        </div>
      </AgentSettingsLayout>
      
      {/* Always-visible widget preview */}
      <div className="fixed bottom-6 right-6 z-20">
        <div className="w-[380px] h-[600px] rounded-xl border bg-secondary dark:bg-muted shadow-lg overflow-hidden">
          <ChatWidget 
            key={`${localConfig.agentId}-${localConfig.position}`}
            config={widgetConfig} 
            previewMode={true}
            containedPreview={true}
          />
        </div>
      </div>
    </div>
  );
};
