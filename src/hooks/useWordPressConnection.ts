/**
 * useWordPressConnection Hook
 * 
 * Manages WordPress site connection for community imports.
 * Handles testing connections, saving config, endpoint discovery, and triggering syncs.
 * 
 * @module hooks/useWordPressConnection
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';
import type { SamplePostResult, WordPressConfig } from '@/types/wordpress';

interface TestResult {
  success: boolean;
  message: string;
  communityCount?: number;
}

export interface DiscoveredEndpoint {
  slug: string;
  name: string;
  rest_base: string;
  classification?: 'community' | 'home' | 'unknown';
  confidence?: number;
  signals?: string[];
  postCount?: number;
}

export interface DiscoveredEndpoints {
  communityEndpoints: DiscoveredEndpoint[];
  homeEndpoints: DiscoveredEndpoint[];
  unclassifiedEndpoints?: DiscoveredEndpoint[];
}

type SyncInterval = 'manual' | 'hourly_1' | 'hourly_2' | 'hourly_3' | 'hourly_4' | 'hourly_6' | 'hourly_8' | 'hourly_12' | 'daily';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  total: number;
  sync_type?: 'full' | 'incremental';
  errors?: string[];
}

interface UseWordPressConnectionOptions {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

/** Connection flow steps */
export type ConnectionStep = 'url' | 'discovering' | 'mapping' | 'field-mapping' | 'connected';

/** Sample post data for field mapping */
interface SamplePostData {
  community: SamplePostResult | null;
  property: SamplePostResult | null;
}

