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
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

interface AriWelcomeMessagesSectionProps {
  agentId: string;
}

export function AriWelcomeMessagesSection({ agentId }: AriWelcomeMessagesSectionProps) {
  const { config, loading, saveConfig } = useEmbeddedChatConfig(agentId);
  const [localConfig, setLocalConfig] = useState(config);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const debouncedSave = useDebouncedCallback(async (updates: Partial<typeof config>) => {
    await saveConfig(updates);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, 1000);

  const handleConfigChange = (updates: Partial<typeof config>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    debouncedSave(updates);
  };

  if (loading) {
    return <SkeletonFormSection />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Welcome & Messages"
        description="Configure welcome messages and navigation"
        showSaved={showSaved}
      />
      <ContentSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
};
