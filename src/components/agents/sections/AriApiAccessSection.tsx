/**
 * AriApiAccessSection
 * 
 * API keys management with use cases modal.
 */

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/copy-button';
import { AgentApiKeyManager } from '@/components/agents/AgentApiKeyManager';
import { ApiUseCasesModal } from '@/components/agents/ApiUseCasesModal';
import { AriSectionHeader } from './AriSectionHeader';
import { Lightbulb02 } from '@untitledui/icons';
import { useCanManage } from '@/hooks/useCanManage';
import { useRegisterSectionActions, type SectionAction } from '@/contexts/AriSectionActionsContext';

interface AriApiAccessSectionProps {
  agentId: string;
}

export function AriApiAccessSection({ agentId }: AriApiAccessSectionProps) {
  const [showUseCasesModal, setShowUseCasesModal] = useState(false);
  const canManageApiAccess = useCanManage('manage_ari');
  const apiEndpoint = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/widget-chat`;

  // Register section actions for TopBar
  const sectionActions: SectionAction[] = useMemo(() => [
    {
      id: 'use-cases',
      label: 'Use Cases',
      onClick: () => setShowUseCasesModal(true),
      variant: 'outline',
      icon: <Lightbulb02 size={16} aria-hidden="true" />,
    },
  ], []);

  useRegisterSectionActions('api-access', sectionActions);

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
        <AgentApiKeyManager agentId={agentId} canManage={canManageApiAccess} />
      </div>

      <ApiUseCasesModal
        open={showUseCasesModal}
        onOpenChange={setShowUseCasesModal}
        agentId={agentId}
        apiEndpoint={apiEndpoint}
      />
    </div>
  );
}
