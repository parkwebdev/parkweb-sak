/**
 * AriLeadCaptureSection
 * 
 * Contact form and lead capture settings.
 */

import { useState, useRef, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ContactFormSection } from '@/components/agents/embed/sections/ContactFormSection';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';

interface AriLeadCaptureSectionProps {
  agentId: string;
}

export const AriLeadCaptureSection: React.FC<AriLeadCaptureSectionProps> = ({ agentId }) => {
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
    return <LoadingState text="Loading lead capture settings..." />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Lead Capture"
        description="Set up contact form to collect user information"
        showSaved={showSaved}
      />
      <ContactFormSection config={localConfig} onConfigChange={handleConfigChange} />
    </div>
  );
};
