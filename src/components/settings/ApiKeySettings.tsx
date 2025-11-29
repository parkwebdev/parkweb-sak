import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Plus, Key01, Trash01, RefreshCcw01, Copy01, Eye, EyeOff } from '@untitledui/icons';
import { CreateApiKeyDialog } from './CreateApiKeyDialog';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export const ApiKeySettings = () => {
  const { apiKeys, loading, deleteApiKey, rotateApiKey } = useApiKeys();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [keyToRotate, setKeyToRotate] = useState<string | null>(null);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleDelete = async () => {
    if (keyToDelete) {
      await deleteApiKey(keyToDelete);
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    }
  };

  const handleRotate = async () => {
    if (keyToRotate) {
      const result = await rotateApiKey(keyToRotate);
      setRotateDialogOpen(false);
      setKeyToRotate(null);
      
      if (result) {
        setNewGeneratedKey(result.key);
        setNewKeyDialogOpen(true);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'API key has been copied to your clipboard',
    });
  };

  if (loading) {
    return <div>Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
          <CardDescription>
            API keys provide full access to your organization's resources. Keep them secure and rotate them regularly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <p>Never commit API keys to version control or share them publicly</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <p>Use environment variables to store API keys in your applications</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <p>Rotate API keys regularly and immediately if compromised</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <p>Grant minimum required permissions to each API key</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key01 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No API keys created yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create your first API key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Key01 className="h-5 w-5" />
                      {apiKey.name}
                    </CardTitle>
                    <CardDescription className="mt-2 font-mono text-xs">
                      {apiKey.key_preview}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setKeyToRotate(apiKey.id);
                        setRotateDialogOpen(true);
                      }}
                    >
                      Rotate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setKeyToDelete(apiKey.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(apiKey.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last used:</span>
                    <p className="font-medium">
                      {apiKey.last_used_at 
                        ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true })
                        : 'Never'}
                    </p>
                  </div>
                  {apiKey.permissions && apiKey.permissions.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Permissions:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="outline">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onKeyCreated={(key) => {
          setNewGeneratedKey(key);
          setNewKeyDialogOpen(true);
        }}
      />

      <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={newGeneratedKey || ''}
                readOnly
                className="font-mono text-sm pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => newGeneratedKey && copyToClipboard(newGeneratedKey)}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? Any applications using this key will stop working immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new API key and invalidate the current one. Make sure to update the key in all applications using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate}>Rotate Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
