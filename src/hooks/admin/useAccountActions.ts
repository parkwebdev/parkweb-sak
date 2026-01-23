/**
 * Account Actions Hook
 * 
 * Provides mutations for suspending and activating user accounts.
 * 
 * @module hooks/admin/useAccountActions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

interface SuspendAccountParams {
  userId: string;
  userEmail: string;
  reason?: string;
}

interface ActivateAccountParams {
  userId: string;
  userEmail: string;
}

interface AccountActionResult {
  success: boolean;
  action: 'suspend' | 'activate';
  userId: string;
  newStatus: string;
  message: string;
}

/**
 * Hook for managing account suspend/activate actions.
 */
export function useAccountActions() {
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: SuspendAccountParams): Promise<AccountActionResult> => {
      const { data, error } = await supabase.functions.invoke('admin-manage-account', {
        body: { action: 'suspend', userId, reason },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data as AccountActionResult;
    },
    onSuccess: (data, variables) => {
      // Invalidate accounts queries to refresh the list
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts.all() });
      toast.success('Account suspended', {
        description: `${variables.userEmail} has been suspended and signed out.`,
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to suspend account', {
        description: getErrorMessage(error),
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async ({ userId }: ActivateAccountParams): Promise<AccountActionResult> => {
      const { data, error } = await supabase.functions.invoke('admin-manage-account', {
        body: { action: 'activate', userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data as AccountActionResult;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts.all() });
      toast.success('Account activated', {
        description: `${variables.userEmail} can now access the platform.`,
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to activate account', {
        description: getErrorMessage(error),
      });
    },
  });

  return {
    suspend: suspendMutation,
    activate: activateMutation,
  };
}
