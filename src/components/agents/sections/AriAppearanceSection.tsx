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
import { useAutoSave } from '@/hooks/useAutoSave';

interface AriAppearanceSectionProps {
  agentId: string;
}

export function AriAppearanceSection({ agentId }: AriAppearanceSectionProps) {
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
        title="Appearance"
        description="Customize colors and visual styling"
        isSaving={isSaving}
      />
      <AppearanceSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
}
