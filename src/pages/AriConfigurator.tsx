/**
 * AriConfigurator Page
 * 
 * Single-agent configurator with 3-column layout:
 * - Left: Section menu
 * - Center: Content area
 * - Right: Widget preview
 * 
 * @module pages/AriConfigurator
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAgents } from '@/hooks/useAgents';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AriSectionMenu, type AriSection } from '@/components/agents/AriSectionMenu';
import { AriPreviewColumn } from '@/components/agents/AriPreviewColumn';
import { LoadingState } from '@/components/ui/loading-state';
import { ChatWidget } from '@/widget/ChatWidget';
import type { Tables } from '@/integrations/supabase/types';
import type { WidgetConfig } from '@/widget/api';

// Section content components - imported from existing tabs
import { AriModelBehaviorSection } from '@/components/agents/sections/AriModelBehaviorSection';
import { AriSystemPromptSection } from '@/components/agents/sections/AriSystemPromptSection';
import { AriAppearanceSection } from '@/components/agents/sections/AriAppearanceSection';
import { AriWelcomeMessagesSection } from '@/components/agents/sections/AriWelcomeMessagesSection';
import { AriLeadCaptureSection } from '@/components/agents/sections/AriLeadCaptureSection';
import { AriKnowledgeSection } from '@/components/agents/sections/AriKnowledgeSection';
import { AriLocationsSection } from '@/components/agents/sections/AriLocationsSection';
import { AriHelpArticlesSection } from '@/components/agents/sections/AriHelpArticlesSection';
import { AriAnnouncementsSection } from '@/components/agents/sections/AriAnnouncementsSection';
import { AriNewsSection } from '@/components/agents/sections/AriNewsSection';
import { AriCustomToolsSection } from '@/components/agents/sections/AriCustomToolsSection';
import { AriWebhooksSection } from '@/components/agents/sections/AriWebhooksSection';
import { AriIntegrationsSection } from '@/components/agents/sections/AriIntegrationsSection';
import { AriApiAccessSection } from '@/components/agents/sections/AriApiAccessSection';
import { AriInstallationSection } from '@/components/agents/sections/AriInstallationSection';

type Agent = Tables<'agents'>;

const AriConfigurator = () => {
  const prefersReducedMotion = useReducedMotion();
  const { agents, updateAgent, loading: agentsLoading } = useAgents();
  const [activeSection, setActiveSection] = useState<AriSection>('model-behavior');
  
  // Auto-select first agent (single-agent model)
  const agent = agents[0] || null;
  const agentId = agent?.id || '';

  // Widget preview hooks
  const { config: embedConfig } = useEmbeddedChatConfig(agentId);
  const { articles: helpArticles, categories: helpCategories } = useHelpArticles(agentId);
  const { announcements: allAnnouncements } = useAnnouncements(agentId);

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
    locations: [],
    wordpressSiteUrl: embedConfig.wordpressSiteUrl,
    defaultLocationSlug: embedConfig.defaultLocationSlug,
    enableAutoLocationDetection: embedConfig.enableAutoLocationDetection ?? true,
  } : null;

  // Loading state
  if (agentsLoading) {
    return (
      <main className="flex-1 bg-muted/30">
        <LoadingState text="Loading Ari..." />
      </main>
    );
  }

  // No agent found
  if (!agent) {
    return (
      <main className="flex-1 bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No agent configured</h2>
          <p className="text-sm text-muted-foreground mt-1">Please contact support.</p>
        </div>
      </main>
    );
  }

  const renderSectionContent = () => {
    const commonProps = { agent, onUpdate: handleUpdate };
    
    switch (activeSection) {
      case 'model-behavior':
        return <AriModelBehaviorSection {...commonProps} />;
      case 'system-prompt':
        return <AriSystemPromptSection {...commonProps} />;
      case 'appearance':
        return <AriAppearanceSection agentId={agent.id} />;
      case 'welcome-messages':
        return <AriWelcomeMessagesSection agentId={agent.id} />;
      case 'lead-capture':
        return <AriLeadCaptureSection agentId={agent.id} />;
      case 'knowledge':
        return <AriKnowledgeSection agentId={agent.id} userId={agent.user_id} />;
      case 'locations':
        return <AriLocationsSection agentId={agent.id} userId={agent.user_id} />;
      case 'help-articles':
        return <AriHelpArticlesSection agentId={agent.id} userId={agent.user_id} />;
      case 'announcements':
        return <AriAnnouncementsSection agentId={agent.id} userId={agent.user_id} />;
      case 'news':
        return <AriNewsSection agentId={agent.id} userId={agent.user_id} />;
      case 'custom-tools':
        return <AriCustomToolsSection agentId={agent.id} />;
      case 'webhooks':
        return <AriWebhooksSection agentId={agent.id} />;
      case 'integrations':
        return <AriIntegrationsSection agentId={agent.id} />;
      case 'api-access':
        return <AriApiAccessSection agentId={agent.id} />;
      case 'installation':
        return <AriInstallationSection agentId={agent.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      {/* Left: Section Menu */}
      <AriSectionMenu
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Center: Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderSectionContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right: Widget Preview (desktop only) */}
      <AriPreviewColumn widgetConfig={widgetConfig} />

      {/* Mobile/Tablet: Floating widget preview */}
      {widgetConfig && (
        <div className="fixed bottom-6 right-6 z-20 xl:hidden">
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

export default AriConfigurator;
