/**
 * KnowledgeDetailsSheet Component
 * 
 * Sheet for viewing knowledge source details with status, progress, and actions.
 * Follows the LocationDetailsSheet pattern with deferred content mounting.
 * 
 * @module components/agents/knowledge/KnowledgeDetailsSheet
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  File06, Link03, Database01, Trash01, RefreshCcw01, CheckCircle, XCircle, 
  Clock, AlertCircle, Globe01, Building07, Calendar, RefreshCw01, LinkExternal01
} from '@untitledui/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { SitemapChildPages } from '../SitemapChildPages';
import { SkeletonKnowledgeDetails } from '@/components/ui/page-skeleton';
import type { Tables } from '@/integrations/supabase/types';
import type { KnowledgeSourceMetadata, RefreshStrategy, KnowledgeSourceType } from '@/types/metadata';
import { REFRESH_STRATEGY_LABELS, SOURCE_TYPE_LABELS } from '@/types/metadata';

type KnowledgeSource = Tables<'knowledge_sources'>;

interface KnowledgeDetailsSheetProps {
  source: KnowledgeSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  onResume?: (id: string) => void;
  onRefreshNow?: (id: string) => void;
  onRetryChild?: (id: string) => void;
  onDeleteChild?: (id: string) => void;
  isOutdated?: boolean;
  childSources?: KnowledgeSource[];
  propertyCount?: number;
  chunkCount?: number;
  locationName?: string;
}

/**
 * Type icons mapping
 */
const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: File06,
  url: Link03,
  api: Database01,
  json: Database01,
  xml: Database01,
  csv: Database01,
};

/**
 * Status badge variants
 */
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ready: 'default',
  processing: 'secondary',
  pending: 'secondary',
  error: 'destructive',
};

/**
 * Status icons mapping
 */
const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ready: CheckCircle,
  processing: Clock,
  pending: Clock,
  error: XCircle,
};

