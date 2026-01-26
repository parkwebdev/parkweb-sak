/**
 * AdminPromptPreviewPanel Component
 * 
 * Right-side panel with test chat interface for testing baseline prompts.
 * Includes toggle to test unsaved draft changes.
 * 
 * @module components/admin/prompts/AdminPromptPreviewPanel
 */

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PromptTestChat } from './PromptTestChat';
import type { PromptOverrides } from '@/widget/api';

interface AdminPromptPreviewPanelProps {
  draftPrompts: PromptOverrides;
  hasDraftChanges: boolean;
}

export function AdminPromptPreviewPanel({ draftPrompts, hasDraftChanges }: AdminPromptPreviewPanelProps) {
  const [testDraftMode, setTestDraftMode] = useState(false);

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full min-h-0">
      {/* Draft toggle - only show when there are unsaved changes */}
      {hasDraftChanges && (
        <div className="px-4 py-2 border-b bg-warning/5">
          <div className="flex items-center justify-between">
            <Label htmlFor="draft-toggle" className="text-xs text-warning-foreground">
              Test unsaved changes
            </Label>
            <Switch
              id="draft-toggle"
              checked={testDraftMode}
              onCheckedChange={setTestDraftMode}
              className="scale-90"
            />
          </div>
        </div>
      )}
      
      <PromptTestChat 
        draftPrompts={draftPrompts}
        testDraftMode={testDraftMode && hasDraftChanges}
      />
    </div>
  );
}
