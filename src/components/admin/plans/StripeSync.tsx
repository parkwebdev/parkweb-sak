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
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { getErrorMessage } from '@/types/errors';

interface SyncResult {
  success: boolean;
  synced: number;
  total: number;
  errors?: string[];
}

/**
 * Component for managing Stripe synchronization.
 * Pulls product/price data FROM Stripe and updates the local plans table.
 */
export function StripeSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
        body: { action: 'sync_products' },
      });

      if (error) throw error;

      const result = data as SyncResult;
      setLastResult(result);
      
      // Invalidate plans query to refresh the table
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans.all() });
      
      if (result.errors && result.errors.length > 0) {
        toast.warning(`Synced ${result.synced}/${result.total} products`, {
          description: `${result.errors.length} errors occurred`,
        });
      } else {
        toast.success(`Synced ${result.synced} products from Stripe`);
      }
    } catch (error: unknown) {
      toast.error('Failed to sync with Stripe', { 
        description: getErrorMessage(error) 
      });
    } finally {
      setSyncing(false);
    }
  };

  const statusBadge = () => {
    if (syncing) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw01 size={12} className="animate-spin" aria-hidden="true" />
          Syncing
        </Badge>
      );
    }
    
    if (lastResult?.errors && lastResult.errors.length > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle size={12} aria-hidden="true" />
          Partial Sync
        </Badge>
      );
    }
    
    if (lastResult?.success) {
      return (
        <Badge variant="outline" className="gap-1 text-status-active">
          <CheckCircle size={12} aria-hidden="true" />
          Synced
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Stripe Sync</CardTitle>
            <CardDescription>
              Import products and prices from your Stripe account
            </CardDescription>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            {lastResult && (
              <p className="text-sm text-muted-foreground">
                Last sync: {lastResult.synced}/{lastResult.total} products imported
              </p>
            )}
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
            {syncing ? 'Syncing...' : 'Sync from Stripe'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <p>
            Syncing pulls products and prices <strong>from Stripe</strong> into your local plans table.
            To change pricing, update it in the Stripe Dashboard and sync again.
          </p>
        </div>
        
        {lastResult?.errors && lastResult.errors.length > 0 && (
          <div className="text-xs text-destructive border-t border-border pt-3">
            <p className="font-medium mb-1">Sync errors:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {lastResult.errors.slice(0, 3).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {lastResult.errors.length > 3 && (
                <li>...and {lastResult.errors.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
