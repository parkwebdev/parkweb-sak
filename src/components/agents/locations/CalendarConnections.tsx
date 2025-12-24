/**
 * CalendarConnections Component
 * 
 * Displays connected calendars and provides connect/disconnect actions.
 * 
 * @module components/agents/locations/CalendarConnections
 */

import React, { useState } from 'react';
import { Calendar, Link01, LinkBroken01, AlertCircle, Check } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { GoogleCalendarLogo, MicrosoftOutlookLogo } from '@/components/icons/CalendarLogos';
import { logger } from '@/utils/logger';

interface CalendarConnectionsProps {
  locationId: string;
  agentId: string;
}

export const CalendarConnections: React.FC<CalendarConnectionsProps> = ({
  locationId,
  agentId,
}) => {
  const { accounts, loading, disconnectAccount } = useConnectedAccounts(locationId, agentId);
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
    } catch (error) {
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

  const googleAccounts = accounts.filter((a) => a.provider === 'google_calendar');
  const outlookAccounts = accounts.filter((a) => a.provider === 'outlook_calendar');

  return (
    <div className="space-y-4">
      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                {account.provider === 'google_calendar' ? (
                  <GoogleCalendarLogo className="w-5 h-5" />
                ) : (
                  <MicrosoftOutlookLogo className="w-5 h-5" />
                )}
                <div>
                  <p className="text-sm font-medium">{account.account_email}</p>
                  {account.calendar_name && (
                    <p className="text-xs text-muted-foreground">{account.calendar_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {account.sync_error ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle size={12} className="mr-1" />
                    Error
                  </Badge>
                ) : account.is_active ? (
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                    <Check size={12} className="mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisconnectId(account.id)}
                >
                  <LinkBroken01 size={14} />
                </Button>
              </div>
            </div>
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
        Connected calendars will sync appointments and enable booking through Ari's booking system.
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
};
