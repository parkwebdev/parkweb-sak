import { useEffect, useState } from 'react';
import { ChatWidget } from '@/widget/ChatWidget';
import type { WidgetConfig } from '@/widget/api';

// Simple hook to get search params without react-router dependency for widget bundle
const useWidgetSearchParams = () => {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  return params;
};

// Default config that shows a usable shell immediately
const getDefaultConfig = (agentId: string): WidgetConfig => ({
  agentId,
  userId: '',
  agentName: 'Assistant',
  primaryColor: '#6366f1',
  position: 'bottom-right',
  greeting: 'Hello! How can I help you today?',
  placeholder: 'Type your message...',
  welcomeTitle: 'Hi there!',
  welcomeSubtitle: 'How can we help you today?',
  welcomeEmoji: '👋',
  useGradientHeader: true,
  gradientStartColor: '#6366f1',
  gradientEndColor: '#8b5cf6',
  showBranding: true,
  animation: 'none',
  displayTiming: 'immediate',
  delaySeconds: 0,
  showTeamAvatars: false,
  teamAvatarUrls: [],
  enableHomeTab: true,
  enableMessagesTab: true,
  enableHelpTab: true,
  showBottomNav: true,
  viewTransition: 'slide',
  enableContactForm: false,
  contactFormTitle: 'Quick intro before we chat 👋',
  customFields: [],
  quickActions: [
    { id: 'chat', label: 'Start a Chat', title: 'Start a Chat', subtitle: 'Chat with our AI assistant', icon: 'chat', actionType: 'start_chat' },
    { id: 'help', label: 'Help Articles', title: 'Help Articles', subtitle: 'Browse our knowledge base', icon: 'help', actionType: 'open_help' }
  ],
  announcements: [],
  helpCategories: [],
  helpArticles: [],
  enableVoiceMessages: true,
  enableFileAttachments: true,
  allowedFileTypes: ['image/*', 'application/pdf'],
  enableMessageReactions: true,
  showReadReceipts: false,
  defaultAutoScroll: true,
});

const WidgetPage = () => {
  const searchParams = useWidgetSearchParams();
  const agentId = searchParams.get('agentId');
  
  // Start with default config immediately - no loading state
  const [config, setConfig] = useState<WidgetConfig>(() => 
    getDefaultConfig(agentId || '')
  );
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Listen for config from parent window (sent by chatpad-widget.js)
  useEffect(() => {
    if (!agentId) {
      setError('Agent ID is required');
      return;
    }
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'chatpad-widget-config' && event.data.config) {
        // Transform the config data to WidgetConfig format
        const data = event.data.config;
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
          displayTiming: data.displayTiming,
          delaySeconds: data.delaySeconds,
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
          defaultAutoScroll: data.defaultAutoScroll,
          announcements: data.announcements || [],
          helpArticles: data.helpArticles || [],
          helpCategories: data.helpCategories || []
        };
        
        setConfig(widgetConfig);
        setIsConfigLoaded(true);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Signal to parent that we're ready to receive config
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'chatpad-widget-ready' }, '*');
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, [agentId, searchParams]);

  if (error) {
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
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Render immediately with defaults, then update when real config arrives
  return (
    <div 
      className="w-full h-full bg-transparent light" 
      style={{
        colorScheme: 'light',
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
      } as React.CSSProperties
    }>
      <ChatWidget config={config} previewMode={false} isLoading={!isConfigLoaded} />
    </div>
  );
};

export default WidgetPage;
