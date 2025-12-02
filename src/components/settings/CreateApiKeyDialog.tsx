import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiKeys } from '@/hooks/useApiKeys';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyCreated?: (key: string) => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'agents:read', label: 'Read Agents', description: 'View agent configurations' },
  { id: 'agents:write', label: 'Write Agents', description: 'Create and update agents' },
  { id: 'conversations:read', label: 'Read Conversations', description: 'View conversation history' },
  { id: 'conversations:write', label: 'Write Conversations', description: 'Create and manage conversations' },
  { id: 'leads:read', label: 'Read Leads', description: 'View leads data' },
  { id: 'leads:write', label: 'Write Leads', description: 'Create and update leads' },
  { id: 'webhooks:read', label: 'Read Webhooks', description: 'View webhook configurations' },
  { id: 'webhooks:write', label: 'Write Webhooks', description: 'Manage webhooks' },
];

export const CreateApiKeyDialog = ({ open, onOpenChange, onKeyCreated }: CreateApiKeyDialogProps) => {
  const { createApiKey } = useApiKeys();
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await createApiKey(name, selectedPermissions);
      
      if (result) {
        // Reset form
        setName('');
        setSelectedPermissions([]);
        onOpenChange(false);
        
        // Notify parent with the new key
        if (onKeyCreated) {
          onKeyCreated(result.key);
        }
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key for programmatic access to your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">API Key Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production API Key"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                A descriptive name to identify this API key
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Permissions</Label>
                  <p className="text-xs text-muted-foreground">
                    Select the permissions this API key should have
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllPermissions}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAllPermissions}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="space-y-3 border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
