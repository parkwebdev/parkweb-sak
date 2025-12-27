/**
 * TopPagesChart Component
 * 
 * Unified visualization combining horizontal bar chart with landing page data.
 * Shows page visits, average time, and conversions in tooltips.
 * @module components/analytics/TopPagesChart
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SkeletonHeatmap } from '@/components/ui/page-skeleton';
import { Users01 } from '@untitledui/icons';

interface TopPageData {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
}

interface TopPagesChartProps {
  data: TopPageData[];
  loading?: boolean;
}

type SortOption = 'visits' | 'conversions';

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};

const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (path === '/') return '/ (home)';
    if (path.endsWith('/')) path = path.slice(0, -1);
    return path.length > 35 ? path.substring(0, 32) + '...' : path;
  } catch {
    return url.length > 35 ? url.substring(0, 32) + '...' : url;
  }
};

export function TopPagesChart({ data, loading }: TopPagesChartProps) {
  const [sortBy, setSortBy] = useState<SortOption>('visits');

  const { maxValue, sortedData } = useMemo(() => {
    const sorted = [...data]
      .sort((a, b) => {
        if (sortBy === 'conversions') {
          return b.conversions - a.conversions || b.visits - a.visits;
        }
        return b.visits - a.visits;
      })
      .slice(0, 15);
    
    const max = Math.max(...sorted.map(d => sortBy === 'conversions' ? d.conversions : d.visits), 1);
    return { maxValue: max, sortedData: sorted };
  }, [data, sortBy]);

  const getIntensityClass = (value: number): string => {
    const ratio = value / maxValue;
    if (ratio > 0.8) return 'bg-primary/80 text-primary-foreground';
    if (ratio > 0.6) return 'bg-primary/60 text-primary-foreground';
    if (ratio > 0.4) return 'bg-primary/40 text-foreground';
    if (ratio > 0.2) return 'bg-primary/20 text-foreground';
    return 'bg-primary/10 text-foreground';
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
          <p className="text-sm text-muted-foreground">Most visited pages and their conversions</p>
        </CardHeader>
        <CardContent className="h-[400px]">
          <SkeletonHeatmap />
        </CardContent>
      </Card>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
          <p className="text-sm text-muted-foreground">Most visited pages and their conversions</p>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No page data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Most visited pages and their conversions</p>
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visits">By Visits</SelectItem>
              <SelectItem value="conversions">By Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedData.map((page, index) => {
            const primaryValue = sortBy === 'conversions' ? page.conversions : page.visits;
            const widthPercentage = (primaryValue / maxValue) * 100;
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="relative h-9 rounded-md overflow-hidden bg-muted/30 cursor-pointer group">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 transition-all duration-300",
                        getIntensityClass(primaryValue)
                      )}
                      style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-medium truncate z-10 max-w-[55%]">
                        {formatUrl(page.url)}
                      </span>
                      <div className="flex items-center gap-3 z-10">
                        {page.conversions > 0 && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Users01 size={12} />
                            {page.conversions}
                          </span>
                        )}
                        <span className="text-xs font-medium tabular-nums">
                          {page.visits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1.5">
                    <p className="font-medium text-xs break-all">{page.url}</p>
                    <div className="border-t border-border pt-1.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{page.visits.toLocaleString()}</span> visits
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{formatDuration(page.avgDuration)}</span> avg. time
                      </p>
                      {page.conversions > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-primary font-medium">{page.conversions}</span> leads generated
                        </p>
                      )}
                    </div>
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
}
