/**
 * AriAppearanceSection
 * 
 * Widget appearance and color settings.
 */

import { useState, useRef, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { AppearanceSection } from '@/components/agents/embed/sections/AppearanceSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonFormSection } from '@/components/ui/skeleton';

interface AriAppearanceSectionProps {
  agentId: string;
}

export const AriAppearanceSection: React.FC<AriAppearanceSectionProps> = ({ agentId }) => {
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
        title="Appearance"
        description="Customize colors and visual styling"
        showSaved={showSaved}
      />
      <AppearanceSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
};
