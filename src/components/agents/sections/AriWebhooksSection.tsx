/**
 * AriWebhooksSection
 * 
 * Webhooks management - simplified version.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link03, Trash01, Eye } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { useWebhooks } from '@/hooks/useWebhooks';
import { WebhookLogsDialog } from '@/components/agents/webhooks/WebhookLogsDialog';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';

interface AriWebhooksSectionProps {
  agentId: string;
}

export const AriWebhooksSection: React.FC<AriWebhooksSectionProps> = ({ agentId }) => {
  const { webhooks, loading, updateWebhook, deleteWebhook, fetchLogs } = useWebhooks(agentId);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<string | null>(null);

  const handleToggle = async (id: string, active: boolean) => {
    await updateWebhook(id, { active });
  };

  const handleDelete = async () => {
    if (!deleteWebhookId) return;
    await deleteWebhook(deleteWebhookId);
    setDeleteWebhookId(null);
  };

  const handleViewLogs = (id: string) => {
    setSelectedWebhookForLogs(id);
    fetchLogs(id);
    setShowLogsDialog(true);
  };

  if (loading) {
    return <LoadingState text="Loading webhooks..." />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Webhooks"
        description="Send real-time events to external APIs when actions occur"
      />

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <EmptyState
            icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No webhooks configured"
            description="Webhooks notify external services when events happen"
          />
        ) : (
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{webhook.name}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {webhook.method}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {webhook.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.active ?? true}
                      onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleViewLogs(webhook.id)}>
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteWebhookId(webhook.id)}>
                      <Trash01 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WebhookLogsDialog
        open={showLogsDialog}
        onOpenChange={setShowLogsDialog}
        webhookId={selectedWebhookForLogs}
      />

      <SimpleDeleteDialog
        open={!!deleteWebhookId}
        onOpenChange={(open) => !open && setDeleteWebhookId(null)}
        onConfirm={handleDelete}
        title="Delete Webhook"
        description="This will permanently delete this webhook."
      />
    </div>
  );
};
