import { ChatWidget } from '@/widget/ChatWidget';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

interface EmbedPreviewPanelProps {
  config: EmbeddedChatConfig;
}

export const EmbedPreviewPanel = ({ config }: EmbedPreviewPanelProps) => {
  return (
    <div className="sticky top-6 min-h-[700px] h-[calc(100vh-120px)]">
      <div className="h-full rounded-lg border bg-background overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p>Website Preview Area</p>
        </div>
        <ChatWidget config={{ agentId: config.agentId, position: config.position, primaryColor: config.primaryColor }} />
      </div>
    </div>
  );
};
