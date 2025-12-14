/**
 * WordPressIntegrationSection Component
 * 
 * Consolidated collapsible WordPress integration section combining
 * site connection and property/homes sync functionality.
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe01, RefreshCw01, Check, AlertCircle, ArrowRight, ChevronRight, Zap, Home01 } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';
import { useWordPressHomes } from '@/hooks/useWordPressHomes';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressIntegrationSectionProps {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

export function WordPressIntegrationSection({ agent, onSyncComplete }: WordPressIntegrationSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [useAiExtraction, setUseAiExtraction] = useState(false);

  const {
    siteUrl,
    lastSync: connectionLastSync,
    communityCount,
    isTesting: connectionTesting,
    isSyncing: connectionSyncing,
    testResult: connectionTestResult,
    isConnected,
    testConnection,
    importCommunities,
    clearTestResult: clearConnectionTestResult,
  } = useWordPressConnection({ agent, onSyncComplete });

  const {
    lastSync: homesLastSync,
    homeCount,
    isTesting: homesTesting,
    isSyncing: homesSyncing,
    testResult: homesTestResult,
    testHomesEndpoint,
    syncHomes,
    clearTestResult: clearHomesTestResult,
  } = useWordPressHomes({ agent, onSyncComplete });

  // Update input when siteUrl changes
  useEffect(() => {
    setInputUrl(siteUrl);
    if (siteUrl && !isEditing) {
      setIsEditing(false);
    }
  }, [siteUrl]);

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return null;
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) return;
    await testConnection(inputUrl.trim());
  };

  const handleImportCommunities = async () => {
    const url = isEditing ? inputUrl.trim() : undefined;
    await importCommunities(url);
    setIsEditing(false);
  };

  const handleTestHomes = async () => {
    if (!siteUrl) return;
    await testHomesEndpoint(siteUrl);
  };

  const handleSyncHomes = async () => {
    await syncHomes(undefined, useAiExtraction);
  };

  // Summary for collapsed state
  const getSummary = () => {
    const parts: string[] = [];
    if (isConnected) {
      parts.push('Connected');
      if (communityCount) parts.push(`${communityCount} communities`);
      if (homeCount) parts.push(`${homeCount} homes`);
    } else {
      parts.push('Not connected');
    }
    return parts.join(' • ');
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Globe01 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">WordPress Integration</span>
            {isConnected && (
              <Badge variant="secondary" className="text-xs">Connected</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{getSummary()}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 pl-11">
        {/* Site Connection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Site URL</Label>
            {isConnected && !isEditing && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          
          {isConnected && !isEditing ? (
            <div className="flex items-center justify-between">
              <span className="text-sm truncate">{siteUrl}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleImportCommunities}
                disabled={connectionSyncing}
                className="h-7"
              >
                {connectionSyncing ? (
                  <RefreshCw01 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <RefreshCw01 className="h-3.5 w-3.5 mr-1.5" />
                    Sync
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  clearConnectionTestResult();
                }}
                placeholder="https://yoursite.com"
                className="h-8"
              />
              
              {connectionTestResult && (
                <div
                  className={cn(
                    'flex items-start gap-2 text-xs p-2 rounded',
                    connectionTestResult.success
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {connectionTestResult.success ? (
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  )}
                  <span>{connectionTestResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={!inputUrl.trim() || connectionTesting}
                  className="h-7"
                >
                  {connectionTesting ? 'Testing...' : 'Test'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleImportCommunities}
                  disabled={!inputUrl.trim() || connectionSyncing || (connectionTestResult !== null && !connectionTestResult.success)}
                  className="h-7"
                >
                  {connectionSyncing ? (
                    <>
                      <RefreshCw01 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
                {isConnected && isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => {
                      setInputUrl(siteUrl);
                      setIsEditing(false);
                      clearConnectionTestResult();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {formatLastSync(connectionLastSync) && (
            <p className="text-xs text-muted-foreground">
              Communities synced {formatLastSync(connectionLastSync)}
            </p>
          )}
        </div>

        {/* Property Listings - only show if connected */}
        {isConnected && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Home01 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property Listings</Label>
              {homeCount !== undefined && homeCount > 0 && (
                <Badge variant="secondary" className="text-xs">{homeCount} homes</Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Sync home/property listings to enable AI-powered property search.
            </p>

            {/* AI Extraction toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="ai-extraction"
                checked={useAiExtraction}
                onCheckedChange={setUseAiExtraction}
                disabled={homesSyncing}
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
                      <InfoCircleIcon className="h-4 w-4 group-hover:hidden" />
                      <InfoCircleIconFilled className="h-4 w-4 hidden group-hover:block" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Enable if your WordPress site doesn't use ACF. AI will parse property details from page HTML.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {homesTestResult && (
              <div
                className={cn(
                  'flex items-start gap-2 text-xs p-2 rounded',
                  homesTestResult.success
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {homesTestResult.success ? (
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                )}
                <span>
                  {homesTestResult.message}
                  {homesTestResult.homeCount !== undefined && homesTestResult.homeCount > 0 && (
                    <span className="font-medium"> ({homesTestResult.homeCount} homes found)</span>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestHomes}
                disabled={homesTesting || homesSyncing}
                className="h-7"
              >
                {homesTesting ? 'Testing...' : 'Test'}
              </Button>
              <Button
                size="sm"
                onClick={handleSyncHomes}
                disabled={homesSyncing}
                className="h-7"
              >
                {homesSyncing ? (
                  <>
                    <RefreshCw01 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw01 className="h-3.5 w-3.5 mr-1.5" />
                    Sync Homes
                  </>
                )}
              </Button>
            </div>

            {formatLastSync(homesLastSync) && (
              <p className="text-xs text-muted-foreground">
                Homes synced {formatLastSync(homesLastSync)}
              </p>
            )}
          </div>
        )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
