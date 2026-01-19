/**
 * Platform Help Center Hook
 * 
 * Fetches categories and articles from the database for the user-facing Help Center.
 * This makes the database the single source of truth for Help Center content.
 * 
 * @module hooks/usePlatformHelpCenter
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface PlatformHCArticle {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  icon_name: string | null;
  order_index: number | null;
  is_published: boolean | null;
}

export interface PlatformHCCategory {
  id: string;
  label: string;
  color: string;
  icon_name: string;
  order_index: number | null;
  articles: PlatformHCArticle[];
}

/**
 * Fetch all published Help Center categories and articles from the database
 */
export function usePlatformHelpCenter() {
  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['platform-hc-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_hc_categories')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch published articles
  const {
    data: articlesData,
    isLoading: articlesLoading,
    error: articlesError,
  } = useQuery({
    queryKey: ['platform-hc-articles', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_hc_articles')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Combine categories with their articles
  const categories = useMemo<PlatformHCCategory[]>(() => {
    if (!categoriesData || !articlesData) return [];

    return categoriesData.map((category) => ({
      id: category.id,
      label: category.label,
      color: category.color,
      icon_name: category.icon_name,
      order_index: category.order_index,
      articles: articlesData
        .filter((article) => article.category_id === category.id)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    }));
  }, [categoriesData, articlesData]);

  // Helper to get a category by ID
  const getCategoryById = (categoryId: string): PlatformHCCategory | undefined => {
    return categories.find((c) => c.id === categoryId);
  };

  // Helper to get an article by slug within a category
  const getArticleBySlug = (
    categoryId: string,
    slug: string
  ): PlatformHCArticle | undefined => {
    const category = getCategoryById(categoryId);
    return category?.articles.find((a) => a.slug === slug);
  };

  // Helper to get adjacent articles for navigation
  const getAdjacentArticles = (
    categoryId: string,
    slug: string
  ): {
    prev?: { category: PlatformHCCategory; article: PlatformHCArticle };
    next?: { category: PlatformHCCategory; article: PlatformHCArticle };
  } => {
    // Flatten all articles across categories
    const allArticles: { category: PlatformHCCategory; article: PlatformHCArticle }[] = [];
    for (const category of categories) {
      for (const article of category.articles) {
        allArticles.push({ category, article });
      }
    }

    // Find current article index
    const currentIndex = allArticles.findIndex(
      (item) => item.category.id === categoryId && item.article.slug === slug
    );

    return {
      prev: currentIndex > 0 ? allArticles[currentIndex - 1] : undefined,
      next: currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : undefined,
    };
  };

  // Get first article for default view
  const getFirstArticle = (): { category: PlatformHCCategory; article: PlatformHCArticle } | undefined => {
    if (categories.length === 0) return undefined;
    const firstCategory = categories[0];
    if (firstCategory.articles.length === 0) return undefined;
    return { category: firstCategory, article: firstCategory.articles[0] };
  };

  return {
    categories,
    isLoading: categoriesLoading || articlesLoading,
    error: categoriesError || articlesError,
    getCategoryById,
    getArticleBySlug,
    getAdjacentArticles,
    getFirstArticle,
  };
}
