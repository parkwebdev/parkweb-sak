/**
 * Knowledge Base Article Views Hook
 * 
 * Tracks article views and fetches popularity data for KB articles.
 * Uses session storage to prevent duplicate views within a session.
 * 
 * @module hooks/useKBArticleViews
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { getKBArticleBySlug, type KBArticle } from '@/config/knowledge-base-config';

/** Get or create a session ID for view tracking */
function getSessionId(): string {
  const key = 'kb_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/** Check if we've already recorded a view for this article in this session */
function hasViewedInSession(categoryId: string, articleSlug: string): boolean {
  const key = `kb_viewed_${categoryId}_${articleSlug}`;
  return sessionStorage.getItem(key) === 'true';
}

/** Mark article as viewed in this session */
function markViewedInSession(categoryId: string, articleSlug: string): void {
  const key = `kb_viewed_${categoryId}_${articleSlug}`;
  sessionStorage.setItem(key, 'true');
}

interface PopularArticle {
  article: KBArticle;
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
 * Hook to fetch popular articles for a category
 */
export function usePopularArticles(categoryId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: queryKeys.kb.popularity(categoryId ?? ''),
    queryFn: async (): Promise<PopularArticle[]> => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('kb_article_popularity')
        .select(`
          article_slug,
          category_id,
          view_count,
          unique_views
        `)
        .eq('category_id', categoryId)
        .limit(limit);
      
      if (error) throw error;
      
      // Map to articles with view counts
      const articles: PopularArticle[] = [];
      
      for (const row of data ?? []) {
        const article = getKBArticleBySlug(categoryId, row.article_slug as string);
        if (article) {
          articles.push({
            article,
            viewCount: (row.view_count as number) ?? 0,
            uniqueViews: (row.unique_views as number) ?? 0,
          });
        }
      }
      
      return articles;
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
