/**
 * AriInstallationSection
 * 
 * Embed code and installation instructions.
 */

import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { InstallationSection } from '@/components/agents/embed/sections/InstallationSection';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';

interface AriInstallationSectionProps {
  agentId: string;
}

export const AriInstallationSection: React.FC<AriInstallationSectionProps> = ({ agentId }) => {
  const { loading, generateEmbedCode } = useEmbeddedChatConfig(agentId);

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
