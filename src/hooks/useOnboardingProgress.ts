/**
 * Onboarding Progress Hook
 * 
 * Tracks completion of the 5 onboarding steps based on real data.
 * Used to determine whether to show Get Started page or redirect to Analytics.
 * 
 * @module hooks/useOnboardingProgress
 */

import { useMemo } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useConversations } from '@/hooks/useConversations';
import { useLocations } from '@/hooks/useLocations';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useNewsItems } from '@/hooks/useNewsItems';
import type { AgentDeploymentConfig } from '@/types/metadata';
import { 
  Star01, 
  BookOpen01, 
  Palette, 
  Code02, 
  MessageChatCircle,
  MarkerPin01,
  Announcement01,
  File06,
} from '@untitledui/icons';

/**
 * Onboarding step definition
 */
export interface OnboardingStep {
  id: 'personality' | 'knowledge' | 'locations' | 'help-articles' | 'announcements' | 'news' | 'appearance' | 'installation' | 'test';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isComplete: boolean;
  action: {
    label: string;
    route: string;
    section?: string;
  };
}

/**
 * Onboarding progress state
 */
export interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  allComplete: boolean;
  currentStep: OnboardingStep | null;
  isLoading: boolean;
  agentId: string | null;
}

/**
 * Default appearance values to check against
 */
const DEFAULT_GRADIENT_START = '#000000';
const DEFAULT_GRADIENT_END = '#1e40af';
const DEFAULT_WELCOME_TITLE = 'Hi';
const DEFAULT_WELCOME_SUBTITLE = 'How can we help you today?';

/**
 * Check if agent has custom appearance settings
 */
function hasCustomAppearance(deploymentConfig: AgentDeploymentConfig | null | undefined): boolean {
  if (!deploymentConfig) return false;
  
  // Access embedded_chat config (extended type from agent storage)
  const embeddedChat = (deploymentConfig as AgentDeploymentConfig & { embedded_chat?: Record<string, unknown> }).embedded_chat;
  
  if (!embeddedChat) return false;
  
  // Check for gradient color customization
  const hasCustomGradient = 
    (embeddedChat.gradientStartColor && embeddedChat.gradientStartColor !== DEFAULT_GRADIENT_START) ||
    (embeddedChat.gradientEndColor && embeddedChat.gradientEndColor !== DEFAULT_GRADIENT_END);
  
  // Check for welcome message customization
  const hasCustomWelcome = 
    (embeddedChat.welcomeTitle && embeddedChat.welcomeTitle !== DEFAULT_WELCOME_TITLE) ||
    (embeddedChat.welcomeSubtitle && embeddedChat.welcomeSubtitle !== DEFAULT_WELCOME_SUBTITLE);
  
  return hasCustomGradient || hasCustomWelcome;
}

/**
 * Hook for tracking onboarding progress.
 * Returns step completion status based on actual data.
 * 
 * @example
 * ```tsx
 * const { steps, allComplete, isLoading } = useOnboardingProgress();
 * 
 * if (allComplete) {
 *   return <Navigate to="/analytics" />;
 * }
 * ```
 */
