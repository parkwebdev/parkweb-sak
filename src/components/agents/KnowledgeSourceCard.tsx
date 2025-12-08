import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { File06, Link03, Database01, Trash01, RefreshCcw01, CheckCircle, XCircle, Clock, AlertCircle, Globe01 } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface KnowledgeSourceCardProps {
  source: Tables<'knowledge_sources'>;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  isOutdated?: boolean;
  childSources?: Tables<'knowledge_sources'>[];
}

const typeIcons = {
  pdf: File06,
  url: Link03,
  api: Database01,
  json: Database01,
  xml: Database01,
  csv: Database01,
};

const statusColors = {
  processing: 'secondary',
  ready: 'default',
  error: 'destructive',
} as const;

const statusIcons = {
  processing: Clock,
  ready: CheckCircle,
  error: XCircle,
};

export const KnowledgeSourceCard: React.FC<KnowledgeSourceCardProps> = ({
  source,
  onDelete,
  onReprocess,
  isOutdated = false,
  childSources = [],
}) => {
  const metadata = source.metadata as Record<string, any> || {};
  const isSitemap = metadata.is_sitemap === true;
  
  // Use Globe01 for sitemaps, otherwise use type-based icon
  const Icon = isSitemap ? Globe01 : (typeIcons[source.type as keyof typeof typeIcons] || Database01);
  const StatusIcon = statusIcons[source.status as keyof typeof statusIcons] || Clock;

  // Calculate sitemap progress from child sources
  const getSitemapProgress = () => {
    if (!isSitemap || childSources.length === 0) return null;
    
    const total = childSources.length;
    const ready = childSources.filter(s => s.status === 'ready').length;
    const errors = childSources.filter(s => s.status === 'error').length;
    const processing = childSources.filter(s => s.status === 'processing').length;
    const pending = childSources.filter(s => s.status === 'pending').length;
    
    return {
      total,
      ready,
      errors,
      processing,
      pending,
      percentage: total > 0 ? Math.round((ready / total) * 100) : 0,
      isComplete: pending === 0 && processing === 0,
    };
  };

  const progress = getSitemapProgress();

  const getDisplayName = () => {
    if (isSitemap) {
      try {
        return `Sitemap: ${new URL(source.source).hostname}`;
      } catch {
        return 'Sitemap';
      }
    }
    if (metadata.filename) return metadata.filename;
    if (source.type === 'url') {
      try {
        return new URL(source.source).hostname;
      } catch {
        return source.source;
      }
    }
    if (metadata.name) return metadata.name;
    return `${source.type.toUpperCase()} Source`;
  };

  const getContentPreview = () => {
    if (isSitemap) {
      const urlsFound = metadata.urls_found || 0;
      const childSitemaps = metadata.child_sitemaps || 0;
      if (childSitemaps > 0) {
        return `Found ${urlsFound} pages across ${childSitemaps} nested sitemaps`;
      }
      return `Found ${urlsFound} pages to crawl`;
    }
    if (source.content) {
      return source.content.substring(0, 150) + (source.content.length > 150 ? '...' : '');
    }
    if (source.type === 'url') {
      return source.source;
    }
    return 'No content preview available';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isSitemap ? 'bg-primary/10' : 'bg-accent'}`}>
              <Icon className={`h-5 w-5 ${isSitemap ? 'text-primary' : 'text-accent-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{getDisplayName()}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline">{isSitemap ? 'SITEMAP' : source.type.toUpperCase()}</Badge>
                {!isSitemap && (
                  <Badge variant={statusColors[source.status as keyof typeof statusColors] || 'secondary'}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {source.status}
                  </Badge>
                )}
                {isSitemap && progress && (
                  <Badge variant={progress.isComplete ? 'default' : 'secondary'}>
                    {progress.isComplete ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {progress.ready} pages indexed
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        {progress.ready}/{progress.total} pages
                      </>
                    )}
                  </Badge>
                )}
                {isSitemap && progress && progress.errors > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {progress.errors} failed
                  </Badge>
                )}
                {isOutdated && source.status === 'ready' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-warning border-warning">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Outdated
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This source uses an older embedding model. Click "Retrain AI" to update.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReprocess(source.id)}
              disabled={source.status === 'processing'}
            >
              <RefreshCcw01 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(source.id)}
            >
              <Trash01 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {/* Sitemap progress bar */}
          {isSitemap && progress && !progress.isComplete && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Processing pages...</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {progress.processing > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {progress.processing} processing
                  </span>
                )}
                {progress.pending > 0 && (
                  <span>{progress.pending} pending</span>
                )}
              </div>
            </div>
          )}
          
          <div>
            <span className="text-muted-foreground">Preview:</span>
            <p className="text-xs mt-1 text-muted-foreground">{getContentPreview()}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Added {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}</span>
              {!isSitemap && metadata.chunks_count && (
                <span className="text-primary font-medium">{metadata.chunks_count} chunks indexed</span>
              )}
            </div>
            {metadata.size && (
              <span>{(metadata.size / 1024).toFixed(2)} KB</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
