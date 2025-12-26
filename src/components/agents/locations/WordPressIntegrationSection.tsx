/**
 * WordPressIntegrationSection Component
 * 
 * Consolidated collapsible WordPress integration section combining
 * site connection, community sync, and property/homes sync functionality.
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { RefreshCw01, Check, AlertCircle, ArrowRight, ChevronRight, Zap, Home01, Trash01, LinkExternal01, Building01, Settings01, SearchRefraction } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';
import { useWordPressHomes } from '@/hooks/useWordPressHomes';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

// Official WordPress blue logo
const WordPressIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 122.52 122.523" className={className}>
    <g fill="#21759b">
      <path d="m8.708 61.26c0 20.802 12.089 38.779 29.619 47.298l-25.069-68.686c-2.916 6.536-4.55 13.769-4.55 21.388z"/>
      <path d="m96.74 58.608c0-6.495-2.333-10.993-4.334-14.494-2.664-4.329-5.161-7.995-5.161-12.324 0-4.831 3.664-9.328 8.825-9.328.233 0 .454.029.681.042-9.35-8.566-21.807-13.796-35.489-13.796-18.36 0-34.513 9.42-43.91 23.688 1.233.037 2.395.063 3.382.063 5.497 0 14.006-.667 14.006-.667 2.833-.167 3.167 3.994.337 4.329 0 0-2.847.335-6.015.501l19.138 56.925 11.501-34.493-8.188-22.434c-2.83-.166-5.511-.501-5.511-.501-2.832-.166-2.5-4.496.332-4.329 0 0 8.679.667 13.843.667 5.496 0 14.006-.667 14.006-.667 2.835-.167 3.168 3.994.337 4.329 0 0-2.853.335-6.015.501l18.992 56.494 5.242-17.517c2.272-7.269 4.001-12.49 4.001-16.989z"/>
      <path d="m62.184 65.857-15.768 45.819c4.708 1.384 9.687 2.141 14.846 2.141 6.12 0 11.989-1.058 17.452-2.979-.141-.225-.269-.464-.374-.724z"/>
      <path d="m107.376 36.046c.226 1.674.354 3.471.354 5.404 0 5.333-.996 11.328-3.996 18.824l-16.053 46.413c15.624-9.111 26.133-26.038 26.133-45.426.001-9.137-2.333-17.729-6.438-25.215z"/>
      <path d="m61.262 0c-33.779 0-61.262 27.481-61.262 61.26 0 33.783 27.483 61.263 61.262 61.263 33.778 0 61.265-27.48 61.265-61.263-.001-33.779-27.487-61.26-61.265-61.26zm0 119.715c-32.23 0-58.453-26.223-58.453-58.455 0-32.23 26.222-58.451 58.453-58.451 32.229 0 58.45 26.221 58.45 58.451 0 32.232-26.221 58.455-58.45 58.455z"/>
    </g>
  </svg>
);

interface WordPressIntegrationSectionProps {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

const SYNC_INTERVAL_OPTIONS = [
  { value: 'manual', label: 'Manual only' },
  { value: 'hourly_1', label: 'Every hour' },
  { value: 'hourly_2', label: 'Every 2 hours' },
  { value: 'hourly_3', label: 'Every 3 hours' },
  { value: 'hourly_4', label: 'Every 4 hours' },
  { value: 'hourly_6', label: 'Every 6 hours' },
  { value: 'hourly_8', label: 'Every 8 hours' },
  { value: 'hourly_12', label: 'Every 12 hours' },
  { value: 'daily', label: 'Daily' },
];

export function WordPressIntegrationSection({ agent, onSyncComplete }: WordPressIntegrationSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [useAiExtraction, setUseAiExtraction] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [deleteOnDisconnect, setDeleteOnDisconnect] = useState(false);

  const {
    siteUrl,
    lastSync: connectionLastSync,
    communityCount,
    communitySyncInterval,
    homeSyncInterval,
    communityEndpoint,
    homeEndpoint,
    isTesting: connectionTesting,
    isSyncing: connectionSyncing,
    isSaving,
    isDiscovering,
    testResult: connectionTestResult,
    discoveredEndpoints,
    isConnected,
    testConnection,
    saveUrl,
    importCommunities,
    updateSyncInterval,
    updateEndpoint,
    discoverEndpoints,
    disconnect,
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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [communityEndpointInput, setCommunityEndpointInput] = useState(communityEndpoint || 'community');
  const [homeEndpointInput, setHomeEndpointInput] = useState(homeEndpoint || 'home');

  // Sync endpoint inputs when stored values change
  useEffect(() => {
    setCommunityEndpointInput(communityEndpoint || 'community');
  }, [communityEndpoint]);

  useEffect(() => {
    setHomeEndpointInput(homeEndpoint || 'home');
  }, [homeEndpoint]);

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
    const url = inputUrl.trim() || undefined;
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

  const handleDisconnect = async () => {
    await disconnect(deleteOnDisconnect);
    setShowDisconnectDialog(false);
    setDeleteOnDisconnect(false);
  };

  const handleCommunitySyncIntervalChange = async (value: string) => {
    await updateSyncInterval('community', value);
  };

  const handleHomeSyncIntervalChange = async (value: string) => {
    await updateSyncInterval('home', value);
  };

  // Summary for collapsed state
  const getSummary = () => {
    const parts: string[] = [];
    if (isConnected) {
      if (communityCount) parts.push(`${communityCount} communities`);
      if (homeCount) parts.push(`${homeCount} homes`);
      if (parts.length === 0) parts.push('No data synced yet');
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#21759b]/10">
          <WordPressIcon className="h-4 w-4" />
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
              {/* Connection Status Card - shown when connected */}
              {isConnected && !isEditing && (
                <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Connected Site</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <a 
                          href={siteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                        >
                          {siteUrl.replace(/^https?:\/\//, '')}
                          <LinkExternal01 className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDisconnectDialog(true)}
                      >
                        <Trash01 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Site URL Input - shown when not connected or editing */}
              {(!isConnected || isEditing) && (
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Site URL</Label>
                  <Input
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      clearConnectionTestResult();
                    }}
                    onBlur={() => {
                      // Save URL immediately when user clicks away
                      if (inputUrl.trim()) {
                        saveUrl(inputUrl.trim());
                      }
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

              {/* Communities Section - shown when connected */}
              {isConnected && !isEditing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building01 className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Communities</Label>
                    {communityCount !== undefined && communityCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{communityCount} synced</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Auto-sync:</Label>
                      <Select
                        value={communitySyncInterval}
                        onValueChange={handleCommunitySyncIntervalChange}
                      >
                        <SelectTrigger className="h-7 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYNC_INTERVAL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>

                  {formatLastSync(connectionLastSync) && (
                    <p className="text-xs text-muted-foreground">
                      Last synced {formatLastSync(connectionLastSync)}
                    </p>
                  )}
                </div>
              )}

              {/* Property Listings Section - shown when connected */}
              {isConnected && !isEditing && (
                <>
                  <Separator />
                  <div className="space-y-3">
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
                          <Zap className="h-3 w-3 text-warning" />
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

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Auto-sync:</Label>
                        <Select
                          value={homeSyncInterval}
                          onValueChange={handleHomeSyncIntervalChange}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SYNC_INTERVAL_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-xs">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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

                    {formatLastSync(homesLastSync) && (
                      <p className="text-xs text-muted-foreground">
                        Last synced {formatLastSync(homesLastSync)}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Advanced Settings - shown when connected */}
              {isConnected && !isEditing && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Settings01 className="h-3.5 w-3.5" />
                      <span>Advanced Settings</span>
                      <motion.div
                        animate={{ rotate: showAdvanced ? 90 : 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {showAdvanced && (
                        <motion.div
                          initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 pt-2">
                            <p className="text-xs text-muted-foreground">
                              Custom post type endpoints for non-standard WordPress configurations.
                            </p>

                            {/* Auto-detect button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => discoverEndpoints(siteUrl)}
                              disabled={isDiscovering || !siteUrl}
                              className="h-7"
                            >
                              {isDiscovering ? (
                                <>
                                  <RefreshCw01 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Detecting...
                                </>
                              ) : (
                                <>
                                  <SearchRefraction className="h-3.5 w-3.5 mr-1.5" />
                                  Auto-detect Endpoints
                                </>
                              )}
                            </Button>

                            {/* Discovered endpoints */}
                            {discoveredEndpoints && (
                              <div className="p-2 rounded bg-muted/50 border space-y-2">
                                <p className="text-xs font-medium">Discovered post types:</p>
                                {discoveredEndpoints.communityEndpoints.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Communities:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {discoveredEndpoints.communityEndpoints.map((ep: { slug: string; name: string; rest_base: string }) => (
                                        <button
                                          key={ep.rest_base}
                                          type="button"
                                          onClick={() => {
                                            setCommunityEndpointInput(ep.rest_base);
                                            updateEndpoint('community', ep.rest_base);
                                          }}
                                          className={cn(
                                            "text-xs px-2 py-0.5 rounded border transition-colors",
                                            communityEndpointInput === ep.rest_base
                                              ? "bg-primary text-primary-foreground border-primary"
                                              : "bg-background hover:bg-accent border-border"
                                          )}
                                        >
                                          {ep.name || ep.slug}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {discoveredEndpoints.homeEndpoints.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Homes/Properties:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {discoveredEndpoints.homeEndpoints.map((ep: { slug: string; name: string; rest_base: string }) => (
                                        <button
                                          key={ep.rest_base}
                                          type="button"
                                          onClick={() => {
                                            setHomeEndpointInput(ep.rest_base);
                                            updateEndpoint('home', ep.rest_base);
                                          }}
                                          className={cn(
                                            "text-xs px-2 py-0.5 rounded border transition-colors",
                                            homeEndpointInput === ep.rest_base
                                              ? "bg-primary text-primary-foreground border-primary"
                                              : "bg-background hover:bg-accent border-border"
                                          )}
                                        >
                                          {ep.name || ep.slug}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {discoveredEndpoints.communityEndpoints.length === 0 && discoveredEndpoints.homeEndpoints.length === 0 && (
                                  <p className="text-xs text-muted-foreground italic">No custom post types detected. Using defaults.</p>
                                )}
                              </div>
                            )}

                            {/* Manual endpoint inputs */}
                            <div className="grid gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Community endpoint</Label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">/wp-json/wp/v2/</span>
                                  <Input
                                    value={communityEndpointInput}
                                    onChange={(e) => setCommunityEndpointInput(e.target.value)}
                                    onBlur={() => {
                                      if (communityEndpointInput.trim() && communityEndpointInput !== communityEndpoint) {
                                        updateEndpoint('community', communityEndpointInput.trim());
                                      }
                                    }}
                                    placeholder="community"
                                    className="h-7 text-xs flex-1"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Home/Property endpoint</Label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">/wp-json/wp/v2/</span>
                                  <Input
                                    value={homeEndpointInput}
                                    onChange={(e) => setHomeEndpointInput(e.target.value)}
                                    onBlur={() => {
                                      if (homeEndpointInput.trim() && homeEndpointInput !== homeEndpoint) {
                                        updateEndpoint('home', homeEndpointInput.trim());
                                      }
                                    }}
                                    placeholder="home"
                                    className="h-7 text-xs flex-1"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect WordPress?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the WordPress connection from this agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Switch
              id="delete-locations"
              checked={deleteOnDisconnect}
              onCheckedChange={setDeleteOnDisconnect}
            />
            <Label htmlFor="delete-locations" className="text-sm cursor-pointer">
              Also delete all synced locations ({communityCount || 0} communities)
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
