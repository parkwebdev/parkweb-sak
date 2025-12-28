/**
 * TopPagesChart Component
 * 
 * Clean horizontal bar chart for top landing pages.
 * Features gradient color scheme, conversion rate display, and sorting options.
 * @module components/analytics/TopPagesChart
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonHeatmap } from '@/components/ui/page-skeleton';
import { ChartCardHeader } from './ChartCardHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

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

type SortOption = 'visits' | 'conversions' | 'conversion_rate';

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
    if (path === '/') return 'Home';
    if (path.endsWith('/')) path = path.slice(0, -1);
    // Remove leading slash and capitalize first letter
    path = path.substring(1);
    const formatted = path.split('/').pop() || path;
    return formatted.length > 20 ? formatted.substring(0, 17) + '...' : formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return url.length > 20 ? url.substring(0, 17) + '...' : url;
  }
};

// Color palette from light to dark blue (matching the reference)
const BAR_COLORS = [
  'hsl(210, 100%, 85%)', // Lightest - top item
  'hsl(215, 95%, 75%)',
  'hsl(220, 90%, 65%)',
  'hsl(225, 85%, 55%)',
  'hsl(230, 80%, 45%)', // Darkest - bottom items
];

const getBarColor = (index: number, total: number): string => {
  if (total <= 1) return BAR_COLORS[2]; // Middle color for single item
  const ratio = index / (total - 1);
  const colorIndex = Math.min(Math.floor(ratio * BAR_COLORS.length), BAR_COLORS.length - 1);
  return BAR_COLORS[colorIndex];
};

export function TopPagesChart({ data, loading }: TopPagesChartProps) {
  const [sortBy, setSortBy] = useState<SortOption>('visits');
  const prefersReducedMotion = useReducedMotion();

  // Add conversion rate calculation to data
  const dataWithRates = useMemo(() => {
    return data.map(page => ({
      ...page,
      conversionRate: page.visits > 0 ? (page.conversions / page.visits) * 100 : 0,
    }));
  }, [data]);

  const { maxValue, sortedData, trendPercentage } = useMemo(() => {
    const sorted = [...dataWithRates]
      .sort((a, b) => {
        if (sortBy === 'conversions') {
          return b.conversions - a.conversions || b.visits - a.visits;
        }
        if (sortBy === 'conversion_rate') {
          return b.conversionRate - a.conversionRate || b.visits - a.visits;
        }
        return b.visits - a.visits;
      })
      .slice(0, 8); // Show top 8 for cleaner layout
    
    let max: number;
    if (sortBy === 'conversion_rate') {
      max = Math.max(...sorted.map(d => d.conversionRate), 1);
    } else if (sortBy === 'conversions') {
      max = Math.max(...sorted.map(d => d.conversions), 1);
    } else {
      max = Math.max(...sorted.map(d => d.visits), 1);
    }
    
    // TODO: Calculate real trend from previous period comparison
    const trend = '0';
    
    return { maxValue: max, sortedData: sorted, trendPercentage: parseFloat(trend) };
  }, [dataWithRates, sortBy]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-[400px] pt-6">
          <SkeletonHeatmap />
        </CardContent>
      </Card>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="h-[300px] pt-6 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No page data available</span>
        </CardContent>
      </Card>
    );
  }

  const totalVisits = sortedData.reduce((sum, p) => sum + p.visits, 0);

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Top Landing Pages"
          trendValue={trendPercentage}
          trendLabel="Visits"
          trendPeriod="this month"
          contextSummary={`Showing ${totalVisits.toLocaleString()} total visitors across top ${sortedData.length} pages`}
          rightSlot={
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visits">Visits</SelectItem>
                <SelectItem value="conversions">Leads</SelectItem>
                <SelectItem value="conversion_rate">CVR %</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <div className="space-y-3">
          {sortedData.map((page, index) => {
            let primaryValue: number;
            if (sortBy === 'conversion_rate') {
              primaryValue = page.conversionRate;
            } else if (sortBy === 'conversions') {
              primaryValue = page.conversions;
            } else {
              primaryValue = page.visits;
            }
            
            const widthPercentage = (primaryValue / maxValue) * 100;
            const barColor = getBarColor(index, sortedData.length);
            const animationDelay = prefersReducedMotion ? 0 : index * 50;
            
            return (
              <div 
                key={index} 
                className="flex items-center gap-3 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${animationDelay}ms` }}
              >
                {/* Label */}
                <span className="text-sm text-muted-foreground w-24 text-right shrink-0 group-hover:text-foreground transition-colors">
                  {formatUrl(page.url)}
                </span>
                
                {/* Bar container with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 h-8 relative overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-300 group-hover:opacity-90"
                        style={{ 
                          width: `${Math.max(widthPercentage, primaryValue > 0 ? 8 : 0)}%`,
                          backgroundColor: barColor,
                          animation: prefersReducedMotion ? 'none' : `growWidth 600ms ease-out ${animationDelay}ms both`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs">
                    <div className="space-y-1.5">
                      <p className="font-medium text-xs break-all">{page.url}</p>
                      <div className="border-t border-border pt-1.5 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground font-medium">{page.visits.toLocaleString()}</span> visits
                        </p>
                        {page.avgDuration > 0 && (
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground font-medium">{formatDuration(page.avgDuration)}</span> avg. time
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          <span className="text-primary font-medium">{page.conversions}</span> leads
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground font-medium">{page.conversionRate.toFixed(1)}%</span> conversion rate
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Conversion rate badge */}
                <div className="flex items-center gap-2 w-20 shrink-0">
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-md tabular-nums",
                    page.conversionRate > 3 
                      ? "bg-success/10 text-success" 
                      : page.conversionRate > 1 
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {page.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
