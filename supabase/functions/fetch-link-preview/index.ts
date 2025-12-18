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
  // Video fields
  videoType?: 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'twitter' | null;
  videoId?: string;
  embedUrl?: string;
  cardType?: string;
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

// Detect video platform and extract embed info
function detectVideoEmbed(url: string): { type: 'youtube' | 'vimeo' | 'loom' | 'wistia'; videoId: string; embedUrl: string } | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // YouTube patterns
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId: string | null = null;
      
      if (hostname.includes('youtu.be')) {
        videoId = pathname.slice(1).split('?')[0];
      } else if (pathname.includes('/watch')) {
        videoId = urlObj.searchParams.get('v');
      } else if (pathname.includes('/embed/')) {
        videoId = pathname.split('/embed/')[1]?.split('?')[0];
      } else if (pathname.includes('/shorts/')) {
        videoId = pathname.split('/shorts/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return {
          type: 'youtube',
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        };
      }
    }

    // Vimeo patterns
    if (hostname.includes('vimeo.com')) {
      let videoId: string | null = null;
      
      if (hostname.includes('player.vimeo.com')) {
        videoId = pathname.split('/video/')[1]?.split('?')[0];
      } else {
        // Regular vimeo.com/VIDEO_ID
        const match = pathname.match(/^\/(\d+)/);
        if (match) videoId = match[1];
      }
      
      if (videoId) {
        return {
          type: 'vimeo',
          videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
        };
      }
    }

    // Loom patterns
    if (hostname.includes('loom.com')) {
      const match = pathname.match(/\/share\/([a-zA-Z0-9]+)/);
      if (match) {
        return {
          type: 'loom',
          videoId: match[1],
          embedUrl: `https://www.loom.com/embed/${match[1]}?autoplay=1`,
        };
      }
    }

    // Wistia patterns
    if (hostname.includes('wistia.com') || hostname.includes('wi.st')) {
      const match = pathname.match(/\/medias\/([a-zA-Z0-9]+)/);
      if (match) {
        return {
          type: 'wistia',
          videoId: match[1],
          embedUrl: `https://fast.wistia.net/embed/iframe/${match[1]}?autoPlay=true`,
        };
      }
    }
  } catch {
    // Invalid URL
  }
  
  return null;
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

  // Try reverse twitter
  const twitterReverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${property}["']`, 'i');
  const twitterReverseMatch = html.match(twitterReverseRegex);
  if (twitterReverseMatch) return twitterReverseMatch[1];

  // Try regular meta name
  const nameRegex = new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const nameMatch = html.match(nameRegex);
  if (nameMatch) return nameMatch[1];

  return undefined;
}

// Extract Twitter card type
function extractTwitterCard(html: string): string | undefined {
  const patterns = [
    /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:card["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

// Extract twitter:player URL for video cards
function extractTwitterPlayer(html: string): string | undefined {
  const patterns = [
    /<meta[^>]+name=["']twitter:player["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:player["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
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

    // Check for video embed before fetching (saves network request for known video platforms)
    const videoEmbed = detectVideoEmbed(url);

    // For known video platforms, return preview data directly without fetching
    // This avoids rate limiting issues with YouTube, Vimeo, etc.
    if (videoEmbed) {
      const videoPreviewData: LinkPreviewData = {
        url,
        domain: getDomain(url),
        videoType: videoEmbed.type,
        videoId: videoEmbed.videoId,
        embedUrl: videoEmbed.embedUrl,
      };

      // Add platform-specific metadata
      if (videoEmbed.type === 'youtube') {
        videoPreviewData.siteName = 'YouTube';
        videoPreviewData.favicon = 'https://www.youtube.com/favicon.ico';
        // YouTube thumbnail URL pattern
        videoPreviewData.image = `https://i.ytimg.com/vi/${videoEmbed.videoId}/hqdefault.jpg`;
      } else if (videoEmbed.type === 'vimeo') {
        videoPreviewData.siteName = 'Vimeo';
        videoPreviewData.favicon = 'https://vimeo.com/favicon.ico';
      } else if (videoEmbed.type === 'loom') {
        videoPreviewData.siteName = 'Loom';
        videoPreviewData.favicon = 'https://www.loom.com/favicon.ico';
        videoPreviewData.image = `https://cdn.loom.com/sessions/thumbnails/${videoEmbed.videoId}-with-play.gif`;
      } else if (videoEmbed.type === 'wistia') {
        videoPreviewData.siteName = 'Wistia';
        videoPreviewData.favicon = 'https://wistia.com/favicon.ico';
      }

      console.log(`Video preview data generated:`, JSON.stringify(videoPreviewData, null, 2));

      return new Response(
        JSON.stringify(videoPreviewData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For non-video URLs, fetch the page to extract metadata
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
      cardType: extractTwitterCard(html),
    };

    // Check for twitter:player (video card) for non-standard video embeds
    const twitterPlayer = extractTwitterPlayer(html);
    if (twitterPlayer && previewData.cardType === 'player') {
      previewData.videoType = 'twitter';
      previewData.embedUrl = twitterPlayer;
    }

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
    
    // For network errors (DNS, connection, timeout), return minimal preview data
    // instead of an error so the UI can still show something useful
    const { url } = await req.clone().json().catch(() => ({ url: '' }));
    
    if (url) {
      const fallbackData: LinkPreviewData = {
        url,
        domain: getDomain(url),
      };
      
      console.log(`Returning fallback preview for unreachable URL:`, url);
      
      return new Response(
        JSON.stringify(fallbackData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch link preview' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
