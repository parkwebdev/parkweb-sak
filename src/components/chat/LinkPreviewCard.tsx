import { useState, useMemo } from 'react';
import { Globe02, LinkExternal01 } from '@untitledui/icons';
import { VideoEmbed } from './VideoEmbed';

const SUPABASE_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co';

// Domains that don't need proxying (CDNs, known image hosts)
const DIRECT_IMAGE_DOMAINS = [
  'youtube.com', 'ytimg.com', 'yt3.ggpht.com',
  'vimeo.com', 'vimeocdn.com',
  'twitter.com', 'twimg.com',
  'facebook.com', 'fbcdn.net',
  'imgur.com', 'i.imgur.com',
  'cloudinary.com', 'res.cloudinary.com',
  'unsplash.com', 'images.unsplash.com',
];

function getProxiedImageUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const domain = url.hostname.replace(/^www\./, '');
    
    // Check if domain or parent domain is in the allow list
    const isDirect = DIRECT_IMAGE_DOMAINS.some(d => 
      domain === d || domain.endsWith(`.${d}`)
    );
    
    if (isDirect) {
      return imageUrl;
    }
    
    // Use proxy for all other domains
    return `${SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  } catch {
    return imageUrl;
  }
}

export interface LinkPreviewData {
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

interface LinkPreviewCardProps {
  data: LinkPreviewData;
  compact?: boolean;
}

export function LinkPreviewCard({ data, compact = false }: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  // Proxy external images to avoid CORS/hotlinking issues
  const proxiedImageUrl = useMemo(() => 
    data.image ? getProxiedImageUrl(data.image) : undefined,
  [data.image]);

  // Proxy favicons to avoid CSP img-src violations
  const proxiedFaviconUrl = useMemo(() => 
    data.favicon ? getProxiedImageUrl(data.favicon) : undefined,
  [data.favicon]);

  const hasImage = proxiedImageUrl && !imageError;

  // If this is a video link, render VideoEmbed instead
  if (data.videoType && data.embedUrl && !compact) {
    return (
      <div className="mt-2">
        <VideoEmbed 
          embedUrl={data.embedUrl}
          videoType={data.videoType}
          title={data.title}
          thumbnail={data.image}
        />
        {/* Show title below video as clickable link */}
        {data.title && (
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block mt-2 text-sm font-medium hover:underline line-clamp-1"
          >
            {data.title}
          </a>
        )}
      </div>
    );
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors overflow-hidden group"
    >
      {/* Image - only show if available and not compact */}
      {hasImage && !compact && (
        <div className="relative w-full h-32 bg-muted overflow-hidden">
          <img
            src={proxiedImageUrl}
            alt={data.title || 'Link preview'}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="p-3 space-y-1">
        {/* Domain with favicon */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          {proxiedFaviconUrl && !faviconError ? (
            <img
              src={proxiedFaviconUrl}
              alt=""
              className="w-3.5 h-3.5 rounded-sm"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe02 className="w-3.5 h-3.5" />
          )}
          <span className="truncate min-w-0">{data.siteName || data.domain}</span>
          <LinkExternal01 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
        </div>

        {/* Title */}
        {data.title && (
          <h4 className="text-sm font-medium leading-snug line-clamp-2">
            {data.title}
          </h4>
        )}

        {/* Description - hide in compact mode */}
        {data.description && !compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
