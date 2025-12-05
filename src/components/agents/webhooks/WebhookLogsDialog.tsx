import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useWebhooks } from '@/hooks/useWebhooks';
import { CheckCircle, XCircle, Clock } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WebhookLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string | null;
  agentId?: string;
}

export const WebhookLogsDialog = ({ open, onOpenChange, webhookId, agentId }: WebhookLogsDialogProps) => {
  const { logs, fetchLogs } = useWebhooks(agentId);

  useEffect(() => {
    if (open && webhookId) {
      fetchLogs(webhookId);
    }
  }, [open, webhookId]);

  const getStatusColor = (delivered: boolean, status: number | null) => {
    if (delivered && status && status >= 200 && status < 300) {
      return 'default';
    }
    return 'destructive';
  };

  const getStatusIcon = (delivered: boolean, status: number | null) => {
    if (delivered && status && status >= 200 && status < 300) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <XCircle className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Webhook Delivery Logs</DialogTitle>
          <DialogDescription>
            View the delivery history and status of webhook events
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 px-8 rounded-lg border border-dashed bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No webhook deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(log.delivered, log.response_status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(log.delivered, log.response_status)}
                          {log.response_status || 'Failed'}
                        </span>
                      </Badge>
                      <span className="font-medium">{log.event_type}</span>
                      {log.retry_count > 0 && (
                        <Badge variant="outline">
                          Retry {log.retry_count}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {log.error_message && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      <strong>Error:</strong> {log.error_message}
                    </div>
                  )}

                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View payload
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-xs">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>

                  {log.response_body && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View response
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-xs">
                        {log.response_body}
                      </pre>
                    </details>
                  )}

                  {log.delivered_at && (
                    <div className="text-xs text-muted-foreground">
                      Delivered at {new Date(log.delivered_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};