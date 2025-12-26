/**
 * AriWelcomeMessagesSection
 * 
 * Welcome messages and content settings.
 */

import { useState, useRef, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ContentSection } from '@/components/agents/embed/sections/ContentSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonFormSection } from '@/components/ui/skeleton';

interface AriWelcomeMessagesSectionProps {
  agentId: string;
}

export function AriWelcomeMessagesSection({ agentId }: AriWelcomeMessagesSectionProps) {
  const { config, loading, saveConfig } = useEmbeddedChatConfig(agentId);
  const [localConfig, setLocalConfig] = useState(config);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleConfigChange = (updates: Partial<typeof config>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveConfig(updates);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 1000);
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
