import { EmbeddedChatPreview } from '../EmbeddedChatPreview';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

interface EmbedPreviewPanelProps {
  config: EmbeddedChatConfig;
}

export const EmbedPreviewPanel = ({ config }: EmbedPreviewPanelProps) => {
  return (
    <div className="sticky top-6 min-h-[700px] h-[calc(100vh-120px)]">
      <div className="h-full rounded-lg border bg-background overflow-hidden">
        <EmbeddedChatPreview config={config} />
      </div>
    </div>
  );
};
