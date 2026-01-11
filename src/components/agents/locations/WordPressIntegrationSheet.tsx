/**
 * WordPress Integration Sheet
 * 
 * Clean, card-based layout for managing WordPress connection and sync settings.
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  RefreshCw01, 
  Check, 
  AlertCircle, 
  Zap, 
  Home01, 
  Trash01, 
  LinkExternal01, 
  Building01, 
  Settings01,
  ChevronDown,
  Edit02,
  XClose,
  Link01
} from '@untitledui/icons';
import { InfoCircleIcon } from '@/components/ui/info-circle-icon';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';
import { useWordPressHomes } from '@/hooks/useWordPressHomes';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressIntegrationSheetProps {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function formatLastSync(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function WordPressIntegrationSheet({ 
  agent, 
  onSyncComplete, 
  open, 
  onOpenChange 
}: WordPressIntegrationSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [useAiExtraction, setUseAiExtraction] = useState(true);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [deleteLocationsOnDisconnect, setDeleteLocationsOnDisconnect] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    isDiscovering,
    testResult: connectionTestResult,
    discoveredEndpoints,
    isConnected,
    testConnection,
    importCommunities,
    updateSyncInterval,
    updateEndpoint,
    disconnect,
    discoverEndpoints,
  } = useWordPressConnection({ agent, onSyncComplete });

  const {
    lastSync: homesLastSync,
    homeCount,
    isSyncing: homesSyncing,
    syncHomes,
  } = useWordPressHomes({ agent, onSyncComplete });

  // Sync local state with hook values
  useEffect(() => {
    if (siteUrl) setUrlInput(siteUrl);
  }, [siteUrl]);

  const handleConnect = async () => {
    if (!urlInput.trim()) return;
    const result = await testConnection(urlInput.trim());
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect(deleteLocationsOnDisconnect);
    setShowDisconnectDialog(false);
    setDeleteLocationsOnDisconnect(false);
    setDeleteConfirmation('');
    setUrlInput('');
  };

  const handleSyncCommunities = () => importCommunities();
  const handleSyncHomes = () => syncHomes(undefined, useAiExtraction);

  const isLoading = connectionTesting || connectionSyncing || homesSyncing;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Link01 size={20} aria-hidden="true" />
              WordPress Integration
            </SheetTitle>
            <SheetDescription>
              Sync communities and property listings from your WordPress site.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Connection Card */}
            <Card>
              <CardContent className="p-4">
                <AnimatePresence mode="wait">
                  {isConnected && !isEditing ? (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-status-active shrink-0" />
                        <a 
                          href={siteUrl?.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary truncate flex items-center gap-1"
                        >
                          {siteUrl?.replace(/^https?:\/\//, '')}
                          <LinkExternal01 size={12} aria-hidden="true" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit02 size={16} aria-hidden="true" />
                          <span className="sr-only">Edit URL</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDisconnectDialog(true)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <XClose size={16} aria-hidden="true" />
                          <span className="sr-only">Disconnect</span>
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="wp-url" className="text-sm font-medium">
                          WordPress Site URL
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="wp-url"
                            placeholder="https://yoursite.com"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleConnect}
                            disabled={!urlInput.trim() || connectionTesting}
                            loading={connectionTesting}
                            size="sm"
                          >
                            {isEditing ? 'Update' : 'Connect'}
                          </Button>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setUrlInput(siteUrl || '');
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {connectionTestResult && (
                        <div className={`flex items-start gap-2 text-sm ${
                          connectionTestResult.success ? 'text-status-active' : 'text-destructive'
                        }`}>
                          {connectionTestResult.success ? (
                            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                          )}
                          <span>{connectionTestResult.message}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Sync sections - only when connected */}
            {isConnected && !isEditing && (
              <>
                {/* Communities Sync Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building01 size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm font-medium">Communities</span>
                        {(communityCount ?? 0) > 0 && (
                          <Badge variant="secondary" size="sm">
                            {communityCount}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSyncCommunities}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw01 
                          size={16} 
                          className={connectionSyncing ? 'animate-spin' : ''} 
                          aria-hidden="true" 
                        />
                        <span className="sr-only">Sync communities</span>
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last synced {formatLastSync(connectionLastSync ?? null)}
                    </div>
                    
                    <Select
                      value={communitySyncInterval}
                      onValueChange={(value) => updateSyncInterval('community', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNC_INTERVAL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Property Listings Sync Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home01 size={16} className="text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm font-medium">Property Listings</span>
                        {(homeCount ?? 0) > 0 && (
                          <Badge variant="secondary" size="sm">
                            {homeCount}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSyncHomes}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw01 
                          size={16} 
                          className={homesSyncing ? 'animate-spin' : ''} 
                          aria-hidden="true" 
                        />
                        <span className="sr-only">Sync properties</span>
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last synced {formatLastSync(homesLastSync)}
                    </div>
                    
                    <Select
                      value={homeSyncInterval}
                      onValueChange={(value) => updateSyncInterval('home', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNC_INTERVAL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* AI Extraction Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-warning" aria-hidden="true" />
                        <span className="text-xs font-medium">AI Extraction</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoCircleIcon className="text-muted-foreground cursor-help w-3 h-3" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                Uses AI to extract structured property data from page content. 
                                Improves accuracy but uses additional credits.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch
                        checked={useAiExtraction}
                        onCheckedChange={setUseAiExtraction}
                        aria-label="Enable AI extraction"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-between h-9 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <Settings01 size={14} aria-hidden="true" />
                        <span>Advanced Settings</span>
                      </div>
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                        aria-hidden="true" 
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="mt-2">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">API Endpoints</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => siteUrl && discoverEndpoints(siteUrl)}
                            disabled={isDiscovering || !siteUrl}
                            className="h-7 text-xs"
                          >
                            {isDiscovering ? (
                              <RefreshCw01 size={12} className="animate-spin mr-1" aria-hidden="true" />
                            ) : null}
                            Auto-detect
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Communities</Label>
                            <Input
                              value={communityEndpoint || ''}
                              onChange={(e) => updateEndpoint('community', e.target.value)}
                              placeholder="/wp-json/wp/v2/community"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Properties</Label>
                            <Input
                              value={homeEndpoint || ''}
                              onChange={(e) => updateEndpoint('home', e.target.value)}
                              placeholder="/wp-json/wp/v2/home"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {discoveredEndpoints && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                            <p className="font-medium mb-1">Discovered endpoints:</p>
                            {discoveredEndpoints.communityEndpoints?.[0] && (
                              <p>• Communities: {discoveredEndpoints.communityEndpoints[0].rest_base}</p>
                            )}
                            {discoveredEndpoints.homeEndpoints?.[0] && (
                              <p>• Properties: {discoveredEndpoints.homeEndpoints[0].rest_base}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect WordPress</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the WordPress connection. Your synced data will remain unless you choose to delete it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <Trash01 size={16} className="text-destructive mt-0.5 shrink-0" aria-hidden="true" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delete-locations" className="text-sm font-medium">
                    Delete synced locations
                  </Label>
                  <Switch
                    id="delete-locations"
                    checked={deleteLocationsOnDisconnect}
                    onCheckedChange={setDeleteLocationsOnDisconnect}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will permanently delete all communities and properties synced from WordPress.
                </p>
              </div>
            </div>

            {deleteLocationsOnDisconnect && (
              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm">
                  Type <span className="font-mono font-medium">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono"
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteLocationsOnDisconnect(false);
              setDeleteConfirmation('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={deleteLocationsOnDisconnect && deleteConfirmation !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
