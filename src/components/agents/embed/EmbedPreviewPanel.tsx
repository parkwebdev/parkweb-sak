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
    greeting: config.greeting,
    primaryColor: config.primaryColor,
    position: config.position,
    welcomeTitle: config.welcomeTitle,
    welcomeSubtitle: config.welcomeSubtitle,
    teamAvatarUrl: config.teamAvatarUrls[0] || null,
    useGradientHeader: config.useGradientHeader,
    gradientStartColor: config.gradientStartColor,
    gradientEndColor: config.gradientEndColor,
    showBottomNav: config.showBottomNav,
    showHomeTab: true,
    showMessagesTab: config.enableMessagesTab,
    showHelpTab: config.enableHelpTab,
    displayTiming: config.displayTiming,
    delaySeconds: config.delaySeconds,
    showTeaser: config.showTeaser,
    teaserMessage: config.teaserText,
    buttonAnimation: config.animation,
    viewTransition: config.viewTransition,
    defaultSoundEnabled: config.defaultSoundEnabled,
    defaultAutoScroll: config.defaultAutoScroll,
    customFields: config.customFields.map(cf => ({
      id: cf.id,
      label: cf.label,
      fieldType: cf.fieldType,
      required: cf.required,
      options: cf.options,
    })),
    quickActions: config.quickActions.map(qa => ({
      id: qa.id,
      icon: qa.icon,
      label: qa.title,
      actionType: qa.action,
    })),
    announcements: activeAnnouncements,
    helpCategories: helpCategories.map(c => ({
      id: c.name,
      name: c.name,
      description: c.description,
      order_index: 0,
    })),
    helpArticles: helpArticles.map(a => ({
      id: a.id,
      category_id: a.category,
      title: a.title,
      content: a.content,
      icon: a.icon || null,
      order_index: a.order || 0,
    })),
  };

  return (
    <div className="sticky top-6 min-h-[700px] h-[calc(100vh-120px)]">
      <div className="h-full rounded-lg border bg-background overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p>Website Preview Area</p>
        </div>
        <ChatWidget config={widgetConfig} previewMode />
      </div>
    </div>
  );
};
