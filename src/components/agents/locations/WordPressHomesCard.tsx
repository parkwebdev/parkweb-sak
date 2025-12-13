/**
 * WordPressHomesCard Component
 * 
 * Shows home/property sync status and allows syncing from WordPress.
 * 
 * @module components/agents/locations/WordPressHomesCard
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Home01, RefreshCw01, Check, AlertCircle, Zap } from '@untitledui/icons';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { useWordPressHomes } from '@/hooks/useWordPressHomes';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressHomesCardProps {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

export function WordPressHomesCard({ agent, onSyncComplete }: WordPressHomesCardProps) {
  const {
    siteUrl,
    lastSync,
    homeCount,
    isConnected,
    isTesting,
    isSyncing,
    testResult,
    testHomesEndpoint,
    syncHomes,
    clearTestResult,
  } = useWordPressHomes({ agent, onSyncComplete });

  const [useAiExtraction, setUseAiExtraction] = useState(false);

  if (!isConnected) {
    return null; // Don't show if WordPress not connected
  }

  const formatLastSync = () => {
    if (!lastSync) return null;
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const handleTest = async () => {
    if (!siteUrl) return;
    await testHomesEndpoint(siteUrl);
  };

  const handleSync = async () => {
    await syncHomes(undefined, useAiExtraction);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Home01 className="h-5 w-5 text-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm">Property Listings</h3>
            {homeCount !== undefined && homeCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {homeCount} homes
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Sync home/property listings from your WordPress site to enable AI-powered property search.
            </p>

            {/* Last sync info */}
            {formatLastSync() && (
              <p className="text-xs text-muted-foreground">
                Last synced {formatLastSync()}
              </p>
            )}

            {/* AI Extraction toggle */}
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="ai-extraction"
                checked={useAiExtraction}
                onCheckedChange={setUseAiExtraction}
                disabled={isSyncing}
              />
              <Label htmlFor="ai-extraction" className="text-xs text-muted-foreground cursor-pointer">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-orange-500" />
                  Use AI extraction
                </span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="group inline-flex text-muted-foreground hover:text-foreground transition-colors">
                      <InfoCircleIcon className="h-4 w-4" />
                      <InfoCircleIconFilled className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Enable this if your WordPress site doesn't use ACF (Advanced Custom Fields). AI will parse property details from your page HTML instead. Only use if standard sync returns incomplete data.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Test result feedback */}
            {testResult && (
              <div
                className={cn(
                  'flex items-start gap-2 text-xs p-2 rounded',
                  testResult.success
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {testResult.success ? (
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                )}
                <span>
                  {testResult.message}
                  {testResult.homeCount !== undefined && testResult.homeCount > 0 && (
                    <span className="font-medium"> ({testResult.homeCount} homes found)</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isSyncing}
          >
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw01 className="h-4 w-4 mr-1.5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw01 className="h-4 w-4 mr-1.5" />
                Sync Homes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
