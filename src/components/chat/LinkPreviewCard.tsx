import { useState } from 'react';
import { Globe02, LinkExternal01 } from '@untitledui/icons';

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  domain: string;
}

interface LinkPreviewCardProps {
  data: LinkPreviewData;
  compact?: boolean;
}

export function LinkPreviewCard({ data, compact = false }: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const hasImage = data.image && !imageError;

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
            src={data.image}
            alt={data.title || 'Link preview'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="p-3 space-y-1">
        {/* Domain with favicon */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {data.favicon && !faviconError ? (
            <img
              src={data.favicon}
              alt=""
              className="w-3.5 h-3.5 rounded-sm"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe02 className="w-3.5 h-3.5" />
          )}
          <span className="truncate">{data.siteName || data.domain}</span>
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
