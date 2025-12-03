import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HelpArticle, HelpCategory } from './useEmbeddedChatConfig';

export const useHelpArticles = (agentId: string) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load articles and categories from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get agent's user_id first
        const { data: agent } = await supabase
          .from('agents')
          .select('user_id')
          .eq('id', agentId)
          .single();

        if (!agent) {
          console.error('Agent not found');
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
        }));

        const mappedArticles: HelpArticle[] = (articlesData || []).map((article) => ({
          id: article.id,
          title: article.title,
          content: article.content,
          category: categoriesData?.find(c => c.id === article.category_id)?.name || '',
          icon: article.icon || undefined,
          order: article.order_index,
          featured_image: article.featured_image || undefined,
        }));

        setCategories(mappedCategories);
        setArticles(mappedArticles);
      } catch (error) {
        console.error('Error fetching help articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

      // Insert article
      const { data: newArticle, error } = await supabase
        .from('help_articles')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          category_id: categoryId,
          title: article.title,
          content: article.content,
          icon: article.icon,
          featured_image: article.featured_image || null,
          order_index: articles.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setArticles([...articles, {
        id: newArticle.id,
        title: newArticle.title,
        content: newArticle.content,
        category: article.category,
        icon: article.icon,
        featured_image: article.featured_image,
        order: newArticle.order_index,
      }]);

      return newArticle.id;
    } catch (error) {
      console.error('Error adding article:', error);
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
          ...(updates.icon !== undefined && { icon: updates.icon }),
          ...(updates.featured_image !== undefined && { featured_image: updates.featured_image || null }),
          ...(categoryId && { category_id: categoryId }),
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setArticles(articles.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ));
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('help_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setArticles(articles.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
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
      console.error('Error reordering articles:', error);
      throw error;
    }
  };

  const addCategory = async (name: string, description: string = '') => {
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
          order_index: categories.length,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, { id: data.id, name, description }]);
      return data.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (oldName: string, newName: string, description: string = '') => {
    try {
      const { error } = await supabase
        .from('help_categories')
        .update({ name: newName, description })
        .eq('agent_id', agentId)
        .eq('name', oldName);

      if (error) throw error;

      setCategories(categories.map(c =>
        c.name === oldName ? { id: c.id, name: newName, description } : c
      ));

      setArticles(articles.map(a =>
        a.category === oldName ? { ...a, category: newName } : a
      ));
    } catch (error) {
      console.error('Error updating category:', error);
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
      console.error('Error removing category:', error);
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
      console.error('Error moving article:', error);
      throw error;
    }
  };

  const importFromKnowledge = async (knowledgeSourceIds: string[]) => {
    // Placeholder for importing from knowledge sources
    console.log('Importing from knowledge sources:', knowledgeSourceIds);
  };

  const bulkImport = async (importData: Array<{
    title: string;
    content: string;
    category: string;
    icon?: string;
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
        icon: item.icon || null,
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
        icon: article.icon || undefined,
        order: article.order_index,
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

      return insertedArticles.length;
    } catch (error) {
      console.error('Error bulk importing articles:', error);
      throw error;
    }
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
  };
};
