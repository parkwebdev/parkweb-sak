import { useState, useEffect, useRef } from 'react';
import { LinkPreviewCard, LinkPreviewData } from './LinkPreviewCard';
import { supabase } from '@/integrations/supabase/client';

// URL regex that matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Simple in-memory cache for link previews
const previewCache = new Map<string, LinkPreviewData | null>();

interface LinkPreviewsProps {
  content: string;
  compact?: boolean;
}

export function LinkPreviews({ content, compact = false }: LinkPreviewsProps) {
  const [previews, setPreviews] = useState<(LinkPreviewData | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  // Extract unique URLs from content
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 3); // Max 3 previews

  useEffect(() => {
    if (urls.length === 0 || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchPreviews = async () => {
      setLoading(true);
      
      const results = await Promise.all(
        urls.map(async (url) => {
          // Check cache first
          if (previewCache.has(url)) {
            return previewCache.get(url) || null;
          }

          try {
            const { data, error } = await supabase.functions.invoke('fetch-link-preview', {
              body: { url }
            });

            if (error || !data || data.error) {
              previewCache.set(url, null);
              return null;
            }

            previewCache.set(url, data);
            return data as LinkPreviewData;
          } catch {
            previewCache.set(url, null);
            return null;
          }
        })
      );

      setPreviews(results);
      setLoading(false);
    };

    fetchPreviews();
  }, [content]);

  // Don't render anything if no URLs or all failed
  if (urls.length === 0) return null;
  
  const validPreviews = previews.filter((p): p is LinkPreviewData => p !== null && !!p.title);
  
  if (loading) {
    return (
      <div className="mt-2 space-y-2">
        {urls.slice(0, 1).map((url, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (validPreviews.length === 0) return null;

  return (
    <div className="space-y-2">
      {validPreviews.map((preview, i) => (
        <LinkPreviewCard key={i} data={preview} compact={compact} />
      ))}
    </div>
  );
}
