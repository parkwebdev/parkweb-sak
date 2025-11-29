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
      setLoading(true);
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('help_categories')
          .select('*')
          .eq('agent_id', agentId)
          .order('order_index');

        if (categoriesError) throw categoriesError;

        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('help_articles')
          .select('*')
          .eq('agent_id', agentId)
          .order('order_index');

        if (articlesError) throw articlesError;

        // Map database format to app format
        const mappedCategories: HelpCategory[] = (categoriesData || []).map(cat => ({
          name: cat.name,
          description: cat.description || '',
        }));

        const mappedArticles: HelpArticle[] = (articlesData || []).map((article, index) => ({
          id: article.id,
          title: article.title,
          content: article.content,
          category: categoriesData?.find(c => c.id === article.category_id)?.name || '',
          icon: article.icon || undefined,
          order: article.order_index,
        }));

        setCategories(mappedCategories);
        setArticles(mappedArticles);
      } catch (error) {
        console.error('Error loading help data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId]);

  const addArticle = async (article: Omit<HelpArticle, 'id' | 'order'>) => {
    try {
      // Get org_id from agent
      const { data: agent } = await supabase
        .from('agents')
        .select('org_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      // Get or create category
      let categoryId: string;
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
            org_id: agent.org_id,
            name: article.category,
            description: '',
            order_index: categories.length,
          })
          .select()
          .single();

        if (catError) throw catError;
        categoryId = newCategory.id;

        // Update local categories
        setCategories(prev => [...prev, { name: article.category, description: '' }]);
      }

      // Insert article
      const { data: newArticle, error } = await supabase
        .from('help_articles')
        .insert({
          agent_id: agentId,
          org_id: agent.org_id,
          category_id: categoryId,
          title: article.title,
          content: article.content,
          icon: article.icon,
          order_index: articles.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setArticles(prev => [...prev, {
        id: newArticle.id,
        title: newArticle.title,
        content: newArticle.content,
        category: article.category,
        icon: newArticle.icon || undefined,
        order: newArticle.order_index,
      }]);
    } catch (error) {
      console.error('Error adding article:', error);
      throw error;
    }
  };

  const updateArticle = async (id: string, updates: Partial<HelpArticle>) => {
    try {
      const dbUpdates: any = {
        title: updates.title,
        content: updates.content,
        icon: updates.icon,
      };

      // Handle category change
      if (updates.category) {
        const { data: categoryData } = await supabase
          .from('help_categories')
          .select('id')
          .eq('agent_id', agentId)
          .eq('name', updates.category)
          .single();

        if (categoryData) {
          dbUpdates.category_id = categoryData.id;
        }
      }

      const { error } = await supabase
        .from('help_articles')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === id ? { ...article, ...updates } : article
      ));

      // Add category if it doesn't exist
      if (updates.category && !categories.some(cat => cat.name === updates.category)) {
        setCategories(prev => [...prev, { name: updates.category, description: '' }]);
      }
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

      setArticles(prev => prev.filter(article => article.id !== id));
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  };

  const reorderArticles = async (reorderedArticles: HelpArticle[]) => {
    try {
      // Update order in database
      const updates = reorderedArticles.map((article, index) => ({
        id: article.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('help_articles')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      // Update local state
      setArticles(reorderedArticles.map((article, index) => ({
        ...article,
        order: index,
      })));
    } catch (error) {
      console.error('Error reordering articles:', error);
      throw error;
    }
  };

  const addCategory = async (name: string, description: string = '') => {
    if (categories.some(cat => cat.name === name)) {
      return; // Category already exists
    }

    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('org_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      const { error } = await supabase
        .from('help_categories')
        .insert({
          agent_id: agentId,
          org_id: agent.org_id,
          name,
          description,
          order_index: categories.length,
        });

      if (error) throw error;

      setCategories(prev => [...prev, { name, description }]);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (oldName: string, newName: string, description: string) => {
    try {
      const { error } = await supabase
        .from('help_categories')
        .update({ name: newName, description })
        .eq('agent_id', agentId)
        .eq('name', oldName);

      if (error) throw error;

      // Update local state
      const updatedCategories = categories.map(cat =>
        cat.name === oldName ? { name: newName, description } : cat
      );
      setCategories(updatedCategories);

      // Update articles that use this category
      if (oldName !== newName) {
        const updatedArticles = articles.map(article =>
          article.category === oldName ? { ...article, category: newName } : article
        );
        setArticles(updatedArticles);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const removeCategory = async (name: string) => {
    // Only remove if no articles use this category
    const hasArticles = articles.some(article => article.category === name);
    if (hasArticles) return;

    try {
      const { error } = await supabase
        .from('help_categories')
        .delete()
        .eq('agent_id', agentId)
        .eq('name', name);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.name !== name));
    } catch (error) {
      console.error('Error removing category:', error);
      throw error;
    }
  };

  const importFromKnowledge = async (knowledgeSourceId: string) => {
    // TODO: Implement importing from knowledge sources
    // This would fetch content from a knowledge source and create articles
    setLoading(true);
    try {
      // Placeholder for future implementation
      console.log('Importing from knowledge source:', knowledgeSourceId);
    } finally {
      setLoading(false);
    }
  };

  const bulkImport = async (importedArticles: Array<Omit<HelpArticle, 'id' | 'order'>>) => {
    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('org_id')
        .eq('id', agentId)
        .single();

      if (!agent) throw new Error('Agent not found');

      // Get unique categories
      const uniqueCategories = [...new Set(importedArticles.map(a => a.category))];
      const categoryMap = new Map<string, string>();

      // Create categories
      for (const catName of uniqueCategories) {
        const existing = await supabase
          .from('help_categories')
          .select('id')
          .eq('agent_id', agentId)
          .eq('name', catName)
          .single();

        if (existing.data) {
          categoryMap.set(catName, existing.data.id);
        } else {
          const { data: newCat } = await supabase
            .from('help_categories')
            .insert({
              agent_id: agentId,
              org_id: agent.org_id,
              name: catName,
              description: '',
              order_index: categories.length + categoryMap.size,
            })
            .select()
            .single();

          if (newCat) categoryMap.set(catName, newCat.id);
        }
      }

      // Insert articles
      const articleInserts = importedArticles.map((article, index) => ({
        agent_id: agentId,
        org_id: agent.org_id,
        category_id: categoryMap.get(article.category)!,
        title: article.title,
        content: article.content,
        icon: article.icon,
        order_index: articles.length + index,
      }));

      const { data: newArticles } = await supabase
        .from('help_articles')
        .insert(articleInserts)
        .select();

      // Refresh data
      const { data: categoriesData } = await supabase
        .from('help_categories')
        .select('*')
        .eq('agent_id', agentId);

      const mappedArticles: HelpArticle[] = (newArticles || []).map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category: categoriesData?.find(c => c.id === article.category_id)?.name || '',
        icon: article.icon || undefined,
        order: article.order_index,
      }));

      setArticles(prev => [...prev, ...mappedArticles]);

      // Update categories
      uniqueCategories.forEach(cat => {
        if (!categories.some(c => c.name === cat)) {
          setCategories(prev => [...prev, { name: cat, description: '' }]);
        }
      });
    } catch (error) {
      console.error('Error bulk importing:', error);
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
    importFromKnowledge,
    bulkImport,
  };
};
