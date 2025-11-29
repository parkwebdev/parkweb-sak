import { useState, useEffect } from 'react';
import type { HelpArticle } from './useEmbeddedChatConfig';

export const useHelpArticles = (agentId: string) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load articles and categories from localStorage
  useEffect(() => {
    const storedArticles = localStorage.getItem(`help_articles_${agentId}`);
    const storedCategories = localStorage.getItem(`help_categories_${agentId}`);
    
    if (storedArticles) {
      try {
        setArticles(JSON.parse(storedArticles));
      } catch (error) {
        console.error('Error loading help articles:', error);
      }
    }
    
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (error) {
        console.error('Error loading help categories:', error);
      }
    }
  }, [agentId]);

  // Save articles to localStorage whenever they change
  useEffect(() => {
    if (articles.length > 0) {
      localStorage.setItem(`help_articles_${agentId}`, JSON.stringify(articles));
    }
  }, [articles, agentId]);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(`help_categories_${agentId}`, JSON.stringify(categories));
    }
  }, [categories, agentId]);

  const addArticle = (article: Omit<HelpArticle, 'id' | 'order'>) => {
    const newArticle: HelpArticle = {
      ...article,
      id: `article-${Date.now()}`,
      order: articles.length,
    };
    setArticles(prev => [...prev, newArticle]);
    
    // Add category if it doesn't exist
    if (!categories.includes(article.category)) {
      setCategories(prev => [...prev, article.category]);
    }
  };

  const updateArticle = (id: string, updates: Partial<HelpArticle>) => {
    setArticles(prev => prev.map(article => 
      article.id === id ? { ...article, ...updates } : article
    ));
    
    // Update categories if category changed
    if (updates.category && !categories.includes(updates.category)) {
      setCategories(prev => [...prev, updates.category]);
    }
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(article => article.id !== id));
  };

  const reorderArticles = (reorderedArticles: HelpArticle[]) => {
    setArticles(reorderedArticles.map((article, index) => ({
      ...article,
      order: index,
    })));
  };

  const addCategory = (name: string) => {
    if (!categories.includes(name)) {
      setCategories(prev => [...prev, name]);
    }
  };

  const removeCategory = (name: string) => {
    // Only remove if no articles use this category
    const hasArticles = articles.some(article => article.category === name);
    if (!hasArticles) {
      setCategories(prev => prev.filter(cat => cat !== name));
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

  const bulkImport = (importedArticles: Array<Omit<HelpArticle, 'id' | 'order'>>) => {
    const newArticles: HelpArticle[] = importedArticles.map((article, index) => ({
      ...article,
      id: `article-${Date.now()}-${index}`,
      order: articles.length + index,
    }));
    
    setArticles(prev => [...prev, ...newArticles]);
    
    // Add new categories
    const newCategories = [...new Set(importedArticles.map(a => a.category))];
    newCategories.forEach(cat => {
      if (!categories.includes(cat)) {
        setCategories(prev => [...prev, cat]);
      }
    });
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
    removeCategory,
    importFromKnowledge,
    bulkImport,
  };
};