export const KnowledgeDetailsSheet: React.FC<KnowledgeDetailsSheetProps> = ({
  source,
  open,
  onOpenChange,
  onDelete,
  onReprocess,
  onResume,
  onRefreshNow,
  onRetryChild,
  onDeleteChild,
  isOutdated = false,
  childSources = [],
  propertyCount,
  chunkCount,
  locationName,
}) => {
  // Defer content mounting until after sheet animation starts
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [open]);

  // Source metadata and type detection
  const metadata = useMemo(() => {
    if (!source) return {} as KnowledgeSourceMetadata;
    return (source.metadata || {}) as KnowledgeSourceMetadata;
  }, [source]);

  const sourceType = useMemo(() => {
    if (!source) return 'url';
    return source.source_type || (metadata.is_sitemap ? 'sitemap' : 'url');
  }, [source, metadata]);

  const isSitemap = sourceType === 'sitemap' || metadata.is_sitemap;
  const isPropertyListing = sourceType === 'property_listings' || sourceType === 'property_feed';
  const isWordPressHome = sourceType === 'wordpress_home';

  // Refresh strategy info
  const refreshStrategy = (source?.refresh_strategy || 'manual') as RefreshStrategy;
  const lastFetchedAt = source?.last_fetched_at;
  const nextRefreshAt = source?.next_refresh_at;

  // Get appropriate icon
  const Icon = isWordPressHome || isPropertyListing 
    ? Building07 
    : isSitemap 
      ? Globe01 
      : (source ? typeIcons[source.type] || Link03 : Link03);

  // Calculate sitemap progress
  const sitemapProgress = useMemo(() => {
    if (!isSitemap || childSources.length === 0) return null;
    
    const total = childSources.length;
    const ready = childSources.filter(s => s.status === 'ready').length;
    const errors = childSources.filter(s => s.status === 'error').length;
    const processing = childSources.filter(s => s.status === 'processing').length;
    const pending = childSources.filter(s => s.status === 'pending').length;
    
    // Check if processing appears stalled
    const lastProgressAt = metadata.last_progress_at;
    const isStalled = (pending > 0 || processing > 0) && lastProgressAt && 
      (Date.now() - new Date(lastProgressAt).getTime() > 60000);
    
    return {
      total,
      ready,
      errors,
      processing,
      pending,
      percentage: total > 0 ? Math.round((ready / total) * 100) : 0,
      isComplete: pending === 0 && processing === 0,
      isStalled,
    };
  }, [isSitemap, childSources, metadata.last_progress_at]);

  // Display name
  const displayName = useMemo(() => {
    if (!source) return 'Knowledge Source';
    
    if (isWordPressHome) {
      return source.source.replace('WordPress: ', 'WordPress Homes: ');
    }
    if (isPropertyListing) {
      try {
        return `Properties: ${new URL(source.source).hostname}`;
      } catch {
        return 'Property Listings';
      }
    }
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
  }, [source, isWordPressHome, isPropertyListing, isSitemap, metadata]);

  if (!source) return null;

  const StatusIcon = statusIcons[source.status] || Clock;
  const statusVariant = statusVariants[source.status] || 'secondary';
  const isProcessing = source.status === 'processing' || source.status === 'pending';
  // Child pages section renders inline with type narrowing preserved

  // Effective chunk count
  const effectiveChunkCount = chunkCount ?? metadata.chunks_count ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${isWordPressHome || isPropertyListing || isSitemap ? 'bg-primary/10' : 'bg-accent'}`}>
              <Icon className={`h-5 w-5 ${isWordPressHome || isPropertyListing || isSitemap ? 'text-primary' : 'text-accent-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate">{displayName}</SheetTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={statusVariant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  <span className="capitalize">{source.status}</span>
                </Badge>
                {isOutdated && source.status === 'ready' && (
                  <Badge variant="outline" className="gap-1 border-warning text-warning">
                    <AlertCircle className="h-3 w-3" />
                    Outdated
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {!contentReady ? (
          <SkeletonKnowledgeDetails />
        ) : (
          <div className="space-y-6">
            {/* Source Info Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Source Information</h3>
              
              <div className="space-y-2">
                {/* Full URL */}
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">URL</span>
                  <a 
                    href={source.source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all flex items-center gap-1"
                  >
                    {source.source}
                    <LinkExternal01 className="h-3 w-3 shrink-0" />
                  </a>
                </div>

                {/* Source Type */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">Type</span>
                  <Badge variant="outline">
                    {SOURCE_TYPE_LABELS[sourceType as KnowledgeSourceType] || source.type.toUpperCase()}
                  </Badge>
                </div>

                {/* Location */}
                {locationName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">Location</span>
                    <span className="text-sm">{locationName}</span>
                  </div>
                )}

                {/* Date Added */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">Added</span>
                  <span className="text-sm">
                    {format(new Date(source.created_at), 'PPp')}
                    <span className="text-muted-foreground ml-1">
                      ({formatDistanceToNow(new Date(source.created_at), { addSuffix: true })})
                    </span>
                  </span>
                </div>

                {/* Last Fetched */}
                {lastFetchedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">Last Fetched</span>
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDistanceToNow(new Date(lastFetchedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {/* Refresh Strategy */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">Refresh</span>
                  <span className="text-sm flex items-center gap-1">
                    {refreshStrategy !== 'manual' && <RefreshCw01 className="h-3 w-3 text-muted-foreground" />}
                    {REFRESH_STRATEGY_LABELS[refreshStrategy]}
                    {nextRefreshAt && refreshStrategy !== 'manual' && (
                      <span className="text-muted-foreground">
                        (next: {formatDistanceToNow(new Date(nextRefreshAt), { addSuffix: true })})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Status Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Processing Status</h3>

              {/* Sitemap Progress */}
              {isSitemap && sitemapProgress && !sitemapProgress.isComplete && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={sitemapProgress.isStalled ? 'text-warning' : 'text-muted-foreground'}>
                      {sitemapProgress.isStalled ? 'Processing stalled' : 'Processing pages...'}
                    </span>
                    <span className="font-medium">{sitemapProgress.percentage}%</span>
                  </div>
                  <Progress 
                    value={sitemapProgress.percentage} 
                    variant="success" 
                    animated={sitemapProgress.percentage < 100} 
                    className="h-2" 
                  />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-success">{sitemapProgress.ready} ready</span>
                    {sitemapProgress.processing > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sitemapProgress.processing} processing
                      </span>
                    )}
                    {sitemapProgress.pending > 0 && (
                      <span>{sitemapProgress.pending} pending</span>
                    )}
                    {sitemapProgress.errors > 0 && (
                      <span className="text-destructive">{sitemapProgress.errors} failed</span>
                    )}
                  </div>
                  {sitemapProgress.isStalled && onResume && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResume(source.id)}
                      className="h-7 text-xs"
                    >
                      <RefreshCcw01 className="h-3 w-3 mr-1" />
                      Resume Processing
                    </Button>
                  )}
                </div>
              )}

              {/* Error Display */}
              {source.status === 'error' && metadata.error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">Processing Failed</p>
                      <p className="text-xs text-muted-foreground">{metadata.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Outdated Warning */}
              {isOutdated && source.status === 'ready' && (
                <div className="p-3 rounded-md bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-warning">Needs Reprocessing</p>
                        <p className="text-xs text-muted-foreground">
                          This source uses an older embedding model. Reprocess to use the latest model for better AI responses.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReprocess(source.id)}
                        className="h-7 text-xs"
                      >
                        <RefreshCcw01 className="h-3 w-3 mr-1" />
                        Reprocess Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State for Non-Sitemap */}
              {!isSitemap && source.status === 'ready' && !isOutdated && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  Successfully indexed and ready
                </div>
              )}
            </section>

            <Separator />

            {/* Statistics Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Chunks Count */}
                {!isSitemap && !isPropertyListing && !isWordPressHome && (
                  <div className="p-3 rounded-md bg-accent/50">
                    <p className="text-xs text-muted-foreground">Chunks Indexed</p>
                    <p className="text-lg font-semibold">{effectiveChunkCount}</p>
                  </div>
                )}

                {/* Sitemap Pages */}
                {isSitemap && sitemapProgress && (
                  <>
                    <div className="p-3 rounded-md bg-accent/50">
                      <p className="text-xs text-muted-foreground">Pages Ready</p>
                      <p className="text-lg font-semibold">{sitemapProgress.ready}</p>
                    </div>
                    <div className="p-3 rounded-md bg-accent/50">
                      <p className="text-xs text-muted-foreground">Total Pages</p>
                      <p className="text-lg font-semibold">{sitemapProgress.total}</p>
                    </div>
                  </>
                )}

                {/* Property Count */}
                {(isPropertyListing || isWordPressHome) && propertyCount !== undefined && (
                  <div className="p-3 rounded-md bg-accent/50">
                    <p className="text-xs text-muted-foreground">
                      {isWordPressHome ? 'Homes Synced' : 'Properties'}
                    </p>
                    <p className="text-lg font-semibold">{propertyCount}</p>
                  </div>
                )}

                {/* File Size */}
                {metadata.size && (
                  <div className="p-3 rounded-md bg-accent/50">
                    <p className="text-xs text-muted-foreground">File Size</p>
                    <p className="text-lg font-semibold">{(metadata.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}

                {/* URLs Found (for sitemaps) */}
                {isSitemap && metadata.urls_found && (
                  <div className="p-3 rounded-md bg-accent/50">
                    <p className="text-xs text-muted-foreground">URLs Found</p>
                    <p className="text-lg font-semibold">{metadata.urls_found}</p>
                  </div>
                )}
              </div>
            </section>

          {/* Sitemap Child Pages Section */}
          {isSitemap && childSources.length > 0 && onRetryChild && onDeleteChild && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pages ({childSources.length})
                </h3>
                <SitemapChildPages
                  childSources={childSources}
                  onRetryChild={onRetryChild}
                  onDeleteChild={onDeleteChild}
                />
              </section>
            </>
          )}

            <Separator />

            {/* Actions Footer */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
              
              <div className="flex flex-wrap gap-2">
                {/* Refresh Now (for auto-refresh sources) */}
                {refreshStrategy !== 'manual' && onRefreshNow && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRefreshNow(source.id)}
                        disabled={isProcessing}
                      >
                        <RefreshCw01 className="h-4 w-4 mr-2" />
                        Refresh Now
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fetch latest content from source</TooltipContent>
                  </Tooltip>
                )}

                {/* Reprocess */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReprocess(source.id)}
                      disabled={isProcessing}
                    >
                      <RefreshCcw01 className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                      {isProcessing ? 'Processing...' : 'Reprocess'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Re-fetch and re-index this source</TooltipContent>
                </Tooltip>

                {/* Delete */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        onDelete(source.id);
                        onOpenChange(false);
                      }}
                    >
                      <Trash01 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Permanently delete this source</TooltipContent>
                </Tooltip>
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
