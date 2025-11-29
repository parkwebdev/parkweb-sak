import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  icon?: string;
  order: number;
}

export interface EmbeddedChatConfig {
  agentId: string;
  primaryColor: string;
  secondaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  greeting: string;
  placeholder: string;
  showBranding: boolean;
  avatarUrl?: string;
  agentName: string;
  animation: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  showBadge: boolean;
  displayTiming: 'immediate' | 'delayed' | 'scroll';
  delaySeconds: number;
  scrollDepth: number;
  showTeaser: boolean;
  teaserText: string;
  
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
  
  // Gradient
  useGradientHeader: boolean;
  gradientEndColor: string;
  
  // Team Avatars
  showTeamAvatars: boolean;
  teamAvatarUrls: string[];
  
  // Real-time Indicators (always enabled)
  showReadReceipts: boolean;
  
  // File Attachments (always enabled)
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Contact Form
  enableContactForm: boolean;
  contactFormTitle: string;
  contactFormSubtitle: string;
  customFields: CustomField[];
  
  // View Transitions
  viewTransition: 'slide' | 'fade' | 'none';
  
  // Chat Settings (simplified - only sound and auto-scroll)
  defaultSoundEnabled: boolean;
  defaultAutoScroll: boolean;
  
  // Help Articles
  helpArticles: HelpArticle[];
  helpCategories: string[];
}

export const useEmbeddedChatConfig = (agentId: string) => {
  const getDefaultConfig = (): EmbeddedChatConfig => ({
    agentId,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    position: 'bottom-right',
    greeting: 'Hi! How can I help you today?',
    placeholder: 'Type your message...',
    showBranding: true,
    agentName: 'AI Assistant',
    animation: 'ring',
    showBadge: true,
    displayTiming: 'immediate',
    delaySeconds: 3,
    scrollDepth: 50,
    showTeaser: true,
    teaserText: 'Need help! Chat with us!',
    
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
    
    // Gradient
    useGradientHeader: true,
    gradientEndColor: '#1e40af',
    
    // Team Avatars
    showTeamAvatars: true,
    teamAvatarUrls: [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    ],
    
    // Real-time Indicators (typing always enabled, read receipts configurable)
    showReadReceipts: true,
    
    // File Attachments (always enabled)
    maxFileSize: 10,
    allowedFileTypes: ['image', 'document'],
    
    // Contact Form
    enableContactForm: true,
    contactFormTitle: 'Get in touch',
    contactFormSubtitle: 'Fill out the form below and we\'ll get back to you',
    customFields: [],
    
    // View Transitions
    viewTransition: 'slide',
    
    // Chat Settings (simplified)
    defaultSoundEnabled: true,
    defaultAutoScroll: true,
    
    // Help Articles
    helpArticles: [],
    helpCategories: [],
  });

  const [config, setConfig] = useState<EmbeddedChatConfig>(getDefaultConfig());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data: agent, error } = await supabase
        .from('agents')
        .select('name, deployment_config')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      const deploymentConfig = agent.deployment_config as any;
      const defaultConfig = getDefaultConfig();
      
      if (deploymentConfig?.embedded_chat) {
        setConfig({
          ...defaultConfig,
          ...deploymentConfig.embedded_chat,
          agentId,
          agentName: agent.name,
        });
      } else if (deploymentConfig?.widget) {
        // Backward compatibility with old "widget" naming
        setConfig({
          ...defaultConfig,
          ...deploymentConfig.widget,
          agentId,
          agentName: agent.name,
        });
      } else {
        setConfig({
          ...defaultConfig,
          agentId,
          agentName: agent.name,
        });
      }
    } catch (error: any) {
      console.error('Error loading embedded chat config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Partial<EmbeddedChatConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);

      // Convert to plain object for JSON storage
      const configForStorage: any = {
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
          },
        })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: 'Chat configuration saved',
        description: 'Your embedded chat settings have been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving configuration',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (agentId) {
      loadConfig();
    }
  }, [agentId]);

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<!-- AI Chat -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-agent-id', '${agentId}');
    script.setAttribute('data-primary-color', '${config.primaryColor}');
    script.setAttribute('data-secondary-color', '${config.secondaryColor}');
    script.setAttribute('data-position', '${config.position}');
    script.setAttribute('data-greeting', '${config.greeting}');
    script.setAttribute('data-placeholder', '${config.placeholder}');
    script.setAttribute('data-show-branding', '${config.showBranding}');
    script.setAttribute('data-agent-name', '${config.agentName}');
    script.setAttribute('data-animation', '${config.animation}');
    script.setAttribute('data-show-badge', '${config.showBadge}');
    script.setAttribute('data-display-timing', '${config.displayTiming}');
    script.setAttribute('data-delay-seconds', '${config.delaySeconds}');
    script.setAttribute('data-scroll-depth', '${config.scrollDepth}');
    script.setAttribute('data-show-teaser', '${config.showTeaser}');
    script.setAttribute('data-teaser-text', '${config.teaserText}');
    script.setAttribute('data-welcome-emoji', '${config.welcomeEmoji}');
    script.setAttribute('data-welcome-title', '${config.welcomeTitle}');
    script.setAttribute('data-welcome-subtitle', '${config.welcomeSubtitle}');
    script.setAttribute('data-use-gradient-header', '${config.useGradientHeader}');
    script.setAttribute('data-gradient-end-color', '${config.gradientEndColor}');
    script.setAttribute('data-show-read-receipts', '${config.showReadReceipts}');
    script.setAttribute('data-max-file-size', '${config.maxFileSize}');
    script.setAttribute('data-allowed-file-types', '${config.allowedFileTypes.join(',')}');
    ${config.avatarUrl ? `script.setAttribute('data-avatar-url', '${config.avatarUrl}');` : ''}
    document.head.appendChild(script);
  })();
</script>`;
  };

  return {
    config,
    loading,
    saveConfig,
    generateEmbedCode,
  };
};
