/**
 * SitemapChildPages Component
 * 
 * Paginated list of sitemap child pages with search and filter.
 * Shows status, chunk counts, and per-page retry/delete actions.
 * @module components/agents/SitemapChildPages
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, RefreshCcw01, Trash01, SearchMd, AlertCircle } from '@untitledui/icons';
import type { Tables } from '@/integrations/supabase/types';
import type { KnowledgeSourceMetadata } from '@/types/metadata';

interface SitemapChildPagesProps {
  childSources: Tables<'knowledge_sources'>[];
  onRetryChild: (id: string) => void;
  onDeleteChild: (id: string) => void;
}

const INITIAL_VISIBLE_COUNT = 10;

const statusIcons = {
  processing: Clock,
  ready: CheckCircle,
  error: XCircle,
  pending: Clock,
};

const statusColors = {
  processing: 'text-warning',
  ready: 'text-success',
  error: 'text-destructive',
  pending: 'text-muted-foreground',
};

export const SitemapChildPages: React.FC<SitemapChildPagesProps> = ({
  childSources,
  onRetryChild,
  onDeleteChild,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Filter and sort child sources
  const filteredSources = useMemo(() => {
    return childSources
      .filter(source => {
        // Status filter
        if (statusFilter !== 'all' && source.status !== statusFilter) {
          return false;
        }
        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return source.source.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by status priority: error first, then processing, then ready
        const statusOrder = { error: 0, processing: 1, pending: 2, ready: 3 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // Then by created date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [childSources, searchQuery, statusFilter]);

  const visibleSources = filteredSources.slice(0, visibleCount);
  const hasMore = filteredSources.length > visibleCount;
  const remainingCount = filteredSources.length - visibleCount;

  const getUrlPath = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || '/';
    } catch {
      return url;
    }
  };

  const getErrorMessage = (source: Tables<'knowledge_sources'>) => {
    const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
    return metadata.error || 'Unknown error';
  };

  const getChunkCount = (source: Tables<'knowledge_sources'>) => {
    const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
    return metadata.chunks_count || 0;
  };

  // Count by status for filter badges
  const statusCounts = useMemo(() => {
    const counts = { all: childSources.length, ready: 0, processing: 0, pending: 0, error: 0 };
    childSources.forEach(s => {
      if (s.status in counts) {
        counts[s.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [childSources]);

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchMd className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(INITIAL_VISIBLE_COUNT);
            }}
            className="pl-9 text-xs h-8"
          />
        </div>
        <Select 
          value={statusFilter} 
          onValueChange={(val) => {
            setStatusFilter(val);
            setVisibleCount(INITIAL_VISIBLE_COUNT);
          }}
        >
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="ready">Ready ({statusCounts.ready})</SelectItem>
            <SelectItem value="processing">Processing ({statusCounts.processing})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="error">Error ({statusCounts.error})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Page List */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {visibleSources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'No pages match your filters' 
              : 'No pages found'}
          </p>
        ) : (
          visibleSources.map((source) => {
            const StatusIcon = statusIcons[source.status as keyof typeof statusIcons] || Clock;
            const statusColor = statusColors[source.status as keyof typeof statusColors] || 'text-muted-foreground';
            const isError = source.status === 'error';
            const isProcessing = source.status === 'processing' || source.status === 'pending';
            const chunkCount = getChunkCount(source);

            return (
              <div 
                key={source.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 group"
              >
                {/* Status Icon */}
                <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
                
                {/* URL Path */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1 text-sm truncate text-foreground">
                      {getUrlPath(source.source)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[400px]">
                    <p className="break-all">{source.source}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Status/Info */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {source.status === 'ready' && chunkCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {chunkCount} chunks
                    </span>
                  )}
                  
                  {isError && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="text-xs h-5">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px]">
                        <p className="text-xs">{getErrorMessage(source)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {isProcessing && (
                    <span className="text-xs text-muted-foreground">
                      {source.status === 'processing' ? 'Processing...' : 'Pending'}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isError && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onRetryChild(source.id)}
                    >
                      <RefreshCcw01 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteChild(source.id)}
                  >
                    <Trash01 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setVisibleCount(prev => prev + INITIAL_VISIBLE_COUNT)}
        >
          Show More ({remainingCount} more)
        </Button>
      )}
    </div>
  );
};
