/**
 * usePlatformKBCategories Hook
 * 
 * CRUD operations for platform KB categories (super admin only).
 * 
 * @module hooks/admin/usePlatformKBCategories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { PlatformKBCategory, PlatformKBCategoryInput } from '@/types/platform-kb';

interface UsePlatformKBCategoriesResult {
  categories: PlatformKBCategory[];
  loading: boolean;
  error: Error | null;
  createCategory: (category: PlatformKBCategoryInput) => Promise<void>;
  updateCategory: (id: string, updates: Partial<PlatformKBCategoryInput>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function usePlatformKBCategories(): UsePlatformKBCategoriesResult {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: adminQueryKeys.platformKB.categories(),
    queryFn: async () => {
      // Fetch categories and articles count in parallel
      const [categoriesResult, articlesResult] = await Promise.all([
        supabase
          .from('platform_kb_categories')
          .select('*')
          .order('order_index'),
        supabase
          .from('platform_kb_articles')
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
      })) as PlatformKBCategory[];
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (category: PlatformKBCategoryInput) => {
      const { error } = await supabase
        .from('platform_kb_categories')
        .insert(category);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformKB.all() });
      toast.success('Category created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create category', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlatformKBCategoryInput> }) => {
      const { error } = await supabase
        .from('platform_kb_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformKB.all() });
      toast.success('Category updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update category', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_kb_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformKB.all() });
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
