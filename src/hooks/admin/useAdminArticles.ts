/**
 * Hook for managing help articles
 * 
 * @module hooks/admin/useAdminArticles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { AdminArticle } from '@/types/admin';

interface UseAdminArticlesResult {
  articles: AdminArticle[];
  loading: boolean;
  error: Error | null;
  createArticle: (article: Partial<AdminArticle>) => Promise<void>;
  updateArticle: (id: string, updates: Partial<AdminArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

export function useAdminArticles(): UseAdminArticlesResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.articles.list(),
    queryFn: async (): Promise<AdminArticle[]> => {
      const { data, error } = await supabase
        .from('help_articles')
        .select(`
          *,
          help_categories!fk_articles_category(name),
          agents!fk_articles_agent(name)
        `)
        .order('title', { ascending: true });

      if (error) throw error;

      return (data || []).map((article) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category_id: article.category_id,
        category_name: article.help_categories?.name || '',
        agent_id: article.agent_id,
        agent_name: article.agents?.name || null,
        icon: article.icon,
        featured_image: article.featured_image,
        order_index: article.order_index,
        created_at: article.created_at || '',
        updated_at: article.updated_at || '',
      }));
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (article: Partial<AdminArticle>) => {
      const { error } = await supabase.from('help_articles').insert({
        title: article.title || '',
        content: article.content || '',
        category_id: article.category_id || '',
        agent_id: article.agent_id || '',
        user_id: article.agent_id || '', // Will be replaced with actual user_id
        icon: article.icon,
        featured_image: article.featured_image,
        order_index: article.order_index,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles.all() });
      toast.success('Article created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create article', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminArticle> }) => {
      const { error } = await supabase
        .from('help_articles')
        .update({
          title: updates.title,
          content: updates.content,
          category_id: updates.category_id,
          icon: updates.icon,
          featured_image: updates.featured_image,
          order_index: updates.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles.all() });
      toast.success('Article updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update article', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('help_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles.all() });
      toast.success('Article deleted');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete article', { description: getErrorMessage(error) });
    },
  });

  return {
    articles: data || [],
    loading: isLoading,
    error: error as Error | null,
    createArticle: createMutation.mutateAsync,
    updateArticle: (id, updates) => updateMutation.mutateAsync({ id, updates }),
    deleteArticle: deleteMutation.mutateAsync,
  };
}