export function useWordPressConnection({ agent, onSyncComplete }: UseWordPressConnectionOptions) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isFetchingSample, setIsFetchingSample] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<DiscoveredEndpoints | null>(null);
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('url');
  const [connectedUrl, setConnectedUrl] = useState<string>('');  // Track URL locally to avoid race condition
  
  // Sample post data for field mapping
  const [samplePostData, setSamplePostData] = useState<SamplePostData>({ community: null, property: null });
  
  // User's field mapping selections
  const [communityFieldMappings, setCommunityFieldMappings] = useState<Record<string, string>>({});
  const [propertyFieldMappings, setPropertyFieldMappings] = useState<Record<string, string>>({});
  
  // Local state for optimistic UI updates
  const [localCommunitySyncInterval, setLocalCommunitySyncInterval] = useState<string | null>(null);
  const [localHomeSyncInterval, setLocalHomeSyncInterval] = useState<string | null>(null);
  const [localCommunityEndpoint, setLocalCommunityEndpoint] = useState<string | null>(null);
  const [localHomeEndpoint, setLocalHomeEndpoint] = useState<string | null>(null);

  // Extract WordPress config from agent
  const wordpressConfig = useMemo((): WordPressConfig | null => {
    if (!agent?.deployment_config) return null;
    const config = agent.deployment_config as AgentDeploymentConfig & { wordpress?: WordPressConfig };
    return config.wordpress ?? null;
  }, [agent?.deployment_config]);
  
  // Stored site URL for API calls
  const storedSiteUrl = wordpressConfig?.site_url || '';

  // Reset local state when agent config changes
  useEffect(() => {
    setLocalCommunitySyncInterval(null);
    setLocalHomeSyncInterval(null);
    setLocalCommunityEndpoint(null);
    setLocalHomeEndpoint(null);
  }, [wordpressConfig?.community_sync_interval, wordpressConfig?.home_sync_interval, wordpressConfig?.community_endpoint, wordpressConfig?.home_endpoint]);

  const siteUrl = wordpressConfig?.site_url || '';
  const lastSync = wordpressConfig?.last_community_sync;
  const communityCount = wordpressConfig?.community_count;
  const communitySyncInterval = localCommunitySyncInterval ?? wordpressConfig?.community_sync_interval ?? 'manual';
  const homeSyncInterval = localHomeSyncInterval ?? wordpressConfig?.home_sync_interval ?? 'manual';
  const communityEndpoint = localCommunityEndpoint ?? wordpressConfig?.community_endpoint ?? '';
  const homeEndpoint = localHomeEndpoint ?? wordpressConfig?.home_endpoint ?? '';

  // Discover available endpoints from WordPress
  const discoverEndpoints = useCallback(async (url: string): Promise<DiscoveredEndpoints | null> => {
    if (!agent?.id || !url.trim()) return null;

    setIsDiscovering(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'discover',
          agentId: agent.id,
          siteUrl: url.trim(),
        },
      });

      if (error) throw error;

      if (data.success) {
        const endpoints: DiscoveredEndpoints = {
          communityEndpoints: data.communityEndpoints || [],
          homeEndpoints: data.homeEndpoints || [],
        };
        setDiscoveredEndpoints(endpoints);
        return endpoints;
      }
      
      return null;
    } catch (error: unknown) {
      logger.error('Failed to discover endpoints', error);
      return null;
    } finally {
      setIsDiscovering(false);
    }
  }, [agent?.id]);

  // Save URL immediately without testing
  const saveUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!agent?.id || !url.trim()) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'save',
          agentId: agent.id,
          siteUrl: url.trim(),
        },
      });

      if (error) {
        logger.error('Failed to save WordPress URL', error);
        return false;
      }

      logger.info('WordPress URL saved');
      onSyncComplete?.();
      return true;
    } catch (error: unknown) {
      logger.error('Failed to save WordPress URL', error);
      return false;
    }
  }, [agent?.id, onSyncComplete]);

  // Test WordPress connection - only saves URL if test succeeds
  const testConnection = useCallback(async (url: string, endpoint?: string): Promise<TestResult> => {
    if (!agent?.id) {
      return { success: false, message: 'No agent selected' };
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'test',
          agentId: agent.id,
          siteUrl: url,
          communityEndpoint: endpoint || communityEndpoint || undefined,
        },
      });

      if (error) throw error;

      const result: TestResult = {
        success: data.success,
        message: data.message,
        communityCount: data.communityCount,
      };

      setTestResult(result);
      
      // Only save URL after successful test
      if (result.success) {
        await saveUrl(url);
        toast.success('WordPress site connected');
      }
      
      return result;
    } catch (error: unknown) {
      const result: TestResult = {
        success: false,
        message: getErrorMessage(error),
      };
      setTestResult(result);
      return result;
    } finally {
      setIsTesting(false);
    }
  }, [agent?.id, saveUrl, communityEndpoint]);

  // Save WordPress config without syncing
  const saveConfig = useCallback(async (url: string): Promise<boolean> => {
    if (!agent?.id) return false;

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'save',
          agentId: agent.id,
          siteUrl: url,
        },
      });

      if (error) throw error;

      toast.success('WordPress configuration saved');
      return true;
    } catch (error: unknown) {
      toast.error('Failed to save configuration', {
        description: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [agent?.id]);

  // Import communities from WordPress
  const importCommunities = useCallback(async (url?: string, endpoint?: string, useAiExtraction?: boolean, forceFullSync?: boolean): Promise<SyncResult | null> => {
    if (!agent?.id) return null;

    setIsSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'sync',
          agentId: agent.id,
          siteUrl: url,
          communityEndpoint: endpoint || communityEndpoint || undefined,
          useAiExtraction: useAiExtraction ?? false,
          forceFullSync: forceFullSync ?? false,
        },
      });

      if (error) throw error;

      const result: SyncResult = {
        success: data.success,
        created: data.created,
        updated: data.updated,
        deleted: data.deleted || 0,
        unchanged: data.unchanged || 0,
        total: data.total,
        sync_type: data.sync_type,
        errors: data.errors,
      };

      if (result.success) {
        const parts: string[] = [];
        if (result.created > 0) parts.push(`${result.created} new`);
        if (result.updated > 0) parts.push(`${result.updated} updated`);
        if (result.unchanged > 0) parts.push(`${result.unchanged} unchanged`);
        if (result.deleted > 0) parts.push(`${result.deleted} removed`);
        
        toast.success('Communities synced', {
          description: parts.length > 0 ? parts.join(', ') : 'No changes',
        });
        onSyncComplete?.();
      } else {
        toast.error('Import failed', {
          description: result.errors?.[0] || 'Unknown error',
        });
      }

      return result;
    } catch (error: unknown) {
      toast.error('Failed to import communities', {
        description: getErrorMessage(error),
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [agent?.id, onSyncComplete, communityEndpoint]);

  // Update endpoint configuration
  const updateEndpoint = useCallback(async (
    type: 'community' | 'home',
    endpoint: string
  ): Promise<boolean> => {
    if (!agent?.id) return false;

    // Optimistic update
    if (type === 'community') {
      setLocalCommunityEndpoint(endpoint);
    } else {
      setLocalHomeEndpoint(endpoint);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const body: Record<string, unknown> = {
        action: 'save',
        agentId: agent.id,
      };

      if (type === 'community') {
        body.communityEndpoint = endpoint;
      } else {
        body.homeEndpoint = endpoint;
      }

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });

      if (error) throw error;
      
      onSyncComplete?.();
      return true;
    } catch (error: unknown) {
      // Revert on error
      if (type === 'community') {
        setLocalCommunityEndpoint(null);
      } else {
        setLocalHomeEndpoint(null);
      }
      toast.error('Failed to update endpoint', {
        description: getErrorMessage(error),
      });
      return false;
    }
  }, [agent?.id, onSyncComplete]);

  // Update sync interval settings
  const updateSyncInterval = useCallback(async (
    type: 'community' | 'home',
    interval: string
  ): Promise<boolean> => {
    if (!agent?.id) return false;

    // Optimistic update
    if (type === 'community') {
      setLocalCommunitySyncInterval(interval);
    } else {
      setLocalHomeSyncInterval(interval);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const body: Record<string, unknown> = {
        action: 'save',
        agentId: agent.id,
      };

      if (type === 'community') {
        body.communitySyncInterval = interval;
      } else {
        body.homeSyncInterval = interval;
      }

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });

      if (error) throw error;
      
      onSyncComplete?.();
      return true;
    } catch (error: unknown) {
      // Revert on error
      if (type === 'community') {
        setLocalCommunitySyncInterval(null);
      } else {
        setLocalHomeSyncInterval(null);
      }
      toast.error('Failed to update sync settings', {
        description: getErrorMessage(error),
      });
      return false;
    }
  }, [agent?.id, onSyncComplete]);

  // Disconnect WordPress integration (hard delete)
  const disconnect = useCallback(async (deleteLocations: boolean = false): Promise<boolean> => {
    if (!agent?.id) return false;

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'disconnect',
          agentId: agent.id,
          deleteLocations,
        },
      });

      if (error) throw error;

      toast.success('WordPress disconnected', {
        description: deleteLocations ? 'All synced locations have been deleted' : 'Configuration cleared',
      });
      setConnectedUrl('');  // Clear local URL on disconnect
      onSyncComplete?.();
      return true;
    } catch (error: unknown) {
      toast.error('Failed to disconnect', {
        description: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [agent?.id, onSyncComplete]);

  /**
   * Connect to WordPress with auto-discovery flow.
   * Saves URL and discovers endpoints in one step.
   */
  const connectWithDiscovery = useCallback(async (url: string): Promise<{
    success: boolean;
    endpoints: DiscoveredEndpoints | null;
    error?: string;
  }> => {
    if (!agent?.id || !url.trim()) {
      return { success: false, endpoints: null, error: 'No agent or URL provided' };
    }

    setConnectionStep('discovering');
    setIsDiscovering(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Use the new 'connect' action that combines URL validation + discovery
      const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'connect',
          agentId: agent.id,
          siteUrl: url.trim(),
        },
      });

      if (error) throw error;

      if (data.success) {
        const endpoints: DiscoveredEndpoints = {
          communityEndpoints: data.communityEndpoints || [],
          homeEndpoints: data.homeEndpoints || [],
          unclassifiedEndpoints: data.unclassifiedEndpoints || [],
        };
        setDiscoveredEndpoints(endpoints);
        setConnectedUrl(url.trim());  // Store URL locally for field mapping
        setConnectionStep('mapping');
        return { success: true, endpoints };
      }

      setConnectionStep('url');
      return { success: false, endpoints: null, error: data.message || 'Connection failed' };
    } catch (error: unknown) {
      logger.error('Failed to connect with discovery', error);
      setConnectionStep('url');
      return { success: false, endpoints: null, error: getErrorMessage(error) };
    } finally {
      setIsDiscovering(false);
    }
  }, [agent?.id]);

  /**
   * Fetch sample post from an endpoint for field mapping.
   */
  const fetchSamplePost = useCallback(async (
    endpoint: string,
    type: 'community' | 'property'
  ): Promise<SamplePostResult | null> => {
    // Use local connectedUrl first (set during connection flow), fallback to stored
    const siteUrlToUse = connectedUrl || storedSiteUrl;
    if (!agent?.id || !siteUrlToUse) return null;

    setIsFetchingSample(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: 'fetch-sample',
          agentId: agent.id,
          siteUrl: siteUrlToUse,
          endpoint,
          type,
        },
      });

      if (error) throw error;
      return data as SamplePostResult;
    } catch (error: unknown) {
      logger.error('Failed to fetch sample post', error);
      return null;
    } finally {
      setIsFetchingSample(false);
    }
  }, [agent?.id, storedSiteUrl, connectedUrl]);

  /**
   * Save endpoint mappings and transition to field mapping step.
   */
  const saveEndpointMappings = useCallback(async (
    communityEndpoint: string | null,
    homeEndpoint: string | null
  ): Promise<boolean> => {
    if (!agent?.id) return false;

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Save endpoint selection first
      const body: Record<string, unknown> = {
        action: 'save',
        agentId: agent.id,
      };

      if (communityEndpoint !== null) {
        body.communityEndpoint = communityEndpoint;
      }
      if (homeEndpoint !== null) {
        body.homeEndpoint = homeEndpoint;
      }

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });

      if (error) throw error;

      // Fetch sample posts for field mapping
      const [communitySample, propertySample] = await Promise.all([
        communityEndpoint ? fetchSamplePost(communityEndpoint, 'community') : Promise.resolve(null),
        homeEndpoint ? fetchSamplePost(homeEndpoint, 'property') : Promise.resolve(null),
      ]);

      setSamplePostData({
        community: communitySample,
        property: propertySample,
      });

      // Pre-populate field mappings with suggestions
      if (communitySample?.suggestedMappings) {
        setCommunityFieldMappings(communitySample.suggestedMappings);
      }
      if (propertySample?.suggestedMappings) {
        setPropertyFieldMappings(propertySample.suggestedMappings);
      }

      // If we have sample data, go to field mapping; otherwise complete
      if (communitySample || propertySample) {
        setConnectionStep('field-mapping');
      } else {
        setConnectionStep('connected');
        toast.success('WordPress connected', {
          description: 'Endpoints mapped successfully. You can now sync data.',
        });
      }
      
      onSyncComplete?.();
      return true;
    } catch (error: unknown) {
      toast.error('Failed to save endpoint mappings', {
        description: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [agent?.id, onSyncComplete, fetchSamplePost]);

  /**
   * Save field mappings and complete connection.
   */
  const saveFieldMappings = useCallback(async (
    communityMappings: Record<string, string>,
    propertyMappings: Record<string, string>
  ): Promise<boolean> => {
    if (!agent?.id) return false;

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const body: Record<string, unknown> = {
        action: 'save',
        agentId: agent.id,
        communityFieldMappings: communityMappings,
        propertyFieldMappings: propertyMappings,
      };

      const { error } = await supabase.functions.invoke('sync-wordpress-communities', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });

      if (error) throw error;

      setConnectionStep('connected');
      toast.success('WordPress connected', {
        description: 'Field mappings saved. You can now sync data.',
      });
      onSyncComplete?.();
      return true;
    } catch (error: unknown) {
      toast.error('Failed to save field mappings', {
        description: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [agent?.id, onSyncComplete]);

  /**
   * Skip field mapping and complete connection.
   */
  const skipFieldMapping = useCallback(() => {
    setConnectionStep('connected');
    toast.success('WordPress connected', {
      description: 'Using auto-detection for field mapping.',
    });
  }, []);

  /**
   * Reset connection flow to URL entry step.
   */
  const resetConnectionFlow = useCallback(() => {
    setConnectionStep('url');
    setDiscoveredEndpoints(null);
    setTestResult(null);
    setSamplePostData({ community: null, property: null });
    setCommunityFieldMappings({});
    setPropertyFieldMappings({});
    setConnectedUrl('');  // Clear local URL on reset
  }, []);

  return {
    // State
    siteUrl,
    lastSync,
    communityCount,
    communitySyncInterval,
    homeSyncInterval,
    communityEndpoint,
    homeEndpoint,
    isTesting,
    isSyncing,
    isSaving,
    isDiscovering,
    isFetchingSample,
    testResult,
    discoveredEndpoints,
    isConnected: !!siteUrl,
    connectionStep,
    samplePostData,
    communityFieldMappings,
    propertyFieldMappings,

    // Actions
    testConnection,
    saveUrl,
    saveConfig,
    importCommunities,
    updateSyncInterval,
    updateEndpoint,
    discoverEndpoints,
    disconnect,
    connectWithDiscovery,
    saveEndpointMappings,
    saveFieldMappings,
    skipFieldMapping,
    fetchSamplePost,
    setCommunityFieldMappings,
    setPropertyFieldMappings,
    resetConnectionFlow,
    setConnectionStep,
    clearTestResult: () => setTestResult(null),
    clearDiscoveredEndpoints: () => setDiscoveredEndpoints(null),
  };
}
