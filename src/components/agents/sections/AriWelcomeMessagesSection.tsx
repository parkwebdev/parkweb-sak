/**
 * AriWelcomeMessagesSection
 * 
 * Welcome messages and content settings.
 */

import { useState, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ContentSection } from '@/components/agents/embed/sections/ContentSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonFormSection } from '@/components/ui/skeleton';
import { useAutoSave } from '@/hooks/useAutoSave';

interface AriWelcomeMessagesSectionProps {
  agentId: string;
}

export function AriWelcomeMessagesSection({ agentId }: AriWelcomeMessagesSectionProps) {
  const { config, loading, saveConfig } = useEmbeddedChatConfig(agentId);
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const { save, isSaving } = useAutoSave({
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
        title="Welcome & Messages"
        description="Configure welcome messages and navigation"
        isSaving={isSaving}
      />
      <ContentSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
}
