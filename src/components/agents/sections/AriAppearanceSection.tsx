/**
 * AriAppearanceSection
 * 
 * Widget appearance and color settings.
 */

import { useState, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { AppearanceSection } from '@/components/agents/embed/sections/AppearanceSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonFormSection } from '@/components/ui/skeleton';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

interface AriAppearanceSectionProps {
  agentId: string;
}

export function AriAppearanceSection({ agentId }: AriAppearanceSectionProps) {
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
        title="Appearance"
        description="Customize colors and visual styling"
        showSaved={showSaved}
      />
      <AppearanceSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
};
