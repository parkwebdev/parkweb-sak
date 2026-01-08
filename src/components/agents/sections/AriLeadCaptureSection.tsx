/**
 * AriLeadCaptureSection
 * 
 * Contact form and lead capture settings with live preview.
 */

import { useState, useEffect } from 'react';
import { ContactFormSection } from '@/components/agents/embed/sections/ContactFormSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonFormSection } from '@/components/ui/skeleton';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

interface AriLeadCaptureSectionProps {
  agentId: string;
  embedConfig: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => Promise<void>;
  loading?: boolean;
}

export function AriLeadCaptureSection({ agentId, embedConfig, onConfigChange, loading }: AriLeadCaptureSectionProps) {
  const [localConfig, setLocalConfig] = useState(embedConfig);

  useEffect(() => {
    setLocalConfig(embedConfig);
  }, [embedConfig]);

  const { save } = useAutoSave({
    onSave: async (updates: Partial<EmbeddedChatConfig>) => {
      await onConfigChange(updates);
    },
  });

  const handleConfigChange = (updates: Partial<EmbeddedChatConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    save(updates);
  };

  if (loading) {
    return <SkeletonFormSection />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Lead Capture"
        description="Set up contact form to collect user information"
      />
      
      <ContactFormSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
}
