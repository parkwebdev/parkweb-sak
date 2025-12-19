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
import type { AgentDeploymentConfig } from '@/types/metadata';
import { 
  Star01, 
  BookOpen01, 
  Palette, 
  Code02, 
  MessageChatCircle 
} from '@untitledui/icons';

/**
 * Onboarding step definition
 */
export interface OnboardingStep {
  id: 'personality' | 'knowledge' | 'appearance' | 'installation' | 'test';
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
const DEFAULT_GRADIENT_END = '#000000';

/**
 * Check if agent has custom appearance settings
 */
function hasCustomAppearance(deploymentConfig: AgentDeploymentConfig | null | undefined): boolean {
  if (!deploymentConfig) return false;
  
  const config = deploymentConfig as Record<string, unknown>;
  
  // Check for any appearance customization
  const hasCustomGradient = 
    (config.gradientStart && config.gradientStart !== DEFAULT_GRADIENT_START) ||
    (config.gradientEnd && config.gradientEnd !== DEFAULT_GRADIENT_END);
  
  const hasWidgetColor = !!config.widgetColor;
  const hasCustomBotName = !!config.botName;
  const hasCustomAvatar = !!config.avatarUrl;
  const hasWelcomeMessage = !!config.welcomeMessage;
  
  return hasCustomGradient || hasWidgetColor || hasCustomBotName || hasCustomAvatar || hasWelcomeMessage;
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

  const isLoading = agentLoading || knowledgeLoading || conversationsLoading;

  const steps = useMemo<OnboardingStep[]>(() => {
    // Step 1: Personality - system_prompt > 50 characters
    const personalityComplete = (agent?.system_prompt?.length ?? 0) > 50;

    // Step 2: Knowledge - at least 1 knowledge source with status = 'ready'
    const knowledgeComplete = knowledgeSources?.filter(s => s.status === 'ready').length > 0;

    // Step 3: Appearance - any appearance setting changed from default
    const appearanceComplete = hasCustomAppearance(agent?.deployment_config as AgentDeploymentConfig);

    // Step 4: Installation - localStorage flag
    const installationComplete = agentId 
      ? localStorage.getItem(`has_viewed_embed_code_${agentId}`) === 'true'
      : false;

    // Step 5: Test - at least 1 conversation exists
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
  }, [agent, knowledgeSources, conversations, agentId]);

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
