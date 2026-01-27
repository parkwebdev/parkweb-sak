/**
 * AriPreviewColumn Component
 * 
 * Right column containing the simplified preview chat interface.
 * Shows a clean test chat for previewing AI responses.
 * Supports collapse/expand functionality with localStorage persistence.
 * 
 * @module components/agents/AriPreviewColumn
 */

import { Button } from '@/components/ui/button';
import { LayoutPanelRight } from '@/components/icons/LayoutPanelIcons';
import { PreviewChat } from './PreviewChat';
import { cn } from '@/lib/utils';
import type { CustomField, FormStep } from '@/hooks/useEmbeddedChatConfig';

interface ContactFormConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  customFields: CustomField[];
  primaryColor: string;
  formSteps?: FormStep[];
}

interface AriPreviewColumnProps {
  agentId: string;
  primaryColor?: string;
  contactFormPreview?: ContactFormConfig | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AriPreviewColumn({
  agentId,
  primaryColor,
  contactFormPreview,
  isCollapsed,
  onToggleCollapse,
}: AriPreviewColumnProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 border-l bg-card hidden xl:flex flex-col transition-all duration-200 ease-in-out overflow-hidden",
        isCollapsed ? "w-12" : "w-[375px]"
      )}
    >
      {/* Header with collapse button */}
      <div className={cn(
        "h-14 border-b flex items-center justify-between shrink-0",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {!isCollapsed && (
          <h3 className="font-semibold text-sm">Preview</h3>
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
        <PreviewChat 
          agentId={agentId}
          primaryColor={primaryColor}
          contactFormPreview={contactFormPreview || undefined}
        />
      </div>
    </div>
  );
}