export function useOnboardingProgress(): OnboardingProgress {
  const { agent, agentId, loading: agentLoading } = useAgent();
  const { sources: knowledgeSources, loading: knowledgeLoading } = useKnowledgeSources(agentId || undefined);
  const { conversations, loading: conversationsLoading } = useConversations();
  const { locations, loading: locationsLoading } = useLocations(agentId || undefined);
  const { articles, loading: articlesLoading } = useHelpArticles(agentId || '');
  const { announcements, loading: announcementsLoading } = useAnnouncements(agentId || '');
  const { newsItems, loading: newsLoading } = useNewsItems(agentId || '');

  const isLoading = agentLoading || knowledgeLoading || locationsLoading || 
                    articlesLoading || announcementsLoading || newsLoading || conversationsLoading;

  const steps = useMemo<OnboardingStep[]>(() => {
    // Step 1: Personality - system_prompt > 50 characters
    const personalityComplete = (agent?.system_prompt?.length ?? 0) > 50;

    // Step 2: Knowledge - at least 1 knowledge source with status = 'ready'
    const knowledgeComplete = knowledgeSources?.filter(s => s.status === 'ready').length > 0;

    // Step 3: Locations - at least 1 location exists
    const locationsComplete = (locations?.length ?? 0) > 0;

    // Step 4: Help Articles - at least 1 article exists
    const helpArticlesComplete = (articles?.length ?? 0) > 0;

    // Step 5: Announcements - at least 1 announcement exists
    const announcementsComplete = (announcements?.length ?? 0) > 0;

    // Step 6: News - at least 1 news item exists
    const newsComplete = (newsItems?.length ?? 0) > 0;

    // Step 7: Appearance - any appearance setting changed from default
    const appearanceComplete = hasCustomAppearance(agent?.deployment_config as AgentDeploymentConfig);

    // Step 8: Installation - persisted to database
    const installationComplete = agent?.has_viewed_installation === true;

    // Step 9: Test - at least 1 conversation exists
    const testComplete = (conversations?.length ?? 0) > 0;

    return [
      {
        id: 'personality',
        title: 'Give Ari a personality',
        subtitle: 'Tell Ari how to talk, what tone to use, and what to focus on',
        description: 'Your system prompt is the foundation of how Ari communicates. Write clear instructions about tone, expertise, and boundaries.',
        icon: Star01,
        isComplete: personalityComplete,
        action: {
          label: 'Write System Prompt',
          route: '/ari',
          section: 'system-prompt',
        },
      },
      {
        id: 'knowledge',
        title: 'Teach Ari your business',
        subtitle: 'Add your website, docs, or FAQs so Ari knows how to help',
        description: 'Upload documents, add website URLs, or paste text content. Ari will learn from these sources to answer questions accurately.',
        icon: BookOpen01,
        isComplete: knowledgeComplete,
        action: {
          label: 'Add Knowledge',
          route: '/ari',
          section: 'knowledge',
        },
      },
      {
        id: 'locations',
        title: 'Add your locations',
        subtitle: 'Help visitors find your nearest office or store',
        description: 'Add business locations with addresses, phone numbers, and business hours so Ari can help visitors find you.',
        icon: MarkerPin01,
        isComplete: locationsComplete,
        action: {
          label: 'Add Location',
          route: '/ari',
          section: 'locations',
        },
      },
      {
        id: 'help-articles',
        title: 'Create help articles',
        subtitle: 'Build a knowledge base for self-service support',
        description: 'Write help articles that visitors can browse. Ari will also use these to answer questions accurately.',
        icon: BookOpen01,
        isComplete: helpArticlesComplete,
        action: {
          label: 'Write Articles',
          route: '/ari',
          section: 'help-articles',
        },
      },
      {
        id: 'announcements',
        title: 'Post an announcement',
        subtitle: 'Share updates or promotions with visitors',
        description: 'Create announcement banners that appear in the widget home view to highlight important news or offers.',
        icon: Announcement01,
        isComplete: announcementsComplete,
        action: {
          label: 'Create Announcement',
          route: '/ari',
          section: 'announcements',
        },
      },
      {
        id: 'news',
        title: 'Share company news',
        subtitle: 'Keep visitors informed with updates',
        description: 'Add news articles with rich text, images, and call-to-action buttons to engage your audience.',
        icon: File06,
        isComplete: newsComplete,
        action: {
          label: 'Add News',
          route: '/ari',
          section: 'news',
        },
      },
      {
        id: 'appearance',
        title: 'Customize the look',
        subtitle: 'Match the chat widget to your brand colors',
        description: 'Choose colors, add your logo, and customize the welcome message to match your brand identity.',
        icon: Palette,
        isComplete: appearanceComplete,
        action: {
          label: 'Customize Widget',
          route: '/ari',
          section: 'appearance',
        },
      },
      {
        id: 'installation',
        title: 'Install on your site',
        subtitle: 'Copy the embed code to add Ari to your website',
        description: 'Get the embed code snippet and add it to your website. Works with any platform - WordPress, Shopify, or custom HTML.',
        icon: Code02,
        isComplete: installationComplete,
        action: {
          label: 'Get Embed Code',
          route: '/ari',
          section: 'installation',
        },
      },
      {
        id: 'test',
        title: 'Test your first chat',
        subtitle: 'Send a message to see Ari in action',
        description: 'Open the chat preview and send a test message. See how Ari responds using your knowledge and personality settings.',
        icon: MessageChatCircle,
        isComplete: testComplete,
        action: {
          label: 'Open Chat Preview',
          route: '/ari',
        },
      },
    ];
  }, [agent, knowledgeSources, locations, articles, announcements, newsItems, conversations, agentId]);

  const completedCount = steps.filter(s => s.isComplete).length;
  const totalCount = steps.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);
  const allComplete = completedCount === totalCount;

  // Current step is the first incomplete step
  const currentStep = steps.find(s => !s.isComplete) || null;

  return {
    steps,
    completedCount,
    totalCount,
    percentComplete,
    allComplete,
    currentStep,
    isLoading,
    agentId,
  };
}
