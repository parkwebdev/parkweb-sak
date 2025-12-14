import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

/**
 * Types and hook for managing embedded chat widget configuration.
 * Handles all widget appearance, behavior, and content settings.
 */

export interface CustomField {
  id: string;
  label: string;
  fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
}

export interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: 'chat' | 'help' | 'bug' | 'feature' | 'custom' | 'contact';
  action: 'start_chat' | 'open_help' | 'open_contact' | 'custom_url';
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
  featured_image?: string;
  has_embedding?: boolean;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface EmbeddedChatConfig {
  agentId: string;
  userId: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBranding: boolean;
  avatarUrl?: string;
  agentName: string;
  animation: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  
  // Home Screen Options
  welcomeEmoji: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  
  // Quick Actions (always shown)
  quickActions: QuickAction[];
  
  // Bottom Navigation
  showBottomNav: boolean;
  enableMessagesTab: boolean;
  enableHelpTab: boolean;
  enableNewsTab: boolean;
  
  // Gradient
  useGradientHeader: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  
  // Team Avatars
  showTeamAvatars: boolean;
  teamAvatarUrls: string[];
  
  // File Attachments (always enabled)
  allowedFileTypes: string[];
  
  // Contact Form
  enableContactForm: boolean;
  contactFormTitle: string;
  contactFormSubtitle: string;
  customFields: CustomField[];
  
  // Help Articles
  helpArticles: HelpArticle[];
  helpCategories: HelpCategory[];
  
  // AI Behavior
  enableQuickReplies: boolean;
  
  // Location Detection (Phase 5)
  wordpressSiteUrl?: string;
  defaultLocationSlug?: string;
  enableAutoLocationDetection: boolean;
}

export const useEmbeddedChatConfig = (agentId: string) => {
  const getDefaultConfig = (): EmbeddedChatConfig => ({
    agentId,
    userId: '',
    primaryColor: '#000000',
    position: 'bottom-right',
    showBranding: true,
    agentName: 'AI Assistant',
    animation: 'ring',
    
    // Home Screen
    welcomeEmoji: '👋',
    welcomeTitle: 'Hi',
    welcomeSubtitle: 'How can we help you today?',
    
    // Quick Actions (always shown)
    quickActions: [
      {
        id: 'start-chat',
        title: 'Start a conversation',
        subtitle: 'Chat with our AI assistant',
        icon: 'chat',
        action: 'start_chat',
      },
      {
        id: 'get-help',
        title: 'Browse help articles',
        subtitle: 'Find answers in our knowledge base',
        icon: 'help',
        action: 'open_help',
      },
      {
        id: 'contact-form',
        title: 'Get in touch',
        subtitle: 'Fill out a quick form to connect with us',
        icon: 'contact',
        action: 'open_contact',
      },
    ],
    
    // Bottom Navigation
    showBottomNav: true,
    enableMessagesTab: true,
    enableHelpTab: false,
    enableNewsTab: false,
    
    // Gradient
    useGradientHeader: true,
    gradientStartColor: '#000000',
    gradientEndColor: '#1e40af',
    
    // Team Avatars
    showTeamAvatars: false,
    teamAvatarUrls: [],
    
    // File Attachments (always enabled)
    allowedFileTypes: ['image', 'document'],
    
    // Contact Form
    enableContactForm: true,
    contactFormTitle: 'Get in touch',
    contactFormSubtitle: 'Fill out the form below and we\'ll get back to you',
    customFields: [],
    
    // Help Articles
    helpArticles: [],
    helpCategories: [],
    
    // AI Behavior
    enableQuickReplies: true,
    
    // Location Detection
    wordpressSiteUrl: '',
    defaultLocationSlug: '',
    enableAutoLocationDetection: true,
  });

  const [config, setConfig] = useState<EmbeddedChatConfig>(getDefaultConfig());
  const [loading, setLoading] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data: agent, error } = await supabase
        .from('agents')
        .select('name, user_id, deployment_config')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const defaultConfig = getDefaultConfig();
      
      if (deploymentConfig?.embedded_chat) {
        setConfig({
          ...defaultConfig,
          ...(deploymentConfig.embedded_chat as Partial<EmbeddedChatConfig>),
          agentId,
          userId: agent.user_id,
          agentName: agent.name,
        });
      } else if (deploymentConfig?.widget) {
        // Backward compatibility with old "widget" naming
        setConfig({
          ...defaultConfig,
          ...(deploymentConfig.widget as Partial<EmbeddedChatConfig>),
          agentId,
          userId: agent.user_id,
          agentName: agent.name,
        });
      } else {
        setConfig({
          ...defaultConfig,
          agentId,
          userId: agent.user_id,
          agentName: agent.name,
        });
      }
    } catch (error: unknown) {
      logger.error('Error loading embedded chat config', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Partial<EmbeddedChatConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);

      // Convert to plain object for JSON storage
      const configForStorage = {
        ...updatedConfig,
        quickActions: updatedConfig.quickActions.map(action => ({
          id: action.id,
          title: action.title,
          subtitle: action.subtitle,
          icon: action.icon,
          action: action.action,
        })),
        customFields: updatedConfig.customFields.map(field => ({
          id: field.id,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          placeholder: field.placeholder || '',
          options: field.options || [],
        })),
      };

      const { error } = await supabase
        .from('agents')
        .update({
          deployment_config: {
            embedded_chat_enabled: true,
            embedded_chat: configForStorage,
            // Map camelCase to snake_case for backend compatibility
            enable_quick_replies: configForStorage.enableQuickReplies,
          } as unknown as Json,
        })
        .eq('id', agentId);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback)
    } catch (error: unknown) {
      toast.error('Error saving configuration', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  useEffect(() => {
    if (agentId) {
      loadConfig();
    }
  }, [agentId]);

  const generateEmbedCode = (): string => {
    const scriptUrl = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/serve-widget`;
    
    // Build optional attributes for location detection
    const locationAttrs: string[] = [];
    if (config.wordpressSiteUrl) {
      locationAttrs.push(`  data-wordpress-site="${config.wordpressSiteUrl}"`);
    }
    if (config.defaultLocationSlug) {
      locationAttrs.push(`  data-location="${config.defaultLocationSlug}"`);
    }
    
    const optionalAttrs = locationAttrs.length > 0 ? '\n' + locationAttrs.join('\n') : '';
    
    // Simplified embed code - config loaded dynamically from edge function
    // Note: primaryColor is hardcoded to #000000, not configurable
    return `<!-- ChatPad Widget -->
<script
  src="${scriptUrl}"
  data-agent-id="${agentId}"
  data-position="${config.position}"${optionalAttrs}
></script>`;
  };

  return {
    config,
    loading,
    saveConfig,
    generateEmbedCode,
  };
};
