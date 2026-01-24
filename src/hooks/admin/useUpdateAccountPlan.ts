/**
 * Hook for updating a user's subscription plan
 * 
 * @module hooks/admin/useUpdateAccountPlan
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

interface UpdatePlanParams {
  userId: string;
  planId: string | null;
}

export function useUpdateAccountPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, planId }: UpdatePlanParams) => {
      const { data, error } = await supabase.functions.invoke('admin-update-plan', {
        body: { userId, planId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to update plan');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate account queries to refresh data
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts.all() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts.detail(variables.userId) });
      toast.success('Plan updated', { description: data?.message });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update plan', { description: getErrorMessage(error) });
    },
  });
}
