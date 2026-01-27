/**
 * AdminPromptPreviewPanel Component
 * 
 * Right-side panel with test chat interface for testing baseline prompts.
 * Includes toggle to test unsaved draft changes.
 * Supports collapse/expand functionality.
 * 
 * @module components/admin/prompts/AdminPromptPreviewPanel
 */

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LayoutPanelRight } from '@/components/icons/LayoutPanelIcons';
import { PromptTestChat } from './PromptTestChat';
import { cn } from '@/lib/utils';
import type { PromptOverrides } from '@/widget/api';

interface AdminPromptPreviewPanelProps {
  draftPrompts: PromptOverrides;
  hasDraftChanges: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminPromptPreviewPanel({ 
  draftPrompts, 
  hasDraftChanges,
  isCollapsed,
  onToggleCollapse,
}: AdminPromptPreviewPanelProps) {
  const [testDraftMode, setTestDraftMode] = useState(false);

  return (
    <div 
      className={cn(
        "flex-shrink-0 border-l border-border bg-card flex flex-col h-full min-h-0 transition-all duration-200 ease-in-out overflow-hidden",
        isCollapsed ? "w-12" : "w-[360px]"
      )}
    >
      {/* Header with collapse button */}
      <div className={cn(
        "h-14 border-b flex items-center justify-between shrink-0",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {!isCollapsed && (
          <h3 className="font-semibold text-sm">Test Chat</h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0 transition-colors duration-200", isCollapsed && "mx-auto")}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand preview" : "Collapse preview"}
        >
          <LayoutPanelRight filled={!isCollapsed} className="h-4 w-4" />
        </Button>
      </div>

      {/* Content - hidden when collapsed */}
      <div 
        className={cn(
          "flex-1 min-h-0 flex flex-col transition-opacity duration-200",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}
      >
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
    </div>
  );
}
