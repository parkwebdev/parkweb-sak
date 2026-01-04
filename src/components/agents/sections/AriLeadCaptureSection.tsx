/**
 * AriLeadCaptureSection
 * 
 * Contact form and lead capture settings.
 */

import { useState, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ContactFormSection } from '@/components/agents/embed/sections/ContactFormSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonFormSection } from '@/components/ui/skeleton';
import { useAutoSave } from '@/hooks/useAutoSave';

interface AriLeadCaptureSectionProps {
  agentId: string;
}

export function AriLeadCaptureSection({ agentId }: AriLeadCaptureSectionProps) {
  const { config, loading, saveConfig } = useEmbeddedChatConfig(agentId);
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const { save } = useAutoSave({
    onSave: async (updates: Partial<typeof config>) => {
      await saveConfig(updates);
    },
  });

  const handleConfigChange = (updates: Partial<typeof config>) => {
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
