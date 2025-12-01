import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useWebhooks } from '@/hooks/useWebhooks';
import { Plus, Settings02, Trash01, PlayCircle, CheckCircle, XCircle } from '@untitledui/icons';
import { CreateWebhookDialog } from './CreateWebhookDialog';
import { WebhookLogsDialog } from './WebhookLogsDialog';
import { SavedIndicator } from './SavedIndicator';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
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

export const WebhookSettings = () => {
  const { webhooks, loading, deleteWebhook, testWebhook, updateWebhook } = useWebhooks();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
  const [savedWebhookIds, setSavedWebhookIds] = useState<Set<string>>(new Set());

  const handleDelete = async () => {
    if (webhookToDelete) {
      await deleteWebhook(webhookToDelete);
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateWebhook(id, { active: !currentActive });
    
    // Show saved indicator
    setSavedWebhookIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setSavedWebhookIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const handleTest = async (id: string) => {
    await testWebhook(id);
  };

  const handleViewLogs = (id: string) => {
    setSelectedWebhook(id);
    setLogsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Send real-time events to external APIs
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <AnimatedList className="grid gap-4" staggerDelay={0.05}>
        {webhooks.length === 0 ? (
          <AnimatedItem>
          <Card>
            <CardContent className="py-12 text-center">
              <Settings02 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No webhooks configured yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create your first webhook
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>
        ) : (
          webhooks.map((webhook) => (
            <AnimatedItem key={webhook.id}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle>{webhook.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">
                        {webhook.method || 'POST'}
                      </Badge>
                      {webhook.auth_type && webhook.auth_type !== 'none' && (
                        <Badge variant="secondary" className="text-xs">
                          {webhook.auth_type === 'api_key' && 'API Key'}
                          {webhook.auth_type === 'bearer_token' && 'Bearer Token'}
                          {webhook.auth_type === 'basic_auth' && 'Basic Auth'}
                        </Badge>
                      )}
                       <Badge variant={webhook.active ? 'default' : 'secondary'}>
                         {webhook.active ? 'Active' : 'Inactive'}
                       </Badge>
                     </div>
                     <CardDescription className="mt-2">
                       {webhook.url}
                     </CardDescription>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <span className="text-sm font-medium">Status</span>
                       <Switch
                         checked={webhook.active || false}
                         onCheckedChange={(checked) => handleToggleActive(webhook.id, webhook.active || false)}
                       />
                       <SavedIndicator show={savedWebhookIds.has(webhook.id)} />
                     </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleTest(webhook.id)}
                       >
                         Test
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleViewLogs(webhook.id)}
                       >
                         View Logs
                       </Button>
                       <Button
                         size="sm"
                         variant="destructive"
                         onClick={() => {
                           setWebhookToDelete(webhook.id);
                           setDeleteDialogOpen(true);
                         }}
                       >
                         Delete
                       </Button>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div>
                       <span className="text-sm font-medium">Events:</span>
                       <div className="flex flex-wrap gap-2 mt-1">
                         {webhook.events?.map((event) => (
                           <Badge key={event} variant="outline">
                             {event}
                           </Badge>
                         ))}
                       </div>
                     </div>
                     {webhook.headers && Object.keys(webhook.headers as object).length > 0 && (
                       <div>
                         <span className="text-sm font-medium">Custom Headers:</span>
                         <div className="text-sm text-muted-foreground mt-1">
                           {Object.keys(webhook.headers as object).length} header(s) configured
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                </CardContent>
            </Card>
            </AnimatedItem>
          ))
        )}
      </AnimatedList>

      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <WebhookLogsDialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
        webhookId={selectedWebhook}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
