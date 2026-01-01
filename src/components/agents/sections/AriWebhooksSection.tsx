/**
 * AriWebhooksSection
 * 
 * Webhooks management with full CRUD, test, and debug capabilities.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { Link03, Trash01, Eye, Edit03, PlayCircle, Plus, Code01 } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { useWebhooks } from '@/hooks/useWebhooks';
import { WebhookLogsDialog } from '@/components/agents/webhooks/WebhookLogsDialog';
import { CreateWebhookDialog } from '@/components/agents/webhooks/CreateWebhookDialog';
import { EditWebhookDialog } from '@/components/agents/webhooks/EditWebhookDialog';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { DebugConsole } from '@/components/agents/DebugConsole';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonListSection } from '@/components/ui/skeleton';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { toast } from '@/lib/toast';

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: unknown;
}

interface AriWebhooksSectionProps {
  agentId: string;
}

export function AriWebhooksSection({ agentId }: AriWebhooksSectionProps) {
  const { webhooks, loading, createWebhook, updateWebhook, deleteWebhook, testWebhook, fetchLogs } = useWebhooks(agentId);
  const { hasPermission, isAdmin } = useRoleAuthorization();
  const canManageWebhooks = isAdmin || hasPermission('manage_webhooks');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<typeof webhooks[0] | null>(null);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<string | null>(null);
  
  // Test states
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  
  // Saved indicator per webhook
  const [savedWebhookId, setSavedWebhookId] = useState<string | null>(null);
  
  // Debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (level: DebugLog['level'], message: string, details?: unknown) => {
    if (!debugMode) return;
    setDebugLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      details
    }]);
  };

  const handleCreate = async (data: Parameters<typeof createWebhook>[0]) => {
    addDebugLog('info', 'Creating webhook...', data);
    try {
      await createWebhook(data);
      addDebugLog('success', 'Webhook created successfully');
      setShowCreateDialog(false);
    } catch (error: unknown) {
      addDebugLog('error', 'Failed to create webhook', error);
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    addDebugLog('info', 'Updating webhook...', { id, data });
    try {
      await updateWebhook(id, data);
      addDebugLog('success', 'Webhook updated successfully');
      setEditingWebhook(null);
    } catch (error: unknown) {
      addDebugLog('error', 'Failed to update webhook', error);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    addDebugLog('info', `${active ? 'Enabling' : 'Disabling'} webhook...`);
    await updateWebhook(id, { active });
    setSavedWebhookId(id);
    setTimeout(() => setSavedWebhookId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteWebhookId) return;
    addDebugLog('info', 'Deleting webhook...', { id: deleteWebhookId });
    await deleteWebhook(deleteWebhookId);
    addDebugLog('success', 'Webhook deleted');
    setDeleteWebhookId(null);
  };

  const handleTest = async (id: string) => {
    setTestingWebhookId(id);
    addDebugLog('info', 'Testing webhook...', { id });
    
    try {
      const result = await testWebhook(id);
      if (result?.success) {
        addDebugLog('success', 'Webhook test passed', result);
        toast.success('Webhook test successful');
      } else {
        addDebugLog('error', 'Webhook test failed', result);
        toast.error('Webhook test failed');
      }
    } catch (error: unknown) {
      addDebugLog('error', 'Webhook test error', error);
      toast.error('Webhook test error');
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleViewLogs = (id: string) => {
    setSelectedWebhookForLogs(id);
    fetchLogs(id);
    setShowLogsDialog(true);
  };

  if (loading) {
    return <SkeletonListSection items={2} />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Webhooks"
        description="Send real-time events to external APIs when actions occur"
      />

      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canManageWebhooks && (
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              Add Webhook
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant={debugMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            <Code01 size={14} className="mr-1.5" />
            Debug Mode
          </Button>
        </div>

        {/* Webhooks List */}
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
                      <Badge variant="outline" size="sm">
                        {webhook.method}
                      </Badge>
                      {!webhook.active && (
                        <Badge variant="secondary" size="sm">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {webhook.url}
                    </p>
                    {webhook.events && webhook.events.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Triggers on: <span className="font-medium">{webhook.events.join(', ')}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {canManageWebhooks && (
                      <div className="flex items-center gap-2 mr-2">
                        <Switch
                          checked={webhook.active ?? true}
                          onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                        />
                        {savedWebhookId === webhook.id && (
                          <SavedIndicator show={true} />
                        )}
                      </div>
                    )}
                    {canManageWebhooks && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTest(webhook.id)}
                        disabled={testingWebhookId === webhook.id}
                      >
                        <PlayCircle size={14} className={testingWebhookId === webhook.id ? 'animate-spin' : ''} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleViewLogs(webhook.id)}>
                      <Eye size={14} />
                    </Button>
                    {canManageWebhooks && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setEditingWebhook(webhook)}>
                          <Edit03 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteWebhookId(webhook.id)}>
                          <Trash01 size={14} className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug Console */}
        {debugMode && (
          <DebugConsole 
            logs={debugLogs} 
            onClear={() => setDebugLogs([])} 
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateWebhookDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          // CreateWebhookDialog handles its own submission internally
        }}
        agentId={agentId}
      />

      <EditWebhookDialog
        open={!!editingWebhook}
        onOpenChange={(open) => !open && setEditingWebhook(null)}
        webhook={editingWebhook}
        onSave={(id, data) => handleUpdate(id, data)}
      />

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
