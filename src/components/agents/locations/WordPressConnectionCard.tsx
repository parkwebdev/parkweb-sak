/**
 * WordPressConnectionCard Component
 * 
 * Allows users to connect a WordPress site and import communities as locations.
 * 
 * @module components/agents/locations/WordPressConnectionCard
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe01, RefreshCw01, Check, AlertCircle, ArrowRight } from '@untitledui/icons';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressConnectionCardProps {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

export function WordPressConnectionCard({ agent, onSyncComplete }: WordPressConnectionCardProps) {
  const {
    siteUrl,
    lastSync,
    communityCount,
    isTesting,
    isSyncing,
    testResult,
    isConnected,
    testConnection,
    importCommunities,
    clearTestResult,
  } = useWordPressConnection({ agent, onSyncComplete });

  const [inputUrl, setInputUrl] = useState(siteUrl);
  const [isEditing, setIsEditing] = useState(!isConnected);

  // Update input when siteUrl changes (e.g., after sync)
  useEffect(() => {
    setInputUrl(siteUrl);
    if (siteUrl) {
      setIsEditing(false);
    }
  }, [siteUrl]);

  const handleTest = async () => {
    if (!inputUrl.trim()) return;
    await testConnection(inputUrl.trim());
  };

  const handleImport = async () => {
    const url = isEditing ? inputUrl.trim() : undefined;
    await importCommunities(url);
  };

  const formatLastSync = () => {
    if (!lastSync) return null;
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true });
    } catch {
      return null;
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Globe01 className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm">WordPress Connection</h3>
            {isConnected && !isEditing && (
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            )}
          </div>

          {isConnected && !isEditing ? (
            // Connected state
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground truncate">{siteUrl}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {communityCount !== undefined && (
                  <span>{communityCount} communities</span>
                )}
                {formatLastSync() && (
                  <span>Last synced {formatLastSync()}</span>
                )}
              </div>
            </div>
          ) : (
            // Input state
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Enter your WordPress site URL to import communities as locations.
              </p>
              <Input
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  clearTestResult();
                }}
                placeholder="https://yoursite.com"
                className="h-9"
              />

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
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && !isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
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
                    Sync
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={!inputUrl.trim() || isTesting}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={!inputUrl.trim() || isSyncing || (testResult !== null && !testResult.success)}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw01 className="h-4 w-4 mr-1.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
              {isConnected && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setInputUrl(siteUrl);
                    setIsEditing(false);
                    clearTestResult();
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
