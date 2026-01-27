/**
 * AriPreviewColumn Component
 * 
 * Right column containing the simplified preview chat interface.
 * Shows a clean test chat for previewing AI responses.
 * Supports collapse/expand functionality with localStorage persistence.
 * 
 * @module components/agents/AriPreviewColumn
 */

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
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </div>
  );
}
