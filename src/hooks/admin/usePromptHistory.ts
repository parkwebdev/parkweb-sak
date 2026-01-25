/**
 * Hook for fetching prompt version history
 * 
 * @module hooks/admin/usePromptHistory
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';

export interface PromptHistoryEntry {
  id: string;
  configKey: string;
  value: unknown;
  version: number;
  createdAt: string;
  createdBy: string | null;
  changeSummary: string | null;
}

interface UsePromptHistoryOptions {
  configKey: string;
  enabled?: boolean;
}

export function usePromptHistory({ configKey, enabled = true }: UsePromptHistoryOptions) {
  return useQuery({
    queryKey: adminQueryKeys.config.history(configKey),
    queryFn: async (): Promise<PromptHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('platform_config_history')
        .select('id, config_key, value, version, created_at, created_by, change_summary')
        .eq('config_key', configKey)
        .order('version', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        configKey: row.config_key,
        value: row.value,
        version: row.version,
        createdAt: row.created_at,
        createdBy: row.created_by,
        changeSummary: row.change_summary,
      }));
    },
    enabled,
    staleTime: 30000,
  });
}
