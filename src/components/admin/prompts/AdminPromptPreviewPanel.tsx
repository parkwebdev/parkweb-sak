/**
 * AdminPromptPreviewPanel Component
 * 
 * Right-side panel with test chat interface for testing baseline prompts.
 * Matches the PreviewChat design exactly.
 * 
 * @module components/admin/prompts/AdminPromptPreviewPanel
 */

import { PromptTestChat } from './PromptTestChat';

export function AdminPromptPreviewPanel() {
  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full min-h-0">
      <PromptTestChat />
    </div>
  );
}
