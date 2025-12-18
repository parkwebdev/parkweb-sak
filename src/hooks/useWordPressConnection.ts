/**
 * useWordPressConnection Hook
 * 
 * Manages WordPress site connection for community imports.
 * Handles testing connections, saving config, and triggering syncs.
 * 
 * @module hooks/useWordPressConnection
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressConfig {
  site_url: string;
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

type SyncInterval = 'manual' | 'hourly_1' | 'hourly_2' | 'hourly_4' | 'hourly_6' | 'hourly_12' | 'daily';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
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
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // Local state for optimistic UI updates
  const [localCommunitySyncInterval, setLocalCommunitySyncInterval] = useState<string | null>(null);
  const [localHomeSyncInterval, setLocalHomeSyncInterval] = useState<string | null>(null);

  // Extract WordPress config from agent
  const wordpressConfig = useMemo((): WordPressConfig | null => {
    if (!agent?.deployment_config) return null;
    const config = agent.deployment_config as Record<string, unknown>;
    return (config.wordpress as WordPressConfig) || null;
  }, [agent?.deployment_config]);

  // Reset local state when agent config changes (refetched data takes over)
  useEffect(() => {
    setLocalCommunitySyncInterval(null);
    setLocalHomeSyncInterval(null);
  }, [wordpressConfig?.community_sync_interval, wordpressConfig?.home_sync_interval]);

  const siteUrl = wordpressConfig?.site_url || '';
  const lastSync = wordpressConfig?.last_community_sync;
  const communityCount = wordpressConfig?.community_count;
  // Use local state for immediate feedback, fallback to config value
  const communitySyncInterval = localCommunitySyncInterval ?? wordpressConfig?.community_sync_interval ?? 'manual';
  const homeSyncInterval = localHomeSyncInterval ?? wordpressConfig?.home_sync_interval ?? 'manual';

  // Save URL immediately (without testing) - persists URL even if connection fails
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
        console.error('Failed to save WordPress URL:', error);
        return false;
      }

      console.log('WordPress URL saved');
      onSyncComplete?.();
      return true;
    } catch (error) {
      console.error('Failed to save WordPress URL:', error);
      return false;
    }
  }, [agent?.id, onSyncComplete]);

  // Test WordPress connection (URL is saved first, then tested)
  const testConnection = useCallback(async (url: string): Promise<TestResult> => {
    if (!agent?.id) {
      return { success: false, message: 'No agent selected' };
    }

    // Save URL FIRST so it persists even if test fails
    await saveUrl(url);

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
        },
      });

      if (error) throw error;

      const result: TestResult = {
        success: data.success,
        message: data.message,
        communityCount: data.communityCount,
      };

      setTestResult(result);
      
      if (result.success) {
        toast.success('WordPress site connected');
      }
      
      return result;
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: getErrorMessage(error),
      };
      setTestResult(result);
      return result;
    } finally {
      setIsTesting(false);
    }
  }, [agent?.id, saveUrl]);

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
    } catch (error) {
      toast.error('Failed to save configuration', {
        description: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [agent?.id]);

  // Import communities from WordPress
  const importCommunities = useCallback(async (url?: string): Promise<SyncResult | null> => {
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
        },
      });

      if (error) throw error;

      const result: SyncResult = {
        success: data.success,
        created: data.created,
        updated: data.updated,
        skipped: data.skipped,
        total: data.total,
        errors: data.errors,
      };

      if (result.success) {
        toast.success('Communities imported', {
          description: `${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
        });
        onSyncComplete?.();
      } else {
        toast.error('Import failed', {
          description: result.errors?.[0] || 'Unknown error',
        });
      }

      return result;
    } catch (error) {
      toast.error('Failed to import communities', {
        description: getErrorMessage(error),
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [agent?.id, onSyncComplete]);

  // Update sync interval settings
  const updateSyncInterval = useCallback(async (
    type: 'community' | 'home',
    interval: string
  ): Promise<boolean> => {
    if (!agent?.id) return false;

    // Set local state immediately for optimistic UI
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
      
      // Refresh agent data to sync with database
      onSyncComplete?.();
      return true;
    } catch (error) {
      // Revert local state on error
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

  // Disconnect WordPress integration
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
        description: deleteLocations ? 'All synced locations have been removed' : 'Configuration cleared',
      });
      onSyncComplete?.();
      return true;
    } catch (error) {
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
    isTesting,
    isSyncing,
    isSaving,
    testResult,
    isConnected: !!siteUrl,

    // Actions
    testConnection,
    saveUrl,
    saveConfig,
    importCommunities,
    updateSyncInterval,
    disconnect,
    clearTestResult: () => setTestResult(null),
  };
}
