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

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent } from '@/hooks/useAgent';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { logger } from '@/utils/logger';
import { AriSectionMenu, type AriSection } from '@/components/agents/AriSectionMenu';
import { getValidAriSectionIds, ARI_SECTIONS } from '@/config/routes';
import { AriPreviewColumn } from '@/components/agents/AriPreviewColumn';
import { SkeletonAriConfiguratorPage } from '@/components/ui/page-skeleton';
import { ChatWidget } from '@/widget/ChatWidget';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { useAriSectionActions } from '@/contexts/AriSectionActionsContext';
import type { Tables } from '@/integrations/supabase/types';
import type { WidgetConfig } from '@/widget/api';

// Section content components - imported from existing tabs
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
import { SectionErrorBoundary } from '@/components/agents/sections/SectionErrorBoundary';
type Agent = Tables<'agents'>;

// Get valid sections from centralized config
const VALID_SECTIONS = getValidAriSectionIds();

/**
 * Component that renders Ari section actions from context
 * Renders dynamically when actions change without affecting TopBar config
 */
function AriTopBarActions() {
  const { actions } = useAriSectionActions();
  
  if (actions.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          size="sm"
          variant={action.isActive ? 'secondary' : (action.variant || 'default')}
          onClick={action.onClick}
          disabled={action.disabled}
          className="gap-1.5"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Inner component that uses the section actions context
 */
function AriConfiguratorContent() {
  logger.debug('AriConfigurator: Component mounting');
  
  const prefersReducedMotion = useReducedMotion();
  logger.debug('AriConfigurator: useReducedMotion complete', { prefersReducedMotion });
  
  const { agent, agentId, updateAgent, loading: agentLoading } = useAgent();
  logger.debug('AriConfigurator: useAgent complete', { agentId, agentLoading, hasAgent: !!agent });
  
  const [searchParams] = useSearchParams();
  logger.debug('AriConfigurator: useSearchParams complete');
  
  const { setCurrentSection } = useAriSectionActions();
  
  // Get initial section from URL or default to system-prompt
  const initialSection = useMemo(() => {
    const sectionFromUrl = searchParams.get('section') as AriSection;
    return sectionFromUrl && VALID_SECTIONS.includes(sectionFromUrl) 
      ? sectionFromUrl 
      : 'system-prompt';
  }, []); // Only compute once on mount
  
  const [activeSection, setActiveSection] = useState<AriSection>(initialSection);
  
  // Update current section in context when it changes
  useEffect(() => {
    setCurrentSection(activeSection);
  }, [activeSection, setCurrentSection]);
  
  // Get current section label for subtitle
  const currentSectionLabel = useMemo(() => {
    const section = ARI_SECTIONS.find(s => s.id === activeSection);
    return section?.label;
  }, [activeSection]);
  
  // Configure top bar for this page
  // AriTopBarActions reads from context directly and re-renders independently
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext 
      icon={() => <AriAgentsIcon className="h-3.5 w-3.5" />} 
      title="Ari" 
      subtitle={currentSectionLabel}
    />,
    right: <AriTopBarActions />,
  }), [currentSectionLabel]);
  useTopBar(topBarConfig, 'ari');
  
  // Sync section from URL when it changes (for deep linking)
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section') as AriSection;
    if (sectionFromUrl && VALID_SECTIONS.includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl);
    }
  }, [searchParams]);
  

  // Widget preview hooks
  logger.debug('AriConfigurator: Initializing widget preview hooks', { agentId });
  const { config: embedConfig, saveConfig: saveEmbedConfig, loading: embedLoading } = useEmbeddedChatConfig(agentId ?? '');
  logger.debug('AriConfigurator: useEmbeddedChatConfig complete');
  
  const { articles: helpArticles, categories: helpCategories } = useHelpArticles(agentId ?? '');
  logger.debug('AriConfigurator: useHelpArticles complete', { articleCount: helpArticles?.length });
  
  const { announcements: allAnnouncements } = useAnnouncements(agentId ?? '');
  logger.debug('AriConfigurator: useAnnouncements complete', { announcementCount: allAnnouncements?.length });

  const handleUpdate = async (_id: string, updates: Partial<Agent>): Promise<Agent | null> => {
    if (!agent) return null;
    return await updateAgent(updates);
  };

  // Build widget config for preview
  // NOTE: All derived data must be computed INSIDE useMemo to avoid infinite loops
  const widgetConfig = useMemo<WidgetConfig | null>(() => {
    if (!agent) return null;
    
    // Compute active announcements inside useMemo
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
    
    return {
      agentId: embedConfig.agentId || agent.id,
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
    };
  }, [agent, embedConfig, allAnnouncements, helpCategories, helpArticles]);

  // Show skeleton while agent data loads (after MultiStepLoader completes)
  if (!agent || agentLoading) {
    return <SkeletonAriConfiguratorPage />;
  }

  const renderSectionContent = () => {
    const commonProps = { agent, onUpdate: handleUpdate };
    
    const getSectionContent = () => {
      switch (activeSection) {
        case 'system-prompt':
          return <AriSystemPromptSection {...commonProps} />;
        case 'appearance':
          return <AriAppearanceSection agentId={agent.id} />;
        case 'welcome-messages':
          return <AriWelcomeMessagesSection agentId={agent.id} />;
        case 'lead-capture':
          return <AriLeadCaptureSection agentId={agent.id} embedConfig={embedConfig} onConfigChange={saveEmbedConfig} loading={embedLoading} />;
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
      <SectionErrorBoundary key={activeSection} sectionName={activeSection.replace('-', ' ')}>
        {getSectionContent()}
      </SectionErrorBoundary>
    );
  };

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      {/* Left: Section Menu */}
      <AriSectionMenu
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Center: Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6">
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
      </main>

      {/* Right: Widget Preview (desktop only) */}
      <AriPreviewColumn 
        agentId={agentId ?? ''} 
        primaryColor={embedConfig?.primaryColor}
        contactFormPreview={activeSection === 'lead-capture' ? {
          enabled: embedConfig.enableContactForm,
          title: embedConfig.contactFormTitle,
          subtitle: embedConfig.contactFormSubtitle,
          customFields: embedConfig.customFields,
          primaryColor: embedConfig.primaryColor,
          formSteps: embedConfig.formSteps,
        } : null}
      />

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
}

const AriConfigurator = () => {
  return <AriConfiguratorContent />;
};

export default AriConfigurator;
