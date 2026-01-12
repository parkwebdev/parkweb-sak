/**
 * StripeSync Component
 * 
 * Controls for syncing plans with Stripe.
 * 
 * @module components/admin/plans/StripeSync
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw01, CheckCircle, AlertCircle } from '@untitledui/icons';
import { toast } from 'sonner';

interface StripeSyncProps {
  lastSyncedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

/**
 * Component for managing Stripe synchronization.
 */
export function StripeSync({ lastSyncedAt, syncStatus = 'synced' }: StripeSyncProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // TODO: Implement actual Stripe sync
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Plans synced with Stripe');
    } catch {
      toast.error('Failed to sync with Stripe');
    } finally {
      setSyncing(false);
    }
  };

  const statusBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <Badge variant="outline" className="gap-1 text-status-active">
            <CheckCircle size={12} aria-hidden="true" />
            Synced
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw01 size={12} className="animate-spin" aria-hidden="true" />
            Syncing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle size={12} aria-hidden="true" />
            Error
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Stripe Sync</CardTitle>
            <CardDescription>
              Synchronize plans with your Stripe account
            </CardDescription>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {lastSyncedAt
                ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
                : 'Never synced'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw01
              size={14}
              className={syncing ? 'animate-spin mr-1' : 'mr-1'}
              aria-hidden="true"
            />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <p>
            Syncing will update Stripe products and prices to match your plan
            configuration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
