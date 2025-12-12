/**
 * KnowledgeSourceCard Component
 * 
 * Card display for a knowledge source with status, progress, and actions.
 * Supports sitemaps with expandable child pages and progress tracking.
 * @module components/agents/KnowledgeSourceCard
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { File06, Link03, Database01, Trash01, RefreshCcw01, CheckCircle, XCircle, Clock, AlertCircle, Globe01, ChevronDown, ChevronUp } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { SitemapChildPages } from './SitemapChildPages';
import type { Tables } from '@/integrations/supabase/types';
import type { KnowledgeSourceMetadata } from '@/types/metadata';

interface KnowledgeSourceCardProps {
  source: Tables<'knowledge_sources'>;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  onResume?: (id: string) => void;
  onRetryChild?: (id: string) => void;
  onDeleteChild?: (id: string) => void;
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
  onResume,
  onRetryChild,
  onDeleteChild,
  isOutdated = false,
  childSources = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
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
    
    // Check if processing appears stalled (has pending/processing but no recent activity)
    const lastProgressAt = metadata.last_progress_at;
    const isStalled = (pending > 0 || processing > 0) && lastProgressAt && 
      (Date.now() - new Date(lastProgressAt).getTime() > 60000); // Stalled if no progress for 1 minute
    
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
    return 'No content preview available';
  };

  const showChildPages = isSitemap && childSources.length > 0 && onRetryChild && onDeleteChild;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
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
                  <span>{progress.isStalled ? 'Processing stalled' : 'Processing pages...'}</span>
                  <span>{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} variant="success" animated={progress.percentage < 100} className="h-2" />
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
                  {progress.isStalled && onResume && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResume(source.id)}
                      className="h-6 text-xs"
                    >
                      <RefreshCcw01 className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* Sitemap info - show page count and status */}
            {isSitemap && (
              <p className="text-xs text-muted-foreground">{getContentPreview()}</p>
            )}
            
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

            {/* View Pages Toggle for Sitemaps */}
            {showChildPages && (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide Pages
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      View Pages ({childSources.length})
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            )}

            {/* Expandable Child Pages Section */}
            {showChildPages && (
              <CollapsibleContent>
                <SitemapChildPages
                  childSources={childSources}
                  onRetryChild={onRetryChild}
                  onDeleteChild={onDeleteChild}
                />
              </CollapsibleContent>
            )}
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
