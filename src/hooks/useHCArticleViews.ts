/**
 * Help Center Article Views Hook
 * 
 * Tracks article views and fetches popularity data for HC articles.
 * Uses session storage to prevent duplicate views within a session.
 * 
 * @module hooks/useHCArticleViews
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';

/** Get or create a session ID for view tracking */
function getSessionId(): string {
  const key = 'hc_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/** Check if we've already recorded a view for this article in this session */
function hasViewedInSession(categoryId: string, articleSlug: string): boolean {
  const key = `hc_viewed_${categoryId}_${articleSlug}`;
  return sessionStorage.getItem(key) === 'true';
}

/** Mark article as viewed in this session */
function markViewedInSession(categoryId: string, articleSlug: string): void {
  const key = `hc_viewed_${categoryId}_${articleSlug}`;
  sessionStorage.setItem(key, 'true');
}

interface PopularArticle {
  id: string;
  slug: string;
  title: string;
  viewCount: number;
  uniqueViews: number;
}

/**
 * Hook to record article views
 * Returns a function to record a view (automatically debounced per session)
 */
export function useRecordArticleView() {
  const pendingRef = useRef<Set<string>>(new Set());
  
  const recordView = useCallback(async (categoryId: string, articleSlug: string) => {
    const viewKey = `${categoryId}:${articleSlug}`;
    
    // Skip if already viewed this session or pending
    if (hasViewedInSession(categoryId, articleSlug) || pendingRef.current.has(viewKey)) {
      return;
    }
    
    pendingRef.current.add(viewKey);
    
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('kb_article_views')
        .upsert({
          category_id: categoryId,
          article_slug: articleSlug,
          session_id: sessionId,
          user_id: user?.id ?? null,
        }, {
          onConflict: 'category_id,article_slug,session_id',
          ignoreDuplicates: true,
        });
      
      if (!error) {
        markViewedInSession(categoryId, articleSlug);
      }
    } catch {
      // Silently fail - view tracking is not critical
    } finally {
      pendingRef.current.delete(viewKey);
    }
  }, []);
  
  return recordView;
}

/**
 * Hook to fetch popular articles for a category (from database)
 */
export function usePopularArticles(categoryId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: queryKeys.hc.popularity(categoryId ?? ''),
    queryFn: async (): Promise<PopularArticle[]> => {
      if (!categoryId) return [];
      
      // First get popularity data
      const { data: popularityData, error: popError } = await supabase
        .from('kb_article_popularity')
        .select(`
          article_slug,
          category_id,
          view_count,
          unique_views
        `)
        .eq('category_id', categoryId)
        .limit(limit);
      
      if (popError) throw popError;
      if (!popularityData?.length) return [];
      
      // Then fetch the actual articles from the database
      const slugs = popularityData.map(p => p.article_slug).filter((s): s is string => s !== null);
      if (!slugs.length) return [];
      
      const { data: articles, error: articlesError } = await supabase
        .from('platform_hc_articles')
        .select('id, slug, title')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .in('slug', slugs);
      
      if (articlesError) throw articlesError;
      
      // Map articles with their view counts
      const articleMap = new Map(articles?.map(a => [a.slug, a]) ?? []);
      const result: PopularArticle[] = [];
      
      for (const row of popularityData) {
        const article = articleMap.get(row.article_slug as string);
        if (article) {
          result.push({
            id: article.id,
            slug: article.slug,
            title: article.title,
            viewCount: (row.view_count as number) ?? 0,
            uniqueViews: (row.unique_views as number) ?? 0,
          });
        }
      }
      
      return result;
    },
    enabled: !!categoryId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook that automatically records a view when mounted
 */
export function useTrackArticleView(categoryId: string | undefined, articleSlug: string | undefined) {
  const recordView = useRecordArticleView();
  
  useEffect(() => {
    if (categoryId && articleSlug) {
      recordView(categoryId, articleSlug);
    }
  }, [categoryId, articleSlug, recordView]);
}
