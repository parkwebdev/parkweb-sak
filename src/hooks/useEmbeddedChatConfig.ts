import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const useEmbeddedChatConfig = (agentId: string) => {
  const [config, setConfig] = useState<EmbeddedChatConfig>({
    agentId,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    position: 'bottom-right',
    greeting: 'Hi! How can I help you today?',
    placeholder: 'Type your message...',
    showBranding: true,
    agentName: 'AI Assistant',
  });
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
      if (deploymentConfig?.embedded_chat) {
        setConfig({
          ...config,
          ...deploymentConfig.embedded_chat,
          agentId,
          agentName: agent.name,
        });
      } else if (deploymentConfig?.widget) {
        // Backward compatibility with old "widget" naming
        setConfig({
          ...config,
          ...deploymentConfig.widget,
          agentId,
          agentName: agent.name,
        });
      } else {
        setConfig(prev => ({
          ...prev,
          agentName: agent.name,
        }));
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

      const { error } = await supabase
        .from('agents')
        .update({
          deployment_config: {
            embedded_chat_enabled: true,
            embedded_chat: updatedConfig,
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
