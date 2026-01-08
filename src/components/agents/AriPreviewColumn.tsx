/**
 * AriPreviewColumn Component
 * 
 * Right column containing the simplified preview chat interface.
 * Shows a clean test chat for previewing AI responses.
 * 
 * @module components/agents/AriPreviewColumn
 */

import { PreviewChat } from './PreviewChat';
import type { CustomField, FormStep } from '@/hooks/useEmbeddedChatConfig';

interface ContactFormConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  customFields: CustomField[];
  primaryColor: string;
  enableMultiStepForm?: boolean;
  formSteps?: FormStep[];
}

interface AriPreviewColumnProps {
  agentId: string;
  primaryColor?: string;
  contactFormPreview?: ContactFormConfig | null;
}

export function AriPreviewColumn({
  agentId,
  primaryColor,
  contactFormPreview,
}: AriPreviewColumnProps) {
  return (
    <div className="w-[375px] flex-shrink-0 border-l bg-card hidden xl:flex flex-col">
      <PreviewChat 
        agentId={agentId}
        primaryColor={primaryColor}
        contactFormPreview={contactFormPreview || undefined}
      />
    </div>
  );
}
