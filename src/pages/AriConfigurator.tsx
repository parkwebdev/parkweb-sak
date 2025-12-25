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

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent } from '@/hooks/useAgent';
import { useAuth } from '@/contexts/AuthContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { logger } from '@/utils/logger';
import { AriSectionMenu, type AriSection } from '@/components/agents/AriSectionMenu';
import { AriPreviewColumn } from '@/components/agents/AriPreviewColumn';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
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

// Loading step timing
const STEP_DURATION = 800;
const loadingStates = [
  { text: "Loading Ari configuration..." },
  { text: "Fetching agent settings..." },
  { text: "Preparing widget preview..." },
  { text: "Almost ready..." },
];
const MIN_DISPLAY_TIME = loadingStates.length * STEP_DURATION;

// Valid sections for URL parameter
const VALID_SECTIONS: AriSection[] = [
  'model-behavior', 'system-prompt', 'appearance', 'welcome-messages', 
  'lead-capture', 'knowledge', 'locations', 'help-articles', 'announcements',
  'news', 'custom-tools', 'webhooks', 'integrations', 'api-access', 'installation'
];

const AriConfigurator = () => {
  logger.debug('AriConfigurator: Component mounting');
  
  const prefersReducedMotion = useReducedMotion();
  logger.debug('AriConfigurator: useReducedMotion complete', { prefersReducedMotion });
  
  const { hasSeenAriLoader, setHasSeenAriLoader } = useAuth();
  logger.debug('AriConfigurator: useAuth complete', { hasSeenAriLoader });
  
  const { agent, agentId, updateAgent, loading: agentLoading } = useAgent();
  logger.debug('AriConfigurator: useAgent complete', { agentId, agentLoading, hasAgent: !!agent });
  
  const [searchParams] = useSearchParams();
  logger.debug('AriConfigurator: useSearchParams complete');
  
  // Get initial section from URL or default to model-behavior
  const initialSection = useMemo(() => {
    const sectionFromUrl = searchParams.get('section') as AriSection;
    return sectionFromUrl && VALID_SECTIONS.includes(sectionFromUrl) 
      ? sectionFromUrl 
      : 'model-behavior';
  }, []); // Only compute once on mount
  
  const [activeSection, setActiveSection] = useState<AriSection>(initialSection);
  
  // Sync section from URL when it changes (for deep linking)
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section') as AriSection;
    if (sectionFromUrl && VALID_SECTIONS.includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl);
    }
  }, [searchParams]);
  
  // Only show loader if user hasn't seen it this session
  const [showLoader, setShowLoader] = useState(!hasSeenAriLoader);
  const loadStartTime = useRef(Date.now());
  
  // Handle minimum display time for loader
  useEffect(() => {
    // Skip if already seen this session
    if (hasSeenAriLoader) return;
    
    if (!agentLoading && showLoader) {
      const elapsed = Date.now() - loadStartTime.current;
      const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
      
      const timer = setTimeout(() => {
        setShowLoader(false);
        setHasSeenAriLoader(true);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [agentLoading, showLoader, hasSeenAriLoader, setHasSeenAriLoader]);

  // Widget preview hooks
  logger.debug('AriConfigurator: Initializing widget preview hooks', { agentId });
  const { config: embedConfig } = useEmbeddedChatConfig(agentId);
  logger.debug('AriConfigurator: useEmbeddedChatConfig complete');
  
  const { articles: helpArticles, categories: helpCategories } = useHelpArticles(agentId);
  logger.debug('AriConfigurator: useHelpArticles complete', { articleCount: helpArticles?.length });
  
  const { announcements: allAnnouncements } = useAnnouncements(agentId);
  logger.debug('AriConfigurator: useAnnouncements complete', { announcementCount: allAnnouncements?.length });

  const handleUpdate = async (_id: string, updates: Partial<Agent>): Promise<Agent | null> => {
    if (!agent) return null;
    return await updateAgent(updates);
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
  } : null;

  // Show loader until minimum display time elapsed
  if (showLoader) {
    return (
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={true}
        duration={STEP_DURATION}
        loop={false}
      />
    );
  }

  // Show spinner while agent data loads (after MultiStepLoader completes)
  if (!agent || agentLoading) {
    return (
      <div className="flex-1 h-full min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Ari...</p>
        </div>
      </div>
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
      <AriPreviewColumn agentId={agentId} primaryColor={embedConfig?.primaryColor} />

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
