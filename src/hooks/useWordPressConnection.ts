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

interface WordPressConfig {
  site_url: string;
  community_endpoint?: string;
  home_endpoint?: string;
  last_community_sync?: string;
  community_count?: number;
  community_sync_interval?: string;
  home_sync_interval?: string;
  last_home_sync?: string;
  home_count?: number;
}

interface TestResult {
  success: boolean;
  message: string;
  communityCount?: number;
}

interface DiscoveredEndpoints {
  communityEndpoints: Array<{ slug: string; name: string; rest_base: string }>;
  homeEndpoints: Array<{ slug: string; name: string; rest_base: string }>;
}

type SyncInterval = 'manual' | 'hourly_1' | 'hourly_2' | 'hourly_3' | 'hourly_4' | 'hourly_6' | 'hourly_8' | 'hourly_12' | 'daily';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  total: number;
  errors?: string[];
}

interface UseWordPressConnectionOptions {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

export function useWordPressConnection({ agent, onSyncComplete }: UseWordPressConnectionOptions) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<DiscoveredEndpoints | null>(null);
  
  // Local state for optimistic UI updates
  const [localCommunitySyncInterval, setLocalCommunitySyncInterval] = useState<string | null>(null);
  const [localHomeSyncInterval, setLocalHomeSyncInterval] = useState<string | null>(null);
  const [localCommunityEndpoint, setLocalCommunityEndpoint] = useState<string | null>(null);
  const [localHomeEndpoint, setLocalHomeEndpoint] = useState<string | null>(null);

  // Extract WordPress config from agent
  const wordpressConfig = useMemo((): WordPressConfig | null => {
    if (!agent?.deployment_config) return null;
    const config = agent.deployment_config as AgentDeploymentConfig & { wordpress?: WordPressConfig };
    return config.wordpress || null;
  }, [agent?.deployment_config]);

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
  const importCommunities = useCallback(async (url?: string, endpoint?: string): Promise<SyncResult | null> => {
    if (!agent?.id) return null;

    setIsSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
        body: {
          action: 'sync',
          agentId: agent.id,
          siteUrl: url,
          communityEndpoint: endpoint || communityEndpoint || undefined,
        },
      });

      if (error) throw error;

      const result: SyncResult = {
        success: data.success,
        created: data.created,
        updated: data.updated,
        deleted: data.deleted || 0,
        total: data.total,
        errors: data.errors,
      };

      if (result.success) {
        const parts = [];
        if (result.created > 0) parts.push(`${result.created} created`);
        if (result.updated > 0) parts.push(`${result.updated} updated`);
        if (result.deleted > 0) parts.push(`${result.deleted} removed`);
        
        toast.success('Communities imported', {
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
    testResult,
    discoveredEndpoints,
    isConnected: !!siteUrl,

    // Actions
    testConnection,
    saveUrl,
    saveConfig,
    importCommunities,
    updateSyncInterval,
    updateEndpoint,
    discoverEndpoints,
    disconnect,
    clearTestResult: () => setTestResult(null),
    clearDiscoveredEndpoints: () => setDiscoveredEndpoints(null),
  };
}
