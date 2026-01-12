/**
 * Hook for managing platform configuration
 * 
 * @module hooks/admin/usePlatformConfig
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { PlatformConfig } from '@/types/admin';

interface UsePlatformConfigResult {
  config: PlatformConfig | null;
  loading: boolean;
  error: Error | null;
  updateConfig: (updates: Partial<{ value: unknown }>) => Promise<void>;
  isUpdating: boolean;
}

export function usePlatformConfig(key: string): UsePlatformConfigResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.config.byKey(key),
    queryFn: async (): Promise<PlatformConfig | null> => {
      const { data, error } = await supabase
        .from('platform_config')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1 minute
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<{ value: unknown }>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('platform_config')
        .update({
          value: updates.value as never,
          version: (data?.version || 0) + 1,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.config.byKey(key) });
      toast.success('Configuration updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update configuration', {
        description: getErrorMessage(error),
      });
    },
  });

  return {
    config: data || null,
    loading: isLoading,
    error: error as Error | null,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
