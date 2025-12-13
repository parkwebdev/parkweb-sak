import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { AgentConfigHeader } from '@/components/agents/AgentConfigHeader';
import { AgentConfigureTab } from '@/components/agents/tabs/AgentConfigureTab';
import { AgentDataSourcesTab } from '@/components/agents/tabs/AgentDataSourcesTab';
import { AgentToolsTab } from '@/components/agents/tabs/AgentToolsTab';
import { AgentIntegrationsTab } from '@/components/agents/tabs/AgentIntegrationsTab';
import { AgentEmbedTab } from '@/components/agents/tabs/AgentEmbedTab';
import { AgentContentTab } from '@/components/agents/tabs/AgentContentTab';
import { AgentConfigLayout, type AgentConfigTab } from '@/components/agents/AgentConfigLayout';
import { TabContentTransition } from '@/components/ui/tab-content-transition';
import { LoadingState } from '@/components/ui/loading-state';
import { ChatWidget } from '@/widget/ChatWidget';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import type { Tables } from '@/integrations/supabase/types';
import type { WidgetConfig } from '@/widget/api';

type Agent = Tables<'agents'>;

interface AgentConfigProps {
  onMenuClick?: () => void;
}

const AgentConfig: React.FC<AgentConfigProps> = ({ onMenuClick }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, updateAgent } = useAgents();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<AgentConfigTab>('configure');

  // Widget preview hooks
  const { config: embedConfig } = useEmbeddedChatConfig(agentId || '');
  const { articles: helpArticles, categories: helpCategories } = useHelpArticles(agentId || '');
  const { announcements: allAnnouncements } = useAnnouncements(agentId || '');

  useEffect(() => {
    if (agentId) {
      const foundAgent = agents.find(a => a.id === agentId);
      setAgent(foundAgent || null);
    }
  }, [agentId, agents]);

  const handleUpdate = async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
    if (!agent) return null;
    return await updateAgent(id, updates);
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

  const widgetConfig: WidgetConfig | null = agent ? {
    agentId: embedConfig.agentId || agent.id,
    agentName: embedConfig.agentName || agent.name,
    userId: embedConfig.userId || agent.user_id,
    position: embedConfig.position,
    primaryColor: embedConfig.primaryColor,
    useGradientHeader: embedConfig.useGradientHeader,
    gradientStartColor: embedConfig.gradientStartColor,
    gradientEndColor: embedConfig.gradientEndColor,
    welcomeTitle: embedConfig.welcomeTitle,
    welcomeSubtitle: embedConfig.welcomeSubtitle,
    welcomeEmoji: embedConfig.welcomeEmoji,
    showTeamAvatars: false,
    teamAvatarUrls: [],
    placeholder: embedConfig.placeholder,
    animation: embedConfig.animation,
    buttonAnimation: embedConfig.animation,
    enableHomeTab: true,
    enableMessagesTab: embedConfig.enableMessagesTab,
    enableHelpTab: embedConfig.enableHelpTab,
    enableNewsTab: embedConfig.enableNewsTab || false,
    showBottomNav: embedConfig.showBottomNav,
    enableContactForm: embedConfig.enableContactForm,
    contactFormTitle: embedConfig.contactFormTitle,
    contactFormSubtitle: embedConfig.contactFormSubtitle,
    customFields: embedConfig.customFields,
    quickActions: embedConfig.quickActions.map(qa => ({
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
    showBranding: embedConfig.showBranding,
  } : null;

  if (!agent) {
    return (
      <main className="flex-1 bg-muted/30">
        <LoadingState text="Loading agent..." />
      </main>
    );
  }

  return (
    <div className="flex-1 h-full bg-muted/30 flex flex-col min-h-0">
      <AgentConfigHeader agent={agent} />
      
      <AgentConfigLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'embed' ? (
          <div className="flex-1 h-full min-h-0 flex flex-col">
            <AgentEmbedTab
              agent={agent}
              onUpdate={handleUpdate}
            />
          </div>
        ) : (
          <TabContentTransition activeKey={activeTab}>
            {activeTab === 'configure' && (
              <AgentConfigureTab
                agent={agent}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === 'data-sources' && (
              <AgentDataSourcesTab agentId={agent.id} userId={agent.user_id} />
            )}
            {activeTab === 'tools' && (
              <AgentToolsTab agentId={agent.id} agent={agent} onUpdate={handleUpdate} />
            )}
            {activeTab === 'integrations' && (
              <AgentIntegrationsTab agentId={agent.id} />
            )}
            {activeTab === 'content' && (
              <AgentContentTab />
            )}
          </TabContentTransition>
        )}
      </AgentConfigLayout>

      {/* Always-visible widget preview */}
      {widgetConfig && (
        <div className="fixed bottom-6 right-6 z-20">
          <ChatWidget 
            key={`${widgetConfig.agentId}-${widgetConfig.position}`}
            config={widgetConfig} 
            previewMode={true}
            containedPreview={true}
          />
        </div>
      )}
    </div>
  );
};

export default AgentConfig;
