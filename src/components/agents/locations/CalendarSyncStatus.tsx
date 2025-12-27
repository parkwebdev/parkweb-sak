/**
 * CalendarSyncStatus Component
 * 
 * Displays real-time sync status, webhook health, and last sync time for calendar connections.
 * Part of Phase 5: UI Updates for Calendar Sync Status.
 * 
 * @module components/agents/locations/CalendarSyncStatus
 * @verified Phase 5 Complete - December 2025
 */

import { useState } from 'react';
import { 
  RefreshCcw01, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Wifi,
  WifiOff,
  ZapFast
} from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isAfter, parseISO, addDays } from 'date-fns';
import type { ConnectedAccount } from '@/hooks/useConnectedAccounts';

interface CalendarSyncStatusProps {
  account: ConnectedAccount;
  onManualSync?: () => Promise<void>;
  onTestWebhook?: () => Promise<void>;
}

type SyncHealth = 'healthy' | 'warning' | 'error' | 'inactive';

/**
 * Determines the health status of a webhook subscription
 */
function getWebhookHealth(account: ConnectedAccount): SyncHealth {
  if (!account.is_active) return 'inactive';
  if (account.sync_error) return 'error';
  if (!account.webhook_channel_id) return 'warning';
  
  // Check if webhook is expiring soon (within 1 day)
  if (account.webhook_expires_at) {
    const expiresAt = parseISO(account.webhook_expires_at);
    const warningThreshold = addDays(new Date(), 1);
    if (!isAfter(expiresAt, warningThreshold)) {
      return 'warning';
    }
  }
  
  return 'healthy';
}

/**
 * Gets a human-readable status message based on account state
 */
function getStatusMessage(account: ConnectedAccount, health: SyncHealth): string {
  if (account.sync_error) {
    return account.sync_error;
  }
  
  if (!account.webhook_channel_id) {
    return 'Webhook not configured - real-time sync disabled';
  }
  
  if (health === 'warning' && account.webhook_expires_at) {
    return `Webhook expires ${formatDistanceToNow(parseISO(account.webhook_expires_at), { addSuffix: true })}`;
  }
  
  if (!account.is_active) {
    return 'Calendar connection is inactive';
  }
  
  return 'Real-time sync active';
}

export function CalendarSyncStatus({
  account,
  onManualSync,
  onTestWebhook,
}: CalendarSyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const health = getWebhookHealth(account);
  const statusMessage = getStatusMessage(account, health);
  
  const handleManualSync = async () => {
    if (!onManualSync) return;
    setIsSyncing(true);
    try {
      await onManualSync();
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleTestWebhook = async () => {
    if (!onTestWebhook) return;
    setIsTesting(true);
    try {
      await onTestWebhook();
    } finally {
      setIsTesting(false);
    }
  };

  const healthColors: Record<SyncHealth, string> = {
    healthy: 'bg-status-active/10 text-status-active border-status-active/20',
    warning: 'bg-status-pending/10 text-status-pending border-status-pending/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    inactive: 'bg-muted text-muted-foreground border-border',
  };

  const healthIcons: Record<SyncHealth, React.ReactNode> = {
    healthy: <Wifi size={12} />,
    warning: <Clock size={12} />,
    error: <AlertCircle size={12} />,
    inactive: <WifiOff size={12} />,
  };

  const healthLabels: Record<SyncHealth, string> = {
    healthy: 'Live',
    warning: 'Expiring',
    error: 'Error',
    inactive: 'Inactive',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Webhook Status Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'text-2xs font-normal cursor-help',
                healthColors[health]
              )}
            >
              {healthIcons[health]}
              <span className="ml-1">{healthLabels[health]}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{statusMessage}</p>
            {account.webhook_expires_at && health !== 'error' && (
              <p className="text-2xs text-muted-foreground mt-1">
                Webhook expires: {formatDistanceToNow(parseISO(account.webhook_expires_at), { addSuffix: true })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Last Synced Time */}
      {account.last_synced_at && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-2xs text-muted-foreground cursor-help flex items-center gap-1">
                <CheckCircle size={10} />
                {formatDistanceToNow(parseISO(account.last_synced_at), { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Last synced: {new Date(account.last_synced_at).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Manual Sync Button */}
        {onManualSync && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                >
                  <RefreshCcw01 
                    size={14} 
                    className={cn(isSyncing && 'animate-spin')} 
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Sync now</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Test Webhook Button */}
        {onTestWebhook && account.webhook_channel_id && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleTestWebhook}
                  disabled={isTesting}
                >
                  <ZapFast 
                    size={14} 
                    className={cn(isTesting && 'animate-pulse')} 
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Test webhook</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
