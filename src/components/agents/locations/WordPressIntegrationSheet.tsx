/**
 * WordPress Integration Sheet
 * 
 * Clean, card-based layout for managing WordPress connection and sync settings.
 * Now includes multi-step connection flow with intelligent endpoint discovery.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  RefreshCw01, 
  Check, 
  AlertCircle, 
  Trash01, 
  LinkExternal01, 
  Settings02,
  ChevronDown,
  Edit02,
  XClose,
  Database01,
  SearchRefraction,
} from '@untitledui/icons';
import { DataExtractionIcon, LightningBoltFilled } from '@/components/icons/WordPressIcons';
import { useWordPressConnection, type ConnectionStep } from '@/hooks/useWordPressConnection';
import { useWordPressHomes } from '@/hooks/useWordPressHomes';
import { WordPressEndpointMapper } from './WordPressEndpointMapper';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

interface DiscoveredEndpoint {
  slug: string;
  name: string;
  rest_base: string;
  classification?: 'community' | 'home' | 'unknown';
  confidence?: number;
  signals?: string[];
  postCount?: number;
}

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

function getConfidenceLabel(confidence: number): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (confidence >= 0.7) return { label: 'High', variant: 'default' };
  if (confidence >= 0.4) return { label: 'Medium', variant: 'secondary' };
  return { label: 'Low', variant: 'outline' };
}

interface DiscoveredEndpointItemProps {
  endpoint: DiscoveredEndpoint;
  onApply: () => void;
}

function DiscoveredEndpointItem({ endpoint, onApply }: DiscoveredEndpointItemProps) {
  const confidence = getConfidenceLabel(endpoint.confidence || 0);
  
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <code className="font-mono text-foreground truncate">{endpoint.rest_base}</code>
        {endpoint.postCount != null && endpoint.postCount > 0 && (
          <span className="text-muted-foreground shrink-0">({endpoint.postCount})</span>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={confidence.variant} size="sm" className="shrink-0 cursor-help">
                {confidence.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs font-medium mb-1">Classification signals:</p>
              <ul className="text-2xs text-muted-foreground space-y-0.5">
                {endpoint.signals?.map((signal, i) => (
                  <li key={i}>• {signal}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onApply}
        className="h-6 text-xs px-2 shrink-0"
      >
        Apply
      </Button>
    </div>
  );
}

interface UnclassifiedEndpointItemProps {
  endpoint: DiscoveredEndpoint;
  onApplyAsCommunity: () => void;
  onApplyAsHome: () => void;
}

function UnclassifiedEndpointItem({ endpoint, onApplyAsCommunity, onApplyAsHome }: UnclassifiedEndpointItemProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <code className="font-mono text-foreground truncate">{endpoint.rest_base}</code>
        {endpoint.postCount != null && endpoint.postCount > 0 && (
          <span className="text-muted-foreground shrink-0">({endpoint.postCount})</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onApplyAsCommunity}
          className="h-6 text-2xs px-1.5"
        >
          Community
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onApplyAsHome}
          className="h-6 text-2xs px-1.5"
        >
          Property
        </Button>
      </div>
    </div>
  );
}

export function WordPressIntegrationSheet({ 
  agent, 
  onSyncComplete, 
  open, 
  onOpenChange 
}: WordPressIntegrationSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [extractionMode, setExtractionMode] = useState<'standard' | 'ai'>('standard');
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [deleteLocationsOnDisconnect, setDeleteLocationsOnDisconnect] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Local state for endpoint inputs (for auto-save debouncing)
  const [localCommunityEndpoint, setLocalCommunityEndpoint] = useState('');
  const [localHomeEndpoint, setLocalHomeEndpoint] = useState('');
  
  // Selected endpoints during mapping step
  const [selectedCommunityEndpoint, setSelectedCommunityEndpoint] = useState<string | null>(null);
  const [selectedPropertyEndpoint, setSelectedPropertyEndpoint] = useState<string | null>(null);

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
    connectionStep,
    testConnection,
    importCommunities,
    updateSyncInterval,
    updateEndpoint,
    disconnect,
    discoverEndpoints,
    connectWithDiscovery,
    saveEndpointMappings,
    resetConnectionFlow,
    setConnectionStep,
    clearTestResult,
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

  useEffect(() => {
    setLocalCommunityEndpoint(communityEndpoint || '');
  }, [communityEndpoint]);

  useEffect(() => {
    setLocalHomeEndpoint(homeEndpoint || '');
  }, [homeEndpoint]);

  // Auto-save handlers for endpoint inputs
  const { save: saveCommunityEndpoint } = useAutoSave({
    onSave: useCallback(async (value: string) => {
      await updateEndpoint('community', value);
    }, [updateEndpoint]),
    savingMessage: 'Saving endpoint...',
  });

  const { save: saveHomeEndpoint } = useAutoSave({
    onSave: useCallback(async (value: string) => {
      await updateEndpoint('home', value);
    }, [updateEndpoint]),
    savingMessage: 'Saving endpoint...',
  });

  const handleCommunityEndpointChange = (value: string) => {
    setLocalCommunityEndpoint(value);
    saveCommunityEndpoint(value);
  };

  const handleHomeEndpointChange = (value: string) => {
    setLocalHomeEndpoint(value);
    saveHomeEndpoint(value);
  };

  const handleConnect = async () => {
    if (!urlInput.trim()) return;
    
    clearTestResult();
    const result = await connectWithDiscovery(urlInput.trim());
    
    if (!result.success) {
      toast.error('Failed to discover endpoints', {
        description: result.error || 'Could not connect to WordPress site'
      });
    }
  };

  const handleConfirmMapping = async () => {
    // Use the pre-selected endpoints from discovery or user selection
    const communityEp = selectedCommunityEndpoint ?? 
      discoveredEndpoints?.communityEndpoints[0]?.rest_base ?? null;
    const propertyEp = selectedPropertyEndpoint ?? 
      discoveredEndpoints?.homeEndpoints[0]?.rest_base ?? null;
    
    const success = await saveEndpointMappings(communityEp, propertyEp);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelMapping = () => {
    resetConnectionFlow();
    setSelectedCommunityEndpoint(null);
    setSelectedPropertyEndpoint(null);
  };

  const handleDisconnect = async () => {
    await disconnect(deleteLocationsOnDisconnect);
    setShowDisconnectDialog(false);
    setDeleteLocationsOnDisconnect(false);
    setDeleteConfirmation('');
    setUrlInput('');
    resetConnectionFlow();
  };

  const handleSyncCommunities = (forceFullSync = false) => importCommunities(undefined, undefined, extractionMode === 'ai', forceFullSync);
  const handleSyncHomes = (forceFullSync = false) => syncHomes(undefined, extractionMode === 'ai', undefined, forceFullSync);

  const isLoading = connectionTesting || connectionSyncing || homesSyncing || isDiscovering || isSaving;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
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
                  {/* Step: Connected */}
                  {isConnected && !isEditing && connectionStep !== 'mapping' ? (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
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
                      </div>
                      
                      {/* Show current endpoint mappings */}
                      {(communityEndpoint || homeEndpoint) && (
                        <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
                          {communityEndpoint && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Communities:</span>
                              <code className="font-mono text-foreground">{communityEndpoint}</code>
                            </div>
                          )}
                          {homeEndpoint && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Properties:</span>
                              <code className="font-mono text-foreground">{homeEndpoint}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : connectionStep === 'discovering' ? (
                    /* Step: Discovering endpoints */
                    <motion.div
                      key="discovering"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <SearchRefraction size={16} className="text-primary animate-pulse" aria-hidden="true" />
                        <span className="text-sm font-medium">Discovering endpoints...</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scanning {urlInput} for available data types.
                      </p>
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-3/4" />
                      </div>
                    </motion.div>
                  ) : connectionStep === 'mapping' && discoveredEndpoints ? (
                    /* Step: Mapping endpoints */
                    <motion.div
                      key="mapping"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <WordPressEndpointMapper
                        discoveredEndpoints={discoveredEndpoints}
                        selectedCommunityEndpoint={selectedCommunityEndpoint}
                        selectedPropertyEndpoint={selectedPropertyEndpoint}
                        onCommunitySelect={setSelectedCommunityEndpoint}
                        onPropertySelect={setSelectedPropertyEndpoint}
                        onConfirm={handleConfirmMapping}
                        onCancel={handleCancelMapping}
                        isLoading={isSaving}
                      />
                    </motion.div>
                  ) : (
                    /* Step: URL entry */
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
                            disabled={isDiscovering}
                          />
                          <Button
                            onClick={handleConnect}
                            disabled={!urlInput.trim() || isDiscovering}
                            loading={isDiscovering}
                            size="sm"
                          >
                            {isDiscovering ? 'Connecting...' : isEditing ? 'Update' : 'Connect'}
                          </Button>
                          {isEditing && !isDiscovering && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setUrlInput(siteUrl || '');
                                resetConnectionFlow();
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {connectionTestResult && !connectionTestResult.success && (
                        <div className="flex items-start gap-2 text-sm text-destructive">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                          <span>{connectionTestResult.message}</span>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        We'll automatically detect available data endpoints on your WordPress site.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Sync sections - only when fully connected (not during mapping) */}
            {isConnected && !isEditing && connectionStep !== 'mapping' && connectionStep !== 'discovering' && (
              <>
                {/* Data Extraction Mode Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <DataExtractionIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">Data Extraction</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Choose how to extract data from your WordPress posts. This applies to both communities and properties.
                    </p>
                    
                    <RadioGroup 
                      value={extractionMode} 
                      onValueChange={(value) => setExtractionMode(value as 'standard' | 'ai')}
                      className="space-y-2"
                    >
                      <div 
                        className={`flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-colors ${
                          extractionMode === 'standard' 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setExtractionMode('standard')}
                      >
                        <RadioGroupItem value="standard" id="mode-standard" className="mt-0.5" />
                        <Label htmlFor="mode-standard" className="cursor-pointer flex-1">
                          <span className="font-medium text-sm flex items-center gap-2">
                            <Database01 size={14} className="text-muted-foreground" aria-hidden="true" />
                            Standard
                          </span>
                          <span className="text-xs text-muted-foreground block mt-1">
                            Reads ACF (Advanced Custom Fields) directly. Fast and reliable for most WordPress sites with standard field naming.
                          </span>
                        </Label>
                      </div>
                      
                      <div 
                        className={`flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-colors ${
                          extractionMode === 'ai' 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setExtractionMode('ai')}
                      >
                        <RadioGroupItem value="ai" id="mode-ai" className="mt-0.5" />
                        <Label htmlFor="mode-ai" className="cursor-pointer flex-1">
                          <span className="font-medium text-sm flex items-center gap-2">
                            <LightningBoltFilled size={14} className="text-warning" aria-hidden="true" />
                            AI-Powered
                            <Badge variant="outline" size="sm">Uses credits</Badge>
                          </span>
                          <span className="text-xs text-muted-foreground block mt-1">
                            Analyzes page content with AI. Use if your site has non-standard field names, data in HTML content, or custom themes.
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Communities Sync Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Communities</span>
                        {(communityCount ?? 0) > 0 && (
                          <Badge variant="secondary" size="sm">
                            {communityCount}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
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
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSyncCommunities(false)}>
                            Quick Sync
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSyncCommunities(true)}>
                            Full Resync
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                        <span className="text-sm font-medium">Property Listings</span>
                        {(homeCount ?? 0) > 0 && (
                          <Badge variant="secondary" size="sm">
                            {homeCount}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
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
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => syncHomes(undefined, extractionMode === 'ai')}>
                            Quick Sync
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => syncHomes(undefined, extractionMode === 'ai', undefined, true)}>
                            Full Resync
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                        <Settings02 size={14} aria-hidden="true" />
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
                              value={localCommunityEndpoint}
                              onChange={(e) => handleCommunityEndpointChange(e.target.value)}
                              placeholder="/wp-json/wp/v2/community"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Properties</Label>
                            <Input
                              value={localHomeEndpoint}
                              onChange={(e) => handleHomeEndpointChange(e.target.value)}
                              placeholder="/wp-json/wp/v2/home"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {discoveredEndpoints && (
                          <div className="text-xs space-y-3">
                            {/* Community Endpoints */}
                            {discoveredEndpoints.communityEndpoints?.length > 0 && (
                              <div className="bg-muted/50 rounded p-3 space-y-2">
                                <p className="font-medium text-muted-foreground">
                                  Communities
                                </p>
                                {discoveredEndpoints.communityEndpoints.map((ep) => (
                                  <DiscoveredEndpointItem
                                    key={ep.slug}
                                    endpoint={ep}
                                    onApply={() => {
                                      setLocalCommunityEndpoint(ep.rest_base);
                                      updateEndpoint('community', ep.rest_base);
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Home/Property Endpoints */}
                            {discoveredEndpoints.homeEndpoints?.length > 0 && (
                              <div className="bg-muted/50 rounded p-3 space-y-2">
                                <p className="font-medium text-muted-foreground">
                                  Properties
                                </p>
                                {discoveredEndpoints.homeEndpoints.map((ep) => (
                                  <DiscoveredEndpointItem
                                    key={ep.slug}
                                    endpoint={ep}
                                    onApply={() => {
                                      setLocalHomeEndpoint(ep.rest_base);
                                      updateEndpoint('home', ep.rest_base);
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Unclassified Endpoints */}
                            {(discoveredEndpoints.unclassifiedEndpoints?.length ?? 0) > 0 && (
                              <div className="bg-muted/30 rounded p-3 space-y-2">
                                <p className="font-medium text-muted-foreground flex items-center gap-2">
                                  <AlertCircle size={12} aria-hidden="true" />
                                  Other Post Types
                                </p>
                                <p className="text-muted-foreground text-2xs mb-2">
                                  Couldn't auto-classify these. Use as community or property if applicable.
                                </p>
                                {(discoveredEndpoints.unclassifiedEndpoints ?? []).map((ep) => (
                                  <UnclassifiedEndpointItem
                                    key={ep.slug}
                                    endpoint={ep}
                                    onApplyAsCommunity={() => {
                                      setLocalCommunityEndpoint(ep.rest_base);
                                      updateEndpoint('community', ep.rest_base);
                                    }}
                                    onApplyAsHome={() => {
                                      setLocalHomeEndpoint(ep.rest_base);
                                      updateEndpoint('home', ep.rest_base);
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* No endpoints found */}
                            {!discoveredEndpoints.communityEndpoints?.length && 
                             !discoveredEndpoints.homeEndpoints?.length && 
                             !discoveredEndpoints.unclassifiedEndpoints?.length && (
                              <div className="bg-muted/30 rounded p-3 text-center text-muted-foreground">
                                No custom post types found
                              </div>
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
            <div className="flex items-start gap-3 p-3 rounded-card border border-destructive/20 bg-destructive/5">
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
