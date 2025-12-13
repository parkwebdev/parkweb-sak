/**
 * AriApiAccessSection
 * 
 * API keys management.
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/copy-button';
import { AgentApiKeyManager } from '@/components/agents/AgentApiKeyManager';
import { AriSectionHeader } from './AriSectionHeader';

interface AriApiAccessSectionProps {
  agentId: string;
}

export const AriApiAccessSection: React.FC<AriApiAccessSectionProps> = ({ agentId }) => {
  const apiEndpoint = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/widget-chat`;

  return (
    <div>
      <AriSectionHeader
        title="API Access"
        description="Authenticate programmatic access to Ari with API keys"
      />

      <div className="space-y-6">
        {/* Endpoint URL */}
        <div className="p-5 rounded-lg bg-muted/30 border border-dashed space-y-3">
          <Label className="text-sm font-medium">API Endpoint</Label>
          <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
            <code className="flex-1 text-xs font-mono break-all text-muted-foreground">
              {apiEndpoint}
            </code>
            <CopyButton content={apiEndpoint} showToast={true} toastMessage="Endpoint copied" />
          </div>
          <p className="text-xs text-muted-foreground">
            Requires an API key for authentication. Widget embeds don't need a key.
          </p>
        </div>

        {/* API Keys Manager */}
        <AgentApiKeyManager agentId={agentId} />
      </div>
    </div>
  );
};
