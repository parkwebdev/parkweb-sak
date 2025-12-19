/**
 * AriInstallationSection
 * 
 * Embed code and installation instructions.
 * Marks installation step as viewed when user visits this section.
 */

import { useEffect } from 'react';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { useAgent } from '@/hooks/useAgent';
import { InstallationSection } from '@/components/agents/embed/sections/InstallationSection';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { supabase } from '@/integrations/supabase/client';

interface AriInstallationSectionProps {
  agentId: string;
}

export const AriInstallationSection: React.FC<AriInstallationSectionProps> = ({ agentId }) => {
  const { loading, generateEmbedCode } = useEmbeddedChatConfig(agentId);
  const { agent } = useAgent();

  // Mark installation as viewed when user visits this section
  useEffect(() => {
    if (agentId && agent && !agent.has_viewed_installation) {
      supabase
        .from('agents')
        .update({ has_viewed_installation: true })
        .eq('id', agentId)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to mark installation as viewed:', error);
          }
        });
    }
  }, [agentId, agent]);

  if (loading) {
    return <LoadingState text="Loading installation..." />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Installation"
        description="Get your embed code to add Ari to your website"
      />
      <InstallationSection embedCode={generateEmbedCode()} />
    </div>
  );
};
