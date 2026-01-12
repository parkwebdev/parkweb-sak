/**
 * Hook for managing help categories
 * 
 * @module hooks/admin/useAdminCategories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { AdminCategory } from '@/types/admin';

interface UseAdminCategoriesResult {
  categories: AdminCategory[];
  loading: boolean;
  error: Error | null;
  createCategory: (category: Partial<AdminCategory>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<AdminCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useAdminCategories(): UseAdminCategoriesResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.categories.list(),
    queryFn: async (): Promise<AdminCategory[]> => {
      const { data: categories, error } = await supabase
        .from('help_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Get article counts for each category
      const categoriesWithCounts = await Promise.all(
        (categories || []).map(async (cat) => {
          const { count } = await supabase
            .from('help_articles')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', cat.id);

          return {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            order_index: cat.order_index,
            article_count: count || 0,
          };
        })
      );

      return categoriesWithCounts;
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (category: Partial<AdminCategory>) => {
      // Need to get an agent_id and user_id for the category
      const { data: agent } = await supabase.from('agents').select('id, user_id').limit(1).single();
      
      if (!agent) throw new Error('No agent found');

      const { error } = await supabase.from('help_categories').insert({
        name: category.name || '',
        description: category.description,
        icon: category.icon,
        order_index: category.order_index,
        agent_id: agent.id,
        user_id: agent.user_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all() });
      toast.success('Category created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create category', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminCategory> }) => {
      const { error } = await supabase
        .from('help_categories')
        .update({
          name: updates.name,
          description: updates.description,
          icon: updates.icon,
          order_index: updates.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all() });
      toast.success('Category updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update category', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('help_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all() });
      toast.success('Category deleted');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete category', { description: getErrorMessage(error) });
    },
  });

  return {
    categories: data || [],
    loading: isLoading,
    error: error as Error | null,
    createCategory: createMutation.mutateAsync,
    updateCategory: (id, updates) => updateMutation.mutateAsync({ id, updates }),
    deleteCategory: deleteMutation.mutateAsync,
  };
}
