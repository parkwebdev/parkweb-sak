import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type NewsItem = Tables<'news_items'>;
export type NewsItemInsert = TablesInsert<'news_items'>;
export type NewsItemUpdate = TablesUpdate<'news_items'>;

/**
 * Hook for managing widget news/updates feed.
 * News items support rich text content, featured images, author attribution, and CTAs.
 * 
 * @param {string} agentId - Agent ID to scope news items
 * @returns {Object} News item management methods and state
 * @returns {NewsItem[]} newsItems - List of news items ordered by index
 * @returns {boolean} loading - Loading state
 * @returns {Function} addNewsItem - Create a new news item
 * @returns {Function} updateNewsItem - Update an existing news item
 * @returns {Function} deleteNewsItem - Delete a news item (cleans up images)
 * @returns {Function} refetch - Manually refresh news items list
 */
export const useNewsItems = (agentId: string) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNewsItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setNewsItems(data || []);
    } catch (error: any) {
      logger.error('Error fetching news items', error);
      toast.error('Failed to load news items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchNewsItems();
    }
  }, [agentId]);

  const addNewsItem = async (newsItem: NewsItemInsert) => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .insert(newsItem)
        .select()
        .single();

      if (error) throw error;

      setNewsItems([...newsItems, data]);
      toast.success('News item created successfully');
      return data;
    } catch (error: any) {
      logger.error('Error adding news item', error);
      toast.error('Failed to create news item');
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

      setNewsItems(newsItems.map(item => item.id === id ? data : item));
      toast.success('News item updated successfully');
      return data;
    } catch (error: any) {
      logger.error('Error updating news item', error);
      toast.error('Failed to update news item');
      throw error;
    }
  };

  const deleteNewsItem = async (id: string) => {
    try {
      // Get the news item first to find featured image to clean up
      const itemToDelete = newsItems.find(item => item.id === id);
      
      const { error } = await supabase
        .from('news_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

      setNewsItems(newsItems.filter(item => item.id !== id));
      toast.success('News item deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting news item', error);
      toast.error('Failed to delete news item');
      throw error;
    }
  };

  // Helper: Extract storage path from a public URL
  const extractStoragePath = (url: string): string | null => {
    try {
      // URL format: https://<project>.supabase.co/storage/v1/object/public/article-images/<path>
      const match = url.match(/\/article-images\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const reorderNewsItems = async (reorderedItems: NewsItem[]) => {
    try {
      // Update each item individually to avoid type issues with upsert
      const promises = reorderedItems.map((item, index) => 
        supabase
          .from('news_items')
          .update({ order_index: index })
          .eq('id', item.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw errors[0].error;

      setNewsItems(reorderedItems);
    } catch (error: any) {
      logger.error('Error reordering news items', error);
      toast.error('Failed to reorder news items');
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
  };
};