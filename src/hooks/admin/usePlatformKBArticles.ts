/**
 * usePlatformKBArticles Hook
 * 
 * CRUD operations for platform KB articles (super admin only).
 * 
 * @module hooks/admin/usePlatformKBArticles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { PlatformKBArticle, PlatformKBArticleInput } from '@/types/platform-kb';

interface UsePlatformKBArticlesResult {
  articles: PlatformKBArticle[];
  loading: boolean;
  error: Error | null;
  createArticle: (article: PlatformKBArticleInput) => Promise<void>;
  updateArticle: (id: string, updates: Partial<PlatformKBArticleInput>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

export function usePlatformKBArticles(): UsePlatformKBArticlesResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: adminQueryKeys.platformKB.articles(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_kb_articles')
        .select(`
          *,
          category:platform_kb_categories(label)
        `)
        .order('category_id')
        .order('order_index');

      if (error) throw error;

      return (data || []).map((article) => ({
        ...article,
        category_label: article.category?.label,
      })) as PlatformKBArticle[];
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (article: PlatformKBArticleInput) => {
      const { error } = await supabase
        .from('platform_kb_articles')
        .insert({
          ...article,
          created_by: user?.id,
          updated_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformKB.all() });
      toast.success('Article created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create article', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlatformKBArticleInput> }) => {
      const { error } = await supabase
        .from('platform_kb_articles')
        .update({
          ...updates,
          updated_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformKB.all() });
      toast.success('Article updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update article', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_kb_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.platformKB.all() });
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
