/**
 * AgentApiKeyManager Component
 * 
 * Manages API keys for programmatic agent access.
 * Supports creating, editing, and revoking API keys with rate limit configuration.
 * @module components/agents/AgentApiKeyManager
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/copy-button';
import { EmptyState } from '@/components/ui/empty-state';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { Trash01, Key01, AlertCircle, Edit03 } from '@untitledui/icons';
import { useAgentApiKeys } from '@/hooks/useAgentApiKeys';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgentApiKeyManagerProps {
  agentId: string;
}

interface ApiKeyForEdit {
  id: string;
  name: string;
  requests_per_minute: number;
  requests_per_day: number;
}

export const AgentApiKeyManager = ({ agentId }: AgentApiKeyManagerProps) => {
  const { apiKeys, loading, generating, createApiKey, revokeApiKey, updateApiKey } = useAgentApiKeys(agentId);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  
  // Edit state
  const [editingKey, setEditingKey] = useState<ApiKeyForEdit | null>(null);
  const [editForm, setEditForm] = useState({ name: '', requests_per_minute: 60, requests_per_day: 10000 });
  const [saving, setSaving] = useState(false);

  const handleCreateKey = async () => {
    const key = await createApiKey(newKeyName || 'Default');
    if (key) {
      setNewlyCreatedKey(key);
      setNewKeyName('');
      setShowCreateDialog(false);
    }
  };

  const handleRevokeKey = async () => {
    if (keyToRevoke) {
      await revokeApiKey(keyToRevoke);
      setKeyToRevoke(null);
    }
  };

  const handleEditKey = (key: ApiKeyForEdit) => {
    setEditingKey(key);
    setEditForm({
      name: key.name,
      requests_per_minute: key.requests_per_minute,
      requests_per_day: key.requests_per_day,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;
    setSaving(true);
    try {
      await updateApiKey(editingKey.id, {
        name: editForm.name,
        requests_per_minute: editForm.requests_per_minute,
        requests_per_day: editForm.requests_per_day,
      });
      setEditingKey(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState size="sm" text="Loading API keys..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          API keys authenticate programmatic access to this agent.
        </p>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          Create Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <EmptyState
          icon={<Key01 className="h-5 w-5 text-muted-foreground/50" />}
          title="No API keys yet. Create one to enable programmatic access."
        />
      ) : (
        <AnimatedList>
          {apiKeys.map((key) => (
            <AnimatedItem key={key.id}>
              <div className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{key.name}</h4>
                      <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">
                        {key.key_prefix}
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Created {formatDistanceToNow(new Date(key.created_at))} ago</span>
                      {key.last_used_at && (
                        <span>Last used {formatDistanceToNow(new Date(key.last_used_at))} ago</span>
                      )}
                      <span>{key.requests_per_minute}/min • {key.requests_per_day}/day</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditKey(key)}
                      aria-label={`Edit API key: ${key.name}`}
                    >
                      <Edit03 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setKeyToRevoke(key.id)}
                      aria-label={`Revoke API key: ${key.name}`}
                    >
                      <Trash01 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your API key a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production, Mobile App, Testing"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={generating}>
              {generating ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Key Dialog */}
      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the key name and rate limits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key-name">Key Name</Label>
              <Input
                id="edit-key-name"
                placeholder="e.g., Production, Mobile App, Testing"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rpm">Requests per Minute</Label>
                <Input
                  id="edit-rpm"
                  type="number"
                  min={1}
                  max={1000}
                  value={editForm.requests_per_minute}
                  onChange={(e) => setEditForm({ ...editForm, requests_per_minute: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rpd">Requests per Day</Label>
                <Input
                  id="edit-rpd"
                  type="number"
                  min={1}
                  max={100000}
                  value={editForm.requests_per_day}
                  onChange={(e) => setEditForm({ ...editForm, requests_per_day: parseInt(e.target.value) || 10000 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingKey(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editForm.name}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={!!newlyCreatedKey} onOpenChange={() => setNewlyCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Save Your API Key
            </DialogTitle>
            <DialogDescription>
              Copy this key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
              <code className="flex-1 text-sm font-mono break-all">
                {newlyCreatedKey}
              </code>
              <CopyButton 
                content={newlyCreatedKey || ''} 
                showToast={true} 
                toastMessage="API key copied to clipboard" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)}>
              I've Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <SimpleDeleteDialog
        open={!!keyToRevoke}
        onOpenChange={() => setKeyToRevoke(null)}
        title="Revoke API Key?"
        description="This action cannot be undone. Any applications using this key will immediately lose access."
        onConfirm={handleRevokeKey}
        actionLabel="Revoke Key"
      />
    </div>
  );
};
