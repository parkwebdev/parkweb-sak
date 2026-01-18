/**
 * usePlatformHCCategories Hook
 * 
 * CRUD operations for platform HC categories (super admin only).
 * 
 * @module hooks/admin/usePlatformHCCategories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { PlatformHCCategory, PlatformHCCategoryInput } from '@/types/platform-hc';

interface UsePlatformHCCategoriesResult {
  categories: PlatformHCCategory[];
  loading: boolean;
  error: Error | null;
  createCategory: (category: PlatformHCCategoryInput) => Promise<void>;
  updateCategory: (id: string, updates: Partial<PlatformHCCategoryInput>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function usePlatformHCCategories(): UsePlatformHCCategoriesResult {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: adminQueryKeys.platformHC.categories(),
    queryFn: async () => {
      // Fetch categories and articles count in parallel
      const [categoriesResult, articlesResult] = await Promise.all([
        supabase
          .from('platform_hc_categories')
          .select('*')
          .order('order_index'),
        supabase
          .from('platform_hc_articles')
          .select('category_id'),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;

      // Count articles per category
      const articleCounts: Record<string, number> = {};
      (articlesResult.data || []).forEach((article) => {
        articleCounts[article.category_id] = (articleCounts[article.category_id] || 0) + 1;
      });

      return (categoriesResult.data || []).map((cat) => ({
        ...cat,
        article_count: articleCounts[cat.id] || 0,
      })) as PlatformHCCategory[];
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (category: PlatformHCCategoryInput) => {
      const { error } = await supabase
        .from('platform_hc_categories')
        .insert(category);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformHC.all() });
      toast.success('Category created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create category', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlatformHCCategoryInput> }) => {
      const { error } = await supabase
        .from('platform_hc_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformHC.all() });
      toast.success('Category updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update category', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_hc_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformHC.all() });
      toast.success('Category deleted');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete category', { description: getErrorMessage(error) });
    },
  });

  return {
    categories,
    loading: isLoading,
    error: error as Error | null,
    createCategory: async (category) => { await createMutation.mutateAsync(category); },
    updateCategory: async (id, updates) => { await updateMutation.mutateAsync({ id, updates }); },
    deleteCategory: async (id) => { await deleteMutation.mutateAsync(id); },
  };
}
