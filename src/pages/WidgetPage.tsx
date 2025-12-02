import { useEffect, useState } from 'react';
import { ChatWidget } from '@/widget/ChatWidget';
import type { WidgetConfig } from '@/widget/api';
import { fetchWidgetConfig } from '@/widget/api';

// Simple hook to get search params without react-router dependency for widget bundle
const useWidgetSearchParams = () => {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  return params;
};

const WidgetPage = () => {
  const searchParams = useWidgetSearchParams();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const agentId = searchParams.get('agentId');
  
  // Force light mode for widget
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const originalHtmlClass = html.className;
    const originalBodyStyle = body.style.cssText;
    
    // Force light mode
    html.classList.remove('dark');
    html.classList.add('light');
    body.style.background = 'transparent';
    body.style.backgroundColor = 'transparent';
    body.style.height = '100%';
    body.style.margin = '0';
    html.style.height = '100%';
    if (root) root.style.height = '100%';
    
    return () => {
      // Restore original state on unmount
      html.className = originalHtmlClass;
      body.style.cssText = originalBodyStyle;
    };
  }, []);
  
  useEffect(() => {
    const fetchConfig = async () => {
      if (!agentId) {
        setError('Agent ID is required');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchWidgetConfig(agentId);

        // Transform the config data to WidgetConfig format
        const widgetConfig: WidgetConfig = {
          agentId: agentId,
          userId: data.userId || '',
          primaryColor: data.primaryColor || '#000000',
          position: (searchParams.get('position') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') || 'bottom-right',
          greeting: data.greeting,
          placeholder: data.placeholder,
          agentName: data.agentName,
          showBranding: data.showBranding,
          animation: data.animation,
          buttonAnimation: data.buttonAnimation || data.animation,
          showBadge: data.showBadge,
          displayTiming: data.displayTiming,
          delaySeconds: data.delaySeconds,
          showTeaser: data.showTeaser,
          teaserText: data.teaserText,
          teaserMessage: data.teaserMessage || data.teaserText,
          welcomeEmoji: data.welcomeEmoji,
          welcomeTitle: data.welcomeTitle,
          welcomeSubtitle: data.welcomeSubtitle,
          quickActions: data.quickActions || [],
          showBottomNav: data.showBottomNav,
          enableHomeTab: data.enableHomeTab,
          enableMessagesTab: data.enableMessagesTab,
          enableHelpTab: data.enableHelpTab,
          useGradientHeader: data.useGradientHeader,
          gradientStartColor: data.gradientStartColor,
          gradientEndColor: data.gradientEndColor,
          showTeamAvatars: data.showTeamAvatars,
          teamAvatarUrls: data.teamAvatarUrls || [],
          allowedFileTypes: data.allowedFileTypes || [],
          enableVoiceMessages: data.enableVoiceMessages,
          enableFileAttachments: data.enableFileAttachments,
          enableMessageReactions: data.enableMessageReactions,
          showReadReceipts: data.showReadReceipts,
          customFields: data.customFields || [],
          enableContactForm: data.enableContactForm ?? true,
          contactFormTitle: data.contactFormTitle || 'Quick intro before we chat 👋',
          contactFormSubtitle: data.contactFormSubtitle,
          viewTransition: data.viewTransition,
          defaultSoundEnabled: data.defaultSoundEnabled,
          defaultAutoScroll: data.defaultAutoScroll,
          announcements: data.announcements || [],
          helpArticles: data.helpArticles || [],
          helpCategories: data.helpCategories || []
        };

        setConfig(widgetConfig);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load widget config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load widget configuration');
        setLoading(false);
      }
    };

    fetchConfig();
  }, [agentId, searchParams]);
  
  if (loading) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center bg-transparent light" 
        style={{
          colorScheme: 'light',
          '--background': '0 0% 100%',
          '--foreground': '0 0% 3.9%',
          '--primary': '221.2 83.2% 53.3%',
          '--muted-foreground': '215.4 16.3% 46.9%',
        } as React.CSSProperties
      }>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading widget...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center bg-transparent light" 
        style={{
          colorScheme: 'light',
          '--background': '0 0% 100%',
          '--foreground': '0 0% 3.9%',
          '--muted-foreground': '215.4 16.3% 46.9%',
        } as React.CSSProperties
      }>
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Unable to Load Widget</h2>
          <p className="text-muted-foreground">{error || 'Configuration not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full bg-transparent light" 
      style={{
        colorScheme: 'light',
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
      } as React.CSSProperties
    }>
      <ChatWidget config={config} previewMode={false} />
    </div>
  );
};

export default WidgetPage;
