/**
 * useWordPressConnection Hook
 * 
 * Manages WordPress site connection for community imports.
 * Handles testing connections, saving config, and triggering syncs.
 * 
 * @module hooks/useWordPressConnection
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressConfig {
  site_url: string;
  last_community_sync?: string;
  community_count?: number;
}

interface TestResult {
  success: boolean;
  message: string;
  communityCount?: number;
}

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

  // Extract WordPress config from agent
  const wordpressConfig = useMemo((): WordPressConfig | null => {
    if (!agent?.deployment_config) return null;
    const config = agent.deployment_config as Record<string, unknown>;
    return (config.wordpress as WordPressConfig) || null;
  }, [agent?.deployment_config]);

  const siteUrl = wordpressConfig?.site_url || '';
  const lastSync = wordpressConfig?.last_community_sync;
  const communityCount = wordpressConfig?.community_count;

  // Test WordPress connection
  const testConnection = useCallback(async (url: string): Promise<TestResult> => {
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
        },
      });

      if (error) throw error;

      const result: TestResult = {
        success: data.success,
        message: data.message,
        communityCount: data.communityCount,
      };

      setTestResult(result);
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
  }, [agent?.id]);

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
          description: `${result.created} created, ${result.updated} updated`,
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

  return {
    // State
    siteUrl,
    lastSync,
    communityCount,
    isTesting,
    isSyncing,
    isSaving,
    testResult,
    isConnected: !!siteUrl,

    // Actions
    testConnection,
    saveConfig,
    importCommunities,
    clearTestResult: () => setTestResult(null),
  };
}
