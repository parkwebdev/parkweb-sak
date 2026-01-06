/**
 * AriLeadCaptureSection
 * 
 * Contact form and lead capture settings with live preview.
 */

import { useState, useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ContactFormSection } from '@/components/agents/embed/sections/ContactFormSection';
import { ContactFormPreview } from './ContactFormPreview';
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div>
          <ContactFormSection config={localConfig} onConfigChange={handleConfigChange} />
        </div>
        
        {/* Right: Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Preview</p>
            <ContactFormPreview
              title={localConfig.contactFormTitle}
              subtitle={localConfig.contactFormSubtitle}
              customFields={localConfig.customFields || []}
              primaryColor={localConfig.primaryColor}
              enabled={localConfig.enableContactForm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
