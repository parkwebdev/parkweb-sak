/**
 * Hook for managing subscription plans
 * 
 * @module hooks/admin/useAdminPlans
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { AdminPlan, PlanFeatures, PlanLimits } from '@/types/admin';

interface UseAdminPlansResult {
  plans: AdminPlan[];
  loading: boolean;
  error: Error | null;
  createPlan: (plan: Omit<AdminPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePlan: (id: string, updates: Partial<AdminPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useAdminPlans(): UseAdminPlansResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.plans.list(),
    queryFn: async (): Promise<AdminPlan[]> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;

      return (data || []).map((plan) => ({
        id: plan.id,
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        active: plan.active ?? true,
        features: (plan.features as PlanFeatures) || {},
        limits: (plan.limits as PlanLimits) || {},
        created_at: plan.created_at,
        updated_at: plan.updated_at,
      }));
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (plan: Omit<AdminPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('plans').insert({
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        active: plan.active,
        features: plan.features as never,
        limits: plan.limits as never,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans.all() });
      toast.success('Plan created successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create plan', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminPlan> }) => {
      const { error } = await supabase
        .from('plans')
        .update({
          ...updates,
          features: updates.features as never,
          limits: updates.limits as never,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans.all() });
      toast.success('Plan updated successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update plan', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans.all() });
      toast.success('Plan deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete plan', { description: getErrorMessage(error) });
    },
  });

  return {
    plans: data || [],
    loading: isLoading,
    error: error as Error | null,
    createPlan: createMutation.mutateAsync,
    updatePlan: (id, updates) => updateMutation.mutateAsync({ id, updates }),
    deletePlan: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
