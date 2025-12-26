/**
 * useHelpArticles Hook
 * 
 * Hook for managing help center articles and categories.
 * Handles article CRUD, category management, drag-and-drop reordering,
 * bulk import, and automatic embedding generation for RAG search.
 * 
 * Now uses React Query for caching via useSupabaseQuery.
 * 
 * @module hooks/useHelpArticles
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HelpArticle, HelpCategory } from './useEmbeddedChatConfig';
import { logger } from '@/utils/logger';
import { useSupabaseQuery } from './useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';

interface HelpArticlesData {
  articles: HelpArticle[];
  categories: HelpCategory[];
}

/**
 * Hook for managing help center articles and categories.
 * 
 * @param {string} agentId - Agent ID to scope articles
 * @returns {Object} Help article management methods and state
 */
export const useHelpArticles = (agentId: string) => {
  const queryClient = useQueryClient();

  // Combined fetch for articles and categories using React Query
  const { data, isLoading: loading, refetch } = useSupabaseQuery<HelpArticlesData>({
    queryKey: queryKeys.helpArticles.list(agentId),
    queryFn: async () => {
      if (!agentId) return { articles: [], categories: [] };

      // Get agent's user_id first
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) {
        logger.error('Agent not found');
        return { articles: [], categories: [] };
      }

      // Fetch categories
      const { data: categoriesData, error: catError } = await supabase
        .from('help_categories')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index');

      if (catError) throw catError;

      // Fetch articles
      const { data: articlesData, error: artError } = await supabase
        .from('help_articles')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index');

      if (artError) throw artError;

      const mappedCategories: HelpCategory[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || 'book',
      }));

      const mappedArticles: HelpArticle[] = (articlesData || []).map((article) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category: categoriesData?.find(c => c.id === article.category_id)?.name || '',
        order: article.order_index,
        featured_image: article.featured_image || undefined,
        has_embedding: article.embedding !== null,
        created_at: article.created_at || undefined,
      }));

      return { articles: mappedArticles, categories: mappedCategories };
    },
    realtime: {
      table: 'help_articles',
      filter: `agent_id=eq.${agentId}`,
    },
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const articles = data?.articles || [];
  const categories = data?.categories || [];

  // Helper to optimistically update data
  const optimisticUpdate = (updater: (prev: HelpArticlesData) => HelpArticlesData) => {
    queryClient.setQueryData<HelpArticlesData>(
      queryKeys.helpArticles.list(agentId),
      (prev) => updater(prev || { articles: [], categories: [] })
    );
  };

  const addArticle = async (article: Omit<HelpArticle, 'id' | 'order'>) => {
    try {
      // Get user_id from agent
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      // Find or create category
      let categoryId = '';
      const existingCategory = await supabase
        .from('help_categories')
        .select('id')
        .eq('agent_id', agentId)
        .eq('name', article.category)
        .single();

      if (existingCategory.data) {
        categoryId = existingCategory.data.id;
      } else {
        const { data: newCategory, error: catError } = await supabase
          .from('help_categories')
          .insert({
            agent_id: agentId,
            user_id: agent.user_id,
            name: article.category,
            description: '',
            order_index: categories.length,
          })
          .select()
          .single();

        if (catError) throw catError;
        categoryId = newCategory.id;
      }

      // Insert article
      const { data: newArticle, error } = await supabase
        .from('help_articles')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          category_id: categoryId,
          title: article.title,
          content: article.content,
          featured_image: article.featured_image || null,
          order_index: articles.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger embedding generation in background
      supabase.functions.invoke('embed-help-article', {
        body: { 
          articleId: newArticle.id, 
          title: article.title, 
          content: article.content 
        }
      }).catch((err: Error) => {
        logger.error('Failed to trigger article embedding', err);
      });

      // Update local state
      optimisticUpdate((prev) => ({
        ...prev,
        articles: [...prev.articles, {
          id: newArticle.id,
          title: newArticle.title,
          content: newArticle.content,
          category: article.category,
          featured_image: article.featured_image,
          order: newArticle.order_index,
          has_embedding: false,
        }],
      }));

      return newArticle.id;
    } catch (error: unknown) {
      logger.error('Error adding article', error);
      throw error;
    }
  };

  const updateArticle = async (id: string, updates: Partial<HelpArticle>) => {
    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      let categoryId: string | undefined;

      if (updates.category) {
        const existingCategory = await supabase
          .from('help_categories')
          .select('id')
          .eq('agent_id', agentId)
          .eq('name', updates.category)
          .single();

        if (existingCategory.data) {
          categoryId = existingCategory.data.id;
        } else {
          const { data: newCategory } = await supabase
            .from('help_categories')
            .insert({
              agent_id: agentId,
              user_id: agent.user_id,
              name: updates.category,
              description: '',
              order_index: categories.length,
            })
            .select()
            .single();

          if (newCategory) categoryId = newCategory.id;
        }
      }

      const { error } = await supabase
        .from('help_articles')
        .update({
          ...(updates.title && { title: updates.title }),
          ...(updates.content && { content: updates.content }),
          ...(updates.featured_image !== undefined && { featured_image: updates.featured_image || null }),
          ...(categoryId && { category_id: categoryId }),
        })
        .eq('id', id);

      if (error) throw error;

      // Re-embed if title or content changed
      if (updates.title || updates.content) {
        const currentArticle = articles.find(a => a.id === id);
        supabase.functions.invoke('embed-help-article', {
          body: { 
            articleId: id, 
            title: updates.title || currentArticle?.title || '',
            content: updates.content || currentArticle?.content || ''
          }
        }).catch((err: Error) => {
          logger.error('Failed to trigger article re-embedding', err);
        });
      }

      // Update local state
      optimisticUpdate((prev) => ({
        ...prev,
        articles: prev.articles.map(a =>
          a.id === id ? { ...a, ...updates } : a
        ),
      }));
    } catch (error: unknown) {
      logger.error('Error updating article', error);
      throw error;
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      const articleToDelete = articles.find(a => a.id === id);
      
      const { error } = await supabase
        .from('help_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clean up images from storage
      if (articleToDelete) {
        const imagesToDelete: string[] = [];
        
        if (articleToDelete.featured_image) {
          const featuredPath = extractStoragePath(articleToDelete.featured_image);
          if (featuredPath) imagesToDelete.push(featuredPath);
        }
        
        const inlineImages = extractInlineImages(articleToDelete.content);
        imagesToDelete.push(...inlineImages);
        
        if (imagesToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('article-images')
            .remove(imagesToDelete);
          
          if (storageError) {
            logger.warn('Failed to delete article images from storage', storageError);
          } else {
            logger.info(`Deleted ${imagesToDelete.length} images for article ${id}`);
          }
        }
      }

      optimisticUpdate((prev) => ({
        ...prev,
        articles: prev.articles.filter(a => a.id !== id),
      }));
    } catch (error: unknown) {
      logger.error('Error deleting article', error);
      throw error;
    }
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

  // Helper: Extract inline image paths from HTML content
  const extractInlineImages = (content: string): string[] => {
    const paths: string[] = [];
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.includes('article-images')) {
        const path = extractStoragePath(src);
        if (path) paths.push(path);
      }
    }
    
    return paths;
  };

  const reorderArticles = async (reorderedArticles: HelpArticle[]) => {
    try {
      const updates = reorderedArticles.map((article, index) =>
        supabase
          .from('help_articles')
          .update({ order_index: index })
          .eq('id', article.id)
      );

      await Promise.all(updates);
      
      optimisticUpdate((prev) => ({
        ...prev,
        articles: reorderedArticles,
      }));
    } catch (error: unknown) {
      logger.error('Error reordering articles', error);
      throw error;
    }
  };

  const addCategory = async (name: string, description: string = '', icon: string = 'book') => {
    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      const { data, error } = await supabase
        .from('help_categories')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          name,
          description,
          icon,
          order_index: categories.length,
        })
        .select()
        .single();

      if (error) throw error;

      optimisticUpdate((prev) => ({
        ...prev,
        categories: [...prev.categories, { id: data.id, name, description, icon }],
      }));
      
      return data.id;
    } catch (error: unknown) {
      logger.error('Error adding category', error);
      throw error;
    }
  };

  const updateCategory = async (oldName: string, newName: string, description: string = '', icon: string = 'book') => {
    try {
      const { error } = await supabase
        .from('help_categories')
        .update({ name: newName, description, icon })
        .eq('agent_id', agentId)
        .eq('name', oldName);

      if (error) throw error;

      optimisticUpdate((prev) => ({
        categories: prev.categories.map(c =>
          c.name === oldName ? { id: c.id, name: newName, description, icon } : c
        ),
        articles: prev.articles.map(a =>
          a.category === oldName ? { ...a, category: newName } : a
        ),
      }));
    } catch (error: unknown) {
      logger.error('Error updating category', error);
      throw error;
    }
  };

  const removeCategory = async (name: string, options?: { moveArticlesTo?: string; deleteArticles?: boolean }) => {
    try {
      const articlesInCategory = articles.filter(a => a.category === name);
      
      if (articlesInCategory.length > 0) {
        if (options?.moveArticlesTo) {
          const targetCategory = categories.find(c => c.name === options.moveArticlesTo);
          if (!targetCategory) throw new Error('Target category not found');
          
          const { error: moveError } = await supabase
            .from('help_articles')
            .update({ category_id: targetCategory.id })
            .eq('agent_id', agentId)
            .in('id', articlesInCategory.map(a => a.id));
          
          if (moveError) throw moveError;
          
          optimisticUpdate((prev) => ({
            ...prev,
            articles: prev.articles.map(a => 
              a.category === name ? { ...a, category: options.moveArticlesTo! } : a
            ),
          }));
        } else if (options?.deleteArticles) {
          const { error: deleteError } = await supabase
            .from('help_articles')
            .delete()
            .eq('agent_id', agentId)
            .in('id', articlesInCategory.map(a => a.id));
          
          if (deleteError) throw deleteError;
          
          optimisticUpdate((prev) => ({
            ...prev,
            articles: prev.articles.filter(a => a.category !== name),
          }));
        } else {
          throw new Error('Cannot delete category with existing articles');
        }
      }

      const { error } = await supabase
        .from('help_categories')
        .delete()
        .eq('agent_id', agentId)
        .eq('name', name);

      if (error) throw error;

      optimisticUpdate((prev) => ({
        ...prev,
        categories: prev.categories.filter(c => c.name !== name),
      }));
    } catch (error: unknown) {
      logger.error('Error removing category', error);
      throw error;
    }
  };

  const moveArticleToCategory = async (articleId: string, targetCategoryName: string) => {
    try {
      const targetCategory = categories.find(c => c.name === targetCategoryName);
      if (!targetCategory) throw new Error('Target category not found');

      const { error } = await supabase
        .from('help_articles')
        .update({ category_id: targetCategory.id })
        .eq('id', articleId);

      if (error) throw error;

      optimisticUpdate((prev) => ({
        ...prev,
        articles: prev.articles.map(a =>
          a.id === articleId ? { ...a, category: targetCategoryName } : a
        ),
      }));
    } catch (error: unknown) {
      logger.error('Error moving article', error);
      throw error;
    }
  };

  const importFromKnowledge = async (knowledgeSourceIds: string[]) => {
    logger.info('Importing from knowledge sources', knowledgeSourceIds);
  };

  const bulkImport = async (importData: Array<{
    title: string;
    content: string;
    category: string;
  }>) => {
    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      const uniqueCategories = [...new Set(importData.map(item => item.category))];
      const categoryMap = new Map<string, string>();

      for (const catName of uniqueCategories) {
        const existingCat = await supabase
          .from('help_categories')
          .select('id')
          .eq('agent_id', agentId)
          .eq('name', catName)
          .single();

        if (existingCat.data) {
          categoryMap.set(catName, existingCat.data.id);
        } else {
          const { data: newCat } = await supabase
            .from('help_categories')
            .insert({
              agent_id: agentId,
              user_id: agent.user_id,
              name: catName,
              description: '',
              order_index: categories.length + categoryMap.size,
            })
            .select()
            .single();

          if (newCat) categoryMap.set(catName, newCat.id);
        }
      }

      const articlesToInsert = importData.map((item, index) => ({
        agent_id: agentId,
        user_id: agent.user_id,
        category_id: categoryMap.get(item.category)!,
        title: item.title,
        content: item.content,
        order_index: articles.length + index,
      }));

      const { data: insertedArticles, error } = await supabase
        .from('help_articles')
        .insert(articlesToInsert)
        .select();

      if (error) throw error;

      const newArticles = insertedArticles.map((article, index) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category: importData[index].category,
        order: article.order_index,
        has_embedding: false,
      }));

      const newCategoriesData = uniqueCategories
        .filter(name => !categories.some(c => c.name === name))
        .map(name => ({
          id: categoryMap.get(name)!,
          name,
          description: '',
        }));

      optimisticUpdate((prev) => ({
        articles: [...prev.articles, ...newArticles],
        categories: newCategoriesData.length > 0 
          ? [...prev.categories, ...newCategoriesData]
          : prev.categories,
      }));

      // Trigger embedding for all imported articles in background
      const batchSize = 3;
      for (let i = 0; i < insertedArticles.length; i += batchSize) {
        const batch = insertedArticles.slice(i, i + batchSize);
        Promise.all(batch.map((article) => 
          supabase.functions.invoke('embed-help-article', {
            body: { 
              articleId: article.id, 
              title: article.title, 
              content: article.content 
            }
          })
        )).catch((err: Error) => {
          logger.error('Failed to trigger bulk article embedding', err);
        });
      }

      return insertedArticles.length;
    } catch (error: unknown) {
      logger.error('Error bulk importing articles', error);
      throw error;
    }
  };

  const embedAllArticles = async (onProgress?: (current: number, total: number) => void) => {
    const unembeddedArticles = articles.filter(a => !a.has_embedding);
    const total = unembeddedArticles.length;
    
    if (total === 0) return 0;

    let completed = 0;
    
    const batchSize = 3;
    for (let i = 0; i < unembeddedArticles.length; i += batchSize) {
      const batch = unembeddedArticles.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (article) => {
        try {
          await supabase.functions.invoke('embed-help-article', {
            body: { 
              articleId: article.id, 
              title: article.title, 
              content: article.content 
            }
          });
          completed++;
          onProgress?.(completed, total);
        } catch (err: unknown) {
          logger.error('Failed to embed article', { articleId: article.id, error: err });
        }
      }));
    }

    // Refresh to get updated embedding status
    await refetch();

    return completed;
  };

  return {
    articles,
    categories,
    loading,
    addArticle,
    updateArticle,
    deleteArticle,
    reorderArticles,
    addCategory,
    updateCategory,
    removeCategory,
    moveArticleToCategory,
    importFromKnowledge,
    bulkImport,
    embedAllArticles,
    refetch,
  };
};
