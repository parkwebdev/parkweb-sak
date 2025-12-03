import { ChatWidget } from '@/widget/ChatWidget';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import type { WidgetConfig } from '@/widget/api';

interface EmbedPreviewPanelProps {
  config: EmbeddedChatConfig;
}

export const EmbedPreviewPanel = ({ config }: EmbedPreviewPanelProps) => {
  const { articles: helpArticles, categories: helpCategories } = useHelpArticles(config.agentId);
  const { announcements: allAnnouncements } = useAnnouncements(config.agentId || '');
  
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

  // Convert config to WidgetConfig format
  const widgetConfig: WidgetConfig = {
    agentId: config.agentId,
    agentName: config.agentName,
    userId: config.userId || '',
    position: config.position,
    primaryColor: config.primaryColor,
    useGradientHeader: config.useGradientHeader,
    gradientStartColor: config.gradientStartColor,
    gradientEndColor: config.gradientEndColor,
    welcomeTitle: config.welcomeTitle,
    welcomeSubtitle: config.welcomeSubtitle,
    welcomeEmoji: config.welcomeEmoji,
    showTeamAvatars: false,
    teamAvatarUrls: [],
    teamAvatarUrl: config.teamAvatarUrls[0],
    greeting: config.greeting,
    placeholder: config.placeholder,
    displayTiming: config.displayTiming,
    delaySeconds: config.delaySeconds,
    showTeaser: config.showTeaser,
    teaserMessage: config.teaserText,
    teaserText: config.teaserText,
    showBadge: config.showBadge,
    animation: config.animation,
    buttonAnimation: config.animation,
    enableHomeTab: true,
    enableMessagesTab: config.enableMessagesTab,
    enableHelpTab: config.enableHelpTab,
    showBottomNav: config.showBottomNav,
    showMessagesTab: config.enableMessagesTab,
    showHelpTab: config.enableHelpTab,
    viewTransition: config.viewTransition,
    enableContactForm: config.enableContactForm,
    contactFormTitle: config.contactFormTitle,
    contactFormSubtitle: config.contactFormSubtitle,
    customFields: config.customFields,
    quickActions: config.quickActions.map(qa => ({
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
      // Find the category UUID by name
      const category = helpCategories.find(c => c.name === art.category);
      return {
        id: art.id,
        category_id: category?.id || '', // Use actual UUID
        category: art.category,
        title: art.title,
        content: art.content,
        icon: art.icon || undefined,
        order: art.order || 0,
      };
    }),
    enableVoiceMessages: true,
    enableFileAttachments: true,
    allowedFileTypes: ['image', 'document'],
    enableMessageReactions: true,
    showReadReceipts: true,
    defaultAutoScroll: config.defaultAutoScroll,
    showBranding: config.showBranding,
  };

  return (
    <div className="sticky top-0 h-screen p-6 bg-muted/30 rounded-lg">
      <div className="h-full flex flex-col">
        <div className="text-center mb-4">
          <span className="text-xs text-muted-foreground">Live Preview</span>
        </div>
        {/* Canvas - simulates a webpage */}
        <div 
          className="flex-1 relative overflow-hidden rounded-xl border bg-secondary dark:bg-muted shadow-inner"
        >
          <ChatWidget 
            key={`${config.agentId}-${config.position}`}
            config={widgetConfig} 
            previewMode={true}
            containedPreview={true}
          />
        </div>
      </div>
    </div>
  );
};
