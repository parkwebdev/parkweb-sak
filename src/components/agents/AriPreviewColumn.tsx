/**
 * AriPreviewColumn Component
 * 
 * Right column containing the simplified preview chat interface.
 * Shows a clean test chat for previewing AI responses.
 * 
 * @module components/agents/AriPreviewColumn
 */

import { PreviewChat } from './PreviewChat';

interface AriPreviewColumnProps {
  agentId: string;
  primaryColor?: string;
}

export function AriPreviewColumn({
  agentId,
  primaryColor,
}: AriPreviewColumnProps) {
  return (
    <div className="w-[375px] flex-shrink-0 border-l bg-card hidden xl:flex flex-col">
      <PreviewChat 
        agentId={agentId}
        primaryColor={primaryColor}
      />
    </div>
  );
};
