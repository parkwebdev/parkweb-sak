import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HelpArticle, HelpCategory } from './useEmbeddedChatConfig';
import { logger } from '@/utils/logger';

/**
 * Hook for managing help center articles and categories.
 * Handles article CRUD, category management, drag-and-drop reordering,
 * bulk import, and automatic embedding generation for RAG search.
 * 
 * @param {string} agentId - Agent ID to scope articles
 * @returns {Object} Help article management methods and state
 * @returns {HelpArticle[]} articles - List of help articles
 * @returns {HelpCategory[]} categories - List of categories
 * @returns {boolean} loading - Loading state
 * @returns {Function} addArticle - Create a new article
 * @returns {Function} updateArticle - Update an existing article
 * @returns {Function} deleteArticle - Delete an article (cleans up storage images)
 * @returns {Function} reorderArticles - Update article display order
 * @returns {Function} addCategory - Create a new category
 * @returns {Function} updateCategory - Update a category
 * @returns {Function} removeCategory - Delete a category (with article handling)
 * @returns {Function} moveArticleToCategory - Move article between categories
 * @returns {Function} bulkImport - Import multiple articles at once
 */
export const useHelpArticles = (agentId: string) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Fetch data function wrapped in useCallback for stability
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!agentId) return;

    // Only show loading state on initial load, not refetches
    if (!isRefetch && !initialLoadDone.current) {
      setLoading(true);
    }

    try {
      // Get agent's user_id first
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) {
        logger.error('Agent not found');
        return;
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

      setCategories(mappedCategories);
      setArticles(mappedArticles);
      initialLoadDone.current = true;
    } catch (error) {
      logger.error('Error fetching help articles', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Store fetchData in ref to prevent useEffect re-runs
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  // Initial fetch - only depends on agentId, uses ref to call current function
  useEffect(() => {
    if (!agentId) return;
    fetchDataRef.current(false);
  }, [agentId]);

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

      // Insert article (without icon field)
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
      setArticles([...articles, {
        id: newArticle.id,
        title: newArticle.title,
        content: newArticle.content,
        category: article.category,
        featured_image: article.featured_image,
        order: newArticle.order_index,
        has_embedding: false, // Will be embedded async
      }]);

      return newArticle.id;
    } catch (error) {
      logger.error('Error adding article', error);
      throw error;
    }
  };

  const updateArticle = async (id: string, updates: Partial<HelpArticle>) => {
    try {
      // Get agent's user_id
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      let categoryId: string | undefined;

      // If category changed, find or create it
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
      setArticles(articles.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ));
    } catch (error) {
      logger.error('Error updating article', error);
      throw error;
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      // Get the article first to find images to clean up
      const articleToDelete = articles.find(a => a.id === id);
      
      const { error } = await supabase
        .from('help_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clean up images from storage
      if (articleToDelete) {
        const imagesToDelete: string[] = [];
        
        // Add featured image if exists
        if (articleToDelete.featured_image) {
          const featuredPath = extractStoragePath(articleToDelete.featured_image);
          if (featuredPath) imagesToDelete.push(featuredPath);
        }
        
        // Extract inline images from content
        const inlineImages = extractInlineImages(articleToDelete.content);
        imagesToDelete.push(...inlineImages);
        
        // Delete all images from storage
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

      setArticles(articles.filter(a => a.id !== id));
    } catch (error) {
      logger.error('Error deleting article', error);
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
      // Update order_index for each article
      const updates = reorderedArticles.map((article, index) =>
        supabase
          .from('help_articles')
          .update({ order_index: index })
          .eq('id', article.id)
      );

      await Promise.all(updates);
      setArticles(reorderedArticles);
    } catch (error) {
      logger.error('Error reordering articles', error);
      throw error;
    }
  };

  const addCategory = async (name: string, description: string = '', icon: string = 'book') => {
    try {
      // Get agent's user_id
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

      setCategories([...categories, { id: data.id, name, description, icon }]);
      return data.id;
    } catch (error) {
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

      setCategories(categories.map(c =>
        c.name === oldName ? { id: c.id, name: newName, description, icon } : c
      ));

      setArticles(articles.map(a =>
        a.category === oldName ? { ...a, category: newName } : a
      ));
    } catch (error) {
      logger.error('Error updating category', error);
      throw error;
    }
  };

  const removeCategory = async (name: string, options?: { moveArticlesTo?: string; deleteArticles?: boolean }) => {
    try {
      const articlesInCategory = articles.filter(a => a.category === name);
      
      if (articlesInCategory.length > 0) {
        if (options?.moveArticlesTo) {
          // Move articles to target category
          const targetCategory = categories.find(c => c.name === options.moveArticlesTo);
          if (!targetCategory) throw new Error('Target category not found');
          
          const { error: moveError } = await supabase
            .from('help_articles')
            .update({ category_id: targetCategory.id })
            .eq('agent_id', agentId)
            .in('id', articlesInCategory.map(a => a.id));
          
          if (moveError) throw moveError;
          
          // Update local state for moved articles
          setArticles(articles.map(a => 
            a.category === name ? { ...a, category: options.moveArticlesTo! } : a
          ));
        } else if (options?.deleteArticles) {
          // Delete all articles in category
          const { error: deleteError } = await supabase
            .from('help_articles')
            .delete()
            .eq('agent_id', agentId)
            .in('id', articlesInCategory.map(a => a.id));
          
          if (deleteError) throw deleteError;
          
          // Update local state
          setArticles(articles.filter(a => a.category !== name));
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

      setCategories(categories.filter(c => c.name !== name));
    } catch (error) {
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

      setArticles(articles.map(a =>
        a.id === articleId ? { ...a, category: targetCategoryName } : a
      ));
    } catch (error) {
      logger.error('Error moving article', error);
      throw error;
    }
  };

  const importFromKnowledge = async (knowledgeSourceIds: string[]) => {
    // Placeholder for importing from knowledge sources
    logger.info('Importing from knowledge sources', knowledgeSourceIds);
  };

  const bulkImport = async (importData: Array<{
    title: string;
    content: string;
    category: string;
  }>) => {
    try {
      // Get agent's user_id
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      // Get unique categories
      const uniqueCategories = [...new Set(importData.map(item => item.category))];

      // Create or find categories
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

      // Prepare articles for bulk insert
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

      // Update local state
      const newArticles = insertedArticles.map((article, index) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category: importData[index].category,
        order: article.order_index,
        has_embedding: false, // Will be embedded async
      }));

      setArticles([...articles, ...newArticles]);

      // Update categories if new ones were added
      const newCategoriesData = uniqueCategories
        .filter(name => !categories.some(c => c.name === name))
        .map(name => ({
          id: categoryMap.get(name)!,
          name,
          description: '',
        }));

      if (newCategoriesData.length > 0) {
        setCategories([...categories, ...newCategoriesData]);
      }

      // Trigger embedding for all imported articles in background (batch of 3)
      const batchSize = 3;
      for (let i = 0; i < insertedArticles.length; i += batchSize) {
        const batch = insertedArticles.slice(i, i + batchSize);
        Promise.all(batch.map((article, batchIndex) => 
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
    } catch (error) {
      logger.error('Error bulk importing articles', error);
      throw error;
    }
  };

  const embedAllArticles = async (onProgress?: (current: number, total: number) => void) => {
    const unembeddedArticles = articles.filter(a => !a.has_embedding);
    const total = unembeddedArticles.length;
    
    if (total === 0) return 0;

    let completed = 0;
    
    // Process in batches of 3 to avoid rate limiting
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
        } catch (err) {
          logger.error('Failed to embed article', { articleId: article.id, error: err });
        }
      }));
    }

    // Refresh articles to get updated embedding status
    const { data: articlesData } = await supabase
      .from('help_articles')
      .select('id, embedding')
      .eq('agent_id', agentId);

    if (articlesData) {
      setArticles(articles.map(a => ({
        ...a,
        has_embedding: articlesData.find(d => d.id === a.id)?.embedding !== null,
      })));
    }

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
    refetch: () => fetchData(true),
  };
};
