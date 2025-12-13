/**
 * PageVisitHeatmap Component
 * 
 * Heatmap visualization of page visits by hour and day.
 * Shows traffic patterns with color intensity.
 * @module components/analytics/PageVisitHeatmap
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageVisitData {
  url: string;
  totalVisits: number;
  totalDuration: number;
  agentName?: string;
}

interface PageVisitHeatmapProps {
  data: PageVisitData[];
  loading?: boolean;
}

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};

const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (path === '/') return '/ (home)';
    // Remove trailing slash
    if (path.endsWith('/')) path = path.slice(0, -1);
    // Truncate if too long
    return path.length > 30 ? path.substring(0, 27) + '...' : path;
  } catch {
    return url.length > 30 ? url.substring(0, 27) + '...' : url;
  }
};

export const PageVisitHeatmap: React.FC<PageVisitHeatmapProps> = ({ data, loading }) => {
  // Calculate intensity based on visits relative to max
  const { maxVisits, sortedData } = useMemo(() => {
    const max = Math.max(...data.map(d => d.totalVisits), 1);
    const sorted = [...data].sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 15);
    return { maxVisits: max, sortedData: sorted };
  }, [data]);

  const getIntensityClass = (visits: number): string => {
    const ratio = visits / maxVisits;
    if (ratio > 0.8) return 'bg-primary/80 text-primary-foreground';
    if (ratio > 0.6) return 'bg-primary/60 text-primary-foreground';
    if (ratio > 0.4) return 'bg-primary/40 text-foreground';
    if (ratio > 0.2) return 'bg-primary/20 text-foreground';
    return 'bg-primary/10 text-foreground';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Visit Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <span 
            className="text-muted-foreground text-sm"
            role="status"
            aria-live="polite"
          >
            Loading...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Visit Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No page visit data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Page Visit Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedData.map((page, index) => {
            const widthPercentage = (page.totalVisits / maxVisits) * 100;
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="relative h-9 rounded-md overflow-hidden bg-muted/30 cursor-pointer">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 transition-all duration-300",
                        getIntensityClass(page.totalVisits)
                      )}
                      style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-medium truncate z-10 max-w-[60%]">
                        {formatUrl(page.url)}
                      </span>
                      <div className="flex items-center gap-2 z-10">
                        {page.agentName && (
                          <Badge variant="secondary" size="sm" className="px-1.5 py-0">
                            {page.agentName}
                          </Badge>
                        )}
                        <span className="text-xs font-medium">{page.totalVisits}</span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-xs break-all">{page.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {page.totalVisits} visits • {formatDuration(page.totalDuration)} total time
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/40" />
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/80" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
