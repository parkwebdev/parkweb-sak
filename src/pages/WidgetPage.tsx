import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatWidget } from '@/widget/ChatWidget';
import type { WidgetConfig } from '@/widget/api';
import { fetchWidgetConfig } from '@/widget/api';

const WidgetPage = () => {
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const agentId = searchParams.get('agentId');
  
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
        className="min-h-screen flex items-center justify-center bg-transparent light" 
        style={{
          colorScheme: 'light',
          '--background': '0 0% 100%',
          '--foreground': '0 0% 3.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '0 0% 3.9%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '0 0% 3.9%',
          '--primary': '221.2 83.2% 53.3%',
          '--primary-foreground': '210 40% 98%',
          '--secondary': '210 40% 96.1%',
          '--secondary-foreground': '222.2 47.4% 11.2%',
          '--muted': '210 40% 96.1%',
          '--muted-foreground': '215.4 16.3% 46.9%',
          '--accent': '210 40% 96.1%',
          '--accent-foreground': '222.2 47.4% 11.2%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '214.3 31.8% 91.4%',
          '--input': '214.3 31.8% 91.4%',
          '--ring': '221.2 83.2% 53.3%',
          '--radius': '0.5rem',
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
        className="min-h-screen flex items-center justify-center bg-transparent light" 
        style={{
          colorScheme: 'light',
          '--background': '0 0% 100%',
          '--foreground': '0 0% 3.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '0 0% 3.9%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '0 0% 3.9%',
          '--primary': '221.2 83.2% 53.3%',
          '--primary-foreground': '210 40% 98%',
          '--secondary': '210 40% 96.1%',
          '--secondary-foreground': '222.2 47.4% 11.2%',
          '--muted': '210 40% 96.1%',
          '--muted-foreground': '215.4 16.3% 46.9%',
          '--accent': '210 40% 96.1%',
          '--accent-foreground': '222.2 47.4% 11.2%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '214.3 31.8% 91.4%',
          '--input': '214.3 31.8% 91.4%',
          '--ring': '221.2 83.2% 53.3%',
          '--radius': '0.5rem',
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
      className="min-h-screen bg-transparent light" 
      style={{
        colorScheme: 'light',
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 3.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 3.9%',
        '--primary': '221.2 83.2% 53.3%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '210 40% 96.1%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--muted': '210 40% 96.1%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '210 40% 96.1%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '221.2 83.2% 53.3%',
        '--radius': '0.5rem',
      } as React.CSSProperties
    }>
      <ChatWidget config={config} previewMode={false} />
    </div>
  );
};

export default WidgetPage;
