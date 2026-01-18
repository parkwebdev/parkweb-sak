/**
 * usePlatformHCArticles Hook
 * 
 * CRUD operations for platform HC articles (super admin only).
 * 
 * @module hooks/admin/usePlatformHCArticles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { PlatformHCArticle, PlatformHCArticleInput } from '@/types/platform-hc';

interface UsePlatformHCArticlesResult {
  articles: PlatformHCArticle[];
  loading: boolean;
  error: Error | null;
  createArticle: (article: PlatformHCArticleInput) => Promise<void>;
  updateArticle: (id: string, updates: Partial<PlatformHCArticleInput>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

export function usePlatformHCArticles(): UsePlatformHCArticlesResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: adminQueryKeys.platformHC.articles(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_hc_articles')
        .select(`
          *,
          category:platform_hc_categories!fk_platform_hc_articles_category(label, color)
        `)
        .order('category_id')
        .order('order_index');

      if (error) throw error;

      return (data || []).map((article) => {
        const cat = article.category as { label: string; color: string } | null;
        return {
          ...article,
          category_label: cat?.label,
          category_color: cat?.color,
        };
      }) as PlatformHCArticle[];
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (article: PlatformHCArticleInput) => {
      const { error } = await supabase
        .from('platform_hc_articles')
        .insert({
          ...article,
          created_by: user?.id,
          updated_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformHC.all() });
      toast.success('Article created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create article', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlatformHCArticleInput> }) => {
      const { error } = await supabase
        .from('platform_hc_articles')
        .update({
          ...updates,
          updated_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformHC.all() });
      toast.success('Article updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update article', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_hc_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformHC.all() });
      toast.success('Article deleted');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete article', { description: getErrorMessage(error) });
    },
  });

  return {
    articles,
    loading: isLoading,
    error: error as Error | null,
    createArticle: async (article) => { await createMutation.mutateAsync(article); },
    updateArticle: async (id, updates) => { await updateMutation.mutateAsync({ id, updates }); },
    deleteArticle: async (id) => { await deleteMutation.mutateAsync(id); },
  };
}
