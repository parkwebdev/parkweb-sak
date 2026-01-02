/**
 * Link Preview Utilities
 * Fetches OpenGraph-style previews for URLs in content.
 * 
 * @module _shared/utils/links
 * @description Provides URL extraction and preview fetching for rich link cards.
 * 
 * @example
 * ```typescript
 * import { fetchLinkPreviews } from "../_shared/utils/links.ts";
 * 
 * const previews = await fetchLinkPreviews(
 *   "Check out https://example.com",
 *   supabaseUrl,
 *   supabaseKey
 * );
 * ```
 */

import { URL_REGEX } from "../types.ts";

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  videoType?: string;
  siteName?: string;
}

/**
 * Fetch link previews for URLs in content (max 3).
 * Uses the fetch-link-preview edge function for OpenGraph parsing.
 * 
 * @param content - Text content containing URLs
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase anon key
 * @returns Array of link preview objects
 */
export async function fetchLinkPreviews(
  content: string, 
  supabaseUrl: string, 
  supabaseKey: string
): Promise<LinkPreview[]> {
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 3);
  if (urls.length === 0) return [];
  
  console.log(`Fetching link previews for ${urls.length} URLs`);
  
  const previews = await Promise.all(
    urls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-link-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Failed to fetch preview for ${url}: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        // Only include valid previews (has title or is video)
        if (data && (data.title || data.videoType)) {
          return { url, ...data } as LinkPreview;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching preview for ${url}:`, (error as Error).message);
        return null;
      }
    })
  );
  
  return previews.filter((p): p is LinkPreview => p !== null);
}

/**
 * Extract URLs from content without fetching previews.
 * Useful for quick URL detection.
 * 
 * @param content - Text content to search
 * @returns Array of unique URLs (max 3)
 */
export function extractUrls(content: string): string[] {
  return Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 3);
}
