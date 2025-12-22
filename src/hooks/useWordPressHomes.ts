/**
 * useWordPressHomes Hook
 * 
 * Manages WordPress home/property synchronization.
 * 
 * @module hooks/useWordPressHomes
 */

import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { Tables } from '@/integrations/supabase/types';

interface WordPressConfig {
  site_url?: string;
  home_endpoint?: string;
  last_home_sync?: string;
  home_count?: number;
  last_community_sync?: string;
  community_count?: number;
}

interface TestResult {
  success: boolean;
  message: string;
  homeCount?: number;
  detectedEndpoint?: string;
}

interface SyncResult {
  success: boolean;
  created?: number;
  updated?: number;
  deleted?: number;
  total?: number;
  errors?: string[];
}

interface UseWordPressHomesOptions {
  agent: Tables<'agents'> | null;
  onSyncComplete?: () => void;
}

export function useWordPressHomes({ agent, onSyncComplete }: UseWordPressHomesOptions) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const wordpressConfig = useMemo<WordPressConfig | null>(() => {
    if (!agent?.deployment_config) return null;
    const config = agent.deployment_config as Record<string, unknown>;
    return (config.wordpress as WordPressConfig) || null;
  }, [agent?.deployment_config]);

  const siteUrl = wordpressConfig?.site_url || '';
  const homeEndpoint = wordpressConfig?.home_endpoint || '';
  const lastSync = wordpressConfig?.last_home_sync || null;
  const homeCount = wordpressConfig?.home_count;
  const isConnected = Boolean(siteUrl);

  const testHomesEndpoint = useCallback(async (url: string, endpoint?: string): Promise<TestResult> => {
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

      const { data, error } = await supabase.functions.invoke('sync-wordpress-homes', {
        body: {
          action: 'test',
          agentId: agent.id,
          siteUrl: url,
          homeEndpoint: endpoint || homeEndpoint || undefined,
        },
      });

      if (error) throw error;

      const result: TestResult = {
        success: data.success,
        message: data.message || (data.success ? 'Homes endpoint found!' : 'No homes endpoint found'),
        homeCount: data.homeCount,
        detectedEndpoint: data.detectedEndpoint,
      };

      setTestResult(result);
      return result;
    } catch (error) {
      logger.error('Error testing WordPress homes endpoint', error);
      const result: TestResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test connection',
      };
      setTestResult(result);
      return result;
    } finally {
      setIsTesting(false);
    }
  }, [agent?.id, homeEndpoint]);

  const syncHomes = useCallback(async (url?: string, useAiExtraction?: boolean, endpoint?: string): Promise<SyncResult> => {
    if (!agent?.id) {
      return { success: false, errors: ['No agent selected'] };
    }

    const syncUrl = url || siteUrl;
    if (!syncUrl) {
      return { success: false, errors: ['No WordPress site URL configured'] };
    }

    setIsSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('sync-wordpress-homes', {
        body: {
          action: 'sync',
          agentId: agent.id,
          siteUrl: syncUrl,
          homeEndpoint: endpoint || homeEndpoint || undefined,
          useAiExtraction: useAiExtraction ?? false,
        },
      });

      if (error) throw error;

      if (data.success) {
        const parts = [];
        if (data.created > 0) parts.push(`${data.created} new`);
        if (data.updated > 0) parts.push(`${data.updated} updated`);
        if (data.deleted > 0) parts.push(`${data.deleted} removed`);
        
        toast.success('Homes synchronized', { 
          description: parts.length > 0 ? parts.join(', ') : 'No changes' 
        });
        onSyncComplete?.();
      } else {
        toast.error('Sync failed', { description: data.error || 'Unknown error' });
      }

      return {
        success: data.success,
        created: data.created,
        updated: data.updated,
        deleted: data.deleted,
        total: data.total,
        errors: data.errors,
      };
    } catch (error) {
      logger.error('Error syncing WordPress homes', error);
      const message = error instanceof Error ? error.message : 'Failed to sync homes';
      toast.error('Sync failed', { description: message });
      return { success: false, errors: [message] };
    } finally {
      setIsSyncing(false);
    }
  }, [agent?.id, siteUrl, homeEndpoint, onSyncComplete]);

  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  return {
    siteUrl,
    homeEndpoint,
    lastSync,
    homeCount,
    isConnected,
    isTesting,
    isSyncing,
    testResult,
    testHomesEndpoint,
    syncHomes,
    clearTestResult,
  };
}
