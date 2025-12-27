/**
 * CalendarConnections Component
 * 
 * Displays connected calendars with real-time sync status, webhook health,
 * and provides connect/disconnect/sync actions.
 * 
 * @module components/agents/locations/CalendarConnections
 * @verified Phase 5 & 6 Complete - December 2025
 */

import React, { useState, useCallback } from 'react';
import { 
  Calendar, 
  Link01, 
  LinkBroken01, 
  AlertCircle, 
  Check, 
  RefreshCcw01,
  ChevronDown,
  ChevronUp
} from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { useConnectedAccounts, ConnectedAccount } from '@/hooks/useConnectedAccounts';
import { CalendarSyncStatus } from './CalendarSyncStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { GoogleCalendarLogo, MicrosoftOutlookLogo } from '@/components/icons/CalendarLogos';
import { logger } from '@/utils/logger';
import { 
  triggerManualSync, 
  testWebhookConnection,
  parseCalendarSyncError 
} from '@/lib/calendar-sync-utils';
import { cn } from '@/lib/utils';

interface CalendarConnectionsProps {
  locationId: string;
  agentId: string;
}

interface AccountCardProps {
  account: ConnectedAccount;
  onDisconnect: (id: string) => void;
  onRefetch: () => void;
}

function AccountCard({ account, onDisconnect, onRefetch }: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const parsedError = parseCalendarSyncError(account.sync_error);
  
  const handleManualSync = useCallback(async () => {
    const success = await triggerManualSync(account.id, account.provider);
    if (success) {
      onRefetch();
    }
  }, [account.id, account.provider, onRefetch]);
  
  const handleTestWebhook = useCallback(async () => {
    await testWebhookConnection(account.id, account.provider);
  }, [account.id, account.provider]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          'rounded-lg border bg-muted/30 transition-colors',
          account.sync_error && 'border-destructive/30 bg-destructive/5'
        )}
      >
        {/* Main Row */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 min-w-0">
            {account.provider === 'google_calendar' ? (
              <GoogleCalendarLogo className="w-5 h-5 flex-shrink-0" />
            ) : (
              <MicrosoftOutlookLogo className="w-5 h-5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{account.account_email}</p>
              {account.calendar_name && (
                <p className="text-xs text-muted-foreground truncate">{account.calendar_name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick Status Badge */}
            {account.sync_error ? (
              <Badge variant="destructive" className="text-2xs">
                <AlertCircle size={10} className="mr-1" />
                Error
              </Badge>
            ) : account.is_active && account.webhook_channel_id ? (
              <Badge variant="secondary" className="text-2xs bg-status-active/10 text-status-active">
                <Check size={10} className="mr-1" />
                Live
              </Badge>
            ) : account.is_active ? (
              <Badge variant="secondary" className="text-2xs bg-status-pending/10 text-status-pending">
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-2xs">Inactive</Badge>
            )}
            
            {/* Expand/Collapse */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
            </CollapsibleTrigger>
            
            {/* Disconnect */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDisconnect(account.id)}
            >
              <LinkBroken01 size={14} />
            </Button>
          </div>
        </div>
        
        {/* Expanded Details */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 space-y-3">
            <Separator />
            
            {/* Sync Status with Actions */}
            <CalendarSyncStatus
              account={account}
              onManualSync={handleManualSync}
              onTestWebhook={account.webhook_channel_id ? handleTestWebhook : undefined}
            />
            
            {/* Error Details */}
            {parsedError && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-medium text-destructive">{parsedError.message}</p>
                {parsedError.userAction && (
                  <p className="text-2xs text-muted-foreground mt-1">{parsedError.userAction}</p>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function CalendarConnections({
  locationId,
  agentId,
}: CalendarConnectionsProps) {
  const { accounts, loading, disconnectAccount, refetch } = useConnectedAccounts(locationId, agentId);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<'google' | 'outlook' | null>(null);

  const accountToDisconnect = accounts.find((a) => a.id === disconnectId);

  const initiateOAuth = async (provider: 'google' | 'outlook') => {
    setConnecting(provider);
    try {
      const functionName = provider === 'google' ? 'google-calendar-auth' : 'outlook-calendar-auth';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'initiate',
          locationId,
          agentId,
        },
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('No auth URL returned');

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        'CalendarOAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback message
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'oauth-callback') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
          
          if (event.data.success) {
            toast.success(`${event.data.provider || (provider === 'google' ? 'Google Calendar' : 'Outlook Calendar')} connected`);
            refetch();
          } else {
            toast.error('Failed to connect calendar', { description: event.data.error });
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
        }
      }, 500);
    } catch (error: unknown) {
      logger.error('OAuth initiation error:', error);
      toast.error('Failed to start calendar connection');
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectId) return;
    await disconnectAccount(disconnectId);
    setDisconnectId(null);
  };

  return (
    <div className="space-y-4">
      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDisconnect={setDisconnectId}
              onRefetch={refetch}
            />
          ))}
        </div>
      )}

      {accounts.length > 0 && <Separator />}

      {/* Connect Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => initiateOAuth('google')}
          disabled={!!connecting}
        >
          <GoogleCalendarLogo className="w-4 h-4 mr-2" />
          {connecting === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => initiateOAuth('outlook')}
          disabled={!!connecting}
        >
          <MicrosoftOutlookLogo className="w-4 h-4 mr-2" />
          {connecting === 'outlook' ? 'Connecting...' : 'Connect Outlook Calendar'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Connected calendars sync appointments in real-time and enable booking through Ari.
      </p>

      <SimpleDeleteDialog
        open={!!disconnectId}
        onOpenChange={(open) => !open && setDisconnectId(null)}
        title="Disconnect Calendar"
        description={`Are you sure you want to disconnect "${accountToDisconnect?.account_email}"? Synced events will remain but new events won't be created.`}
        onConfirm={handleDisconnect}
        actionLabel="Disconnect"
        destructive={false}
      />
    </div>
  );
}
