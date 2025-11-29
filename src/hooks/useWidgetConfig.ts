import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WidgetConfig {
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

export const useWidgetConfig = (agentId: string) => {
  const [config, setConfig] = useState<WidgetConfig>({
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
      if (deploymentConfig?.widget) {
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
      console.error('Error loading widget config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Partial<WidgetConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);

      const { error } = await supabase
        .from('agents')
        .update({
          deployment_config: {
            widget_enabled: true,
            widget: updatedConfig,
          },
        })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: 'Widget configuration saved',
        description: 'Your widget settings have been updated',
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
    return `<!-- AI Chat Widget -->
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
