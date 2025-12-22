/**
 * useNewsItems Hook
 * 
 * Hook for managing widget news/updates feed.
 * News items support rich text content, featured images, author attribution, and CTAs.
 * 
 * Now uses React Query for caching and real-time updates via useSupabaseQuery.
 * 
 * @module hooks/useNewsItems
 */

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { useSupabaseQuery } from './useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type NewsItem = Tables<'news_items'>;
export type NewsItemInsert = TablesInsert<'news_items'>;
export type NewsItemUpdate = TablesUpdate<'news_items'>;

/**
 * Hook for managing widget news/updates feed.
 * 
 * @param {string} agentId - Agent ID to scope news items
 * @returns {Object} News item management methods and state
 */
export const useNewsItems = (agentId: string) => {
  const queryClient = useQueryClient();

  // Fetch news items using React Query with real-time subscription
  const { data: newsItems = [], isLoading: loading, refetch } = useSupabaseQuery<NewsItem[]>({
    queryKey: queryKeys.newsItems.list(agentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    realtime: {
      table: 'news_items',
      filter: `agent_id=eq.${agentId}`,
    },
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper to optimistically update news items
  const optimisticUpdate = (updater: (prev: NewsItem[]) => NewsItem[]) => {
    queryClient.setQueryData<NewsItem[]>(
      queryKeys.newsItems.list(agentId),
      (prev) => updater(prev || [])
    );
  };

  // Helper: Extract storage path from a public URL
  const extractStoragePath = (url: string): string | null => {
    try {
      const match = url.match(/\/article-images\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const addNewsItem = async (newsItem: NewsItemInsert) => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .insert(newsItem)
        .select()
        .single();

      if (error) throw error;

      optimisticUpdate((prev) => [...prev, data]);
      toast.success('News item created successfully');
      return data;
    } catch (error: unknown) {
      logger.error('Error adding news item', error);
      toast.error('Failed to create news item', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const updateNewsItem = async (id: string, updates: NewsItemUpdate) => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      optimisticUpdate((prev) => prev.map(item => item.id === id ? data : item));
      toast.success('News item updated successfully');
      return data;
    } catch (error: unknown) {
      logger.error('Error updating news item', error);
      toast.error('Failed to update news item', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const deleteNewsItem = async (id: string) => {
    try {
      const itemToDelete = newsItems.find(item => item.id === id);
      
      // Optimistic update
      optimisticUpdate((prev) => prev.filter(item => item.id !== id));

      const { error } = await supabase
        .from('news_items')
        .delete()
        .eq('id', id);

      if (error) {
        await refetch();
        throw error;
      }

      // Clean up featured image from storage
      if (itemToDelete?.featured_image_url) {
        const imagePath = extractStoragePath(itemToDelete.featured_image_url);
        if (imagePath) {
          const { error: storageError } = await supabase.storage
            .from('article-images')
            .remove([imagePath]);
          
          if (storageError) {
            logger.warn('Failed to delete news item image from storage', storageError);
          } else {
            logger.info(`Deleted featured image for news item ${id}`);
          }
        }
      }

      toast.success('News item deleted successfully');
    } catch (error: unknown) {
      logger.error('Error deleting news item', error);
      toast.error('Failed to delete news item', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const reorderNewsItems = async (reorderedItems: NewsItem[]) => {
    try {
      // Optimistic update first
      optimisticUpdate(() => reorderedItems);

      const promises = reorderedItems.map((item, index) => 
        supabase
          .from('news_items')
          .update({ order_index: index })
          .eq('id', item.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        await refetch();
        throw errors[0].error;
      }
    } catch (error: unknown) {
      logger.error('Error reordering news items', error);
      toast.error('Failed to reorder news items', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  return {
    newsItems,
    loading,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    reorderNewsItems,
    refetch,
  };
};
