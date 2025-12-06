import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  domain: string;
}

// Extract domain from URL
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Extract meta tag content from HTML
function extractMetaContent(html: string, property: string): string | undefined {
  // Try og: property first
  const ogRegex = new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const ogMatch = html.match(ogRegex);
  if (ogMatch) return ogMatch[1];

  // Try reverse order (content before property)
  const ogReverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i');
  const ogReverseMatch = html.match(ogReverseRegex);
  if (ogReverseMatch) return ogReverseMatch[1];

  // Try twitter: property
  const twitterRegex = new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const twitterMatch = html.match(twitterRegex);
  if (twitterMatch) return twitterMatch[1];

  // Try regular meta name
  const nameRegex = new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const nameMatch = html.match(nameRegex);
  if (nameMatch) return nameMatch[1];

  return undefined;
}

// Extract title from HTML
function extractTitle(html: string): string | undefined {
  // Try og:title first
  const ogTitle = extractMetaContent(html, 'title');
  if (ogTitle) return ogTitle;

  // Fallback to <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  return undefined;
}

// Extract favicon
function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Try various favicon patterns
  const patterns = [
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const faviconUrl = match[1];
      // Convert relative URLs to absolute
      if (faviconUrl.startsWith('//')) {
        return `https:${faviconUrl}`;
      } else if (faviconUrl.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}${faviconUrl}`;
      } else if (!faviconUrl.startsWith('http')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}/${faviconUrl}`;
      }
      return faviconUrl;
    }
  }

  // Default favicon path
  try {
    const urlObj = new URL(baseUrl);
    return `${urlObj.origin}/favicon.ico`;
  } catch {
    return undefined;
  }
}

// Resolve relative image URLs to absolute
function resolveImageUrl(imageUrl: string | undefined, baseUrl: string): string | undefined {
  if (!imageUrl) return undefined;
  
  if (imageUrl.startsWith('//')) {
    return `https:${imageUrl}`;
  } else if (imageUrl.startsWith('/')) {
    try {
      const urlObj = new URL(baseUrl);
      return `${urlObj.origin}${imageUrl}`;
    } catch {
      return imageUrl;
    }
  } else if (!imageUrl.startsWith('http')) {
    try {
      const urlObj = new URL(baseUrl);
      return `${urlObj.origin}/${imageUrl}`;
    } catch {
      return imageUrl;
    }
  }
  return imageUrl;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching link preview for: ${url}`);

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatPadBot/1.0; +https://chatpad.ai)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const finalUrl = response.url || url;

    // Extract Open Graph data
    const previewData: LinkPreviewData = {
      url: finalUrl,
      domain: getDomain(finalUrl),
      title: extractTitle(html),
      description: extractMetaContent(html, 'description'),
      image: resolveImageUrl(extractMetaContent(html, 'image'), finalUrl),
      siteName: extractMetaContent(html, 'site_name'),
      favicon: extractFavicon(html, finalUrl),
    };

    // Truncate description if too long
    if (previewData.description && previewData.description.length > 200) {
      previewData.description = previewData.description.substring(0, 197) + '...';
    }

    console.log(`Preview data extracted:`, JSON.stringify(previewData, null, 2));

    return new Response(
      JSON.stringify(previewData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching link preview:', error);
    
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch link preview' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
