/**
 * TrafficSourceChart Component
 * 
 * Horizontal bar chart showing traffic distribution by referrer source.
 * Displays organic, direct, social, and referral traffic with per-source trends.
 * @module components/analytics/TrafficSourceChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendUp01, TrendDown01 } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { ChartCardHeader } from './ChartCardHeader';
import type { TrafficSourceData } from '@/types/analytics';
import type { EngagementMetrics } from '@/hooks/useTrafficAnalytics';

interface TrafficSourceChartProps {
  data: TrafficSourceData[];
  loading?: boolean;
  comparisonData?: TrafficSourceData[];
  engagement?: EngagementMetrics;
}

// Color palette from light to dark (matching TopPagesChart)
const BAR_COLORS = [
  'hsl(210, 100%, 85%)',
  'hsl(215, 95%, 75%)',
  'hsl(220, 90%, 65%)',
  'hsl(225, 85%, 55%)',
  'hsl(230, 80%, 45%)',
];

const getBarColor = (index: number, total: number): string => {
  if (total <= 1) return BAR_COLORS[2];
  const ratio = index / (total - 1);
  const colorIndex = Math.min(Math.floor(ratio * BAR_COLORS.length), BAR_COLORS.length - 1);
  return BAR_COLORS[colorIndex];
};

export const TrafficSourceChart = React.memo(function TrafficSourceChart({ 
  data, 
  loading,
  comparisonData,
  engagement,
}: TrafficSourceChartProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const { total, sortedData, maxValue } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const sum = sorted.reduce((acc, item) => acc + item.value, 0);
    const max = Math.max(...sorted.map(d => d.value), 1);
    return { total: sum, sortedData: sorted, maxValue: max };
  }, [data]);

  // Calculate total trend percentage from comparison data
  const { trendPercentage, previousTotal } = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) {
      return { trendPercentage: 0, previousTotal: 0 };
    }
    const prevTotal = comparisonData.reduce((acc, item) => acc + item.value, 0);
    if (prevTotal === 0) {
      return { trendPercentage: total > 0 ? 100 : 0, previousTotal: 0 };
    }
    const change = ((total - prevTotal) / prevTotal) * 100;
    return { trendPercentage: change, previousTotal: prevTotal };
  }, [total, comparisonData]);

  // Calculate per-source trend percentages
  const sourceTrends = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) {
      return new Map<string, number>();
    }
    
    const trends = new Map<string, number>();
    sortedData.forEach(source => {
      const previousSource = comparisonData.find(d => d.name.toLowerCase() === source.name.toLowerCase());
      const prevValue = previousSource?.value ?? 0;
      
      if (prevValue === 0) {
        trends.set(source.name, source.value > 0 ? 100 : 0);
      } else {
        const change = ((source.value - prevValue) / prevValue) * 100;
        trends.set(source.name, change);
      }
    });
    
    return trends;
  }, [sortedData, comparisonData]);

  const isPositiveTrend = trendPercentage >= 0;
  const hasTrendData = comparisonData && comparisonData.length > 0;

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-foreground">
                No traffic data available
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasTrendData && previousTotal > 0 
                ? `Previous period had ${previousTotal.toLocaleString()} conversations`
                : 'Traffic sources will appear here once conversations are recorded'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Traffic Sources"
          trendValue={hasTrendData ? trendPercentage : undefined}
          trendLabel="Traffic"
          trendPeriod="this period"
        />

        <div className="space-y-3">
          {sortedData.map((source, index) => {
            const widthPercentage = (source.value / maxValue) * 100;
            const barColor = getBarColor(index, sortedData.length);
            const percentage = ((source.value / total) * 100).toFixed(1);
            const animationDelay = prefersReducedMotion ? 0 : index * 50;
            
            // Per-source trend
            const sourceTrend = sourceTrends.get(source.name) ?? 0;
            const hasSourceTrend = hasTrendData && Math.abs(sourceTrend) > 0.1;
            const isSourcePositive = sourceTrend >= 0;

            return (
              <div 
                key={source.name} 
                className="flex items-center gap-3 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${animationDelay}ms` }}
              >
                {/* Label */}
                <span className="text-sm text-muted-foreground min-w-16 shrink-0 group-hover:text-foreground transition-colors capitalize">
                  {source.name}
                </span>

                {/* Bar container with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 h-8 relative overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-300 group-hover:opacity-90"
                        style={{
                          width: `${Math.max(widthPercentage, 8)}%`,
                          backgroundColor: barColor,
                          animation: prefersReducedMotion ? 'none' : `growWidth 600ms ease-out ${animationDelay}ms both`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <div className="space-y-1">
                      <p className="font-medium text-xs capitalize">{source.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{source.value.toLocaleString()}</span> conversations ({percentage}%)
                      </p>
                      {hasSourceTrend && (
                        <p className={cn("text-xs", isSourcePositive ? "text-success" : "text-destructive")}>
                          {isSourcePositive ? '+' : ''}{sourceTrend.toFixed(1)}% vs last period
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Per-source trend indicator */}
                {hasSourceTrend && (
                  <div className={cn(
                    "flex items-center gap-0.5 w-14 shrink-0",
                    isSourcePositive ? "text-success" : "text-destructive"
                  )}>
                    {isSourcePositive ? (
                      <TrendUp01 size={12} />
                    ) : (
                      <TrendDown01 size={12} />
                    )}
                    <span className="text-xs tabular-nums">
                      {isSourcePositive ? '+' : ''}{sourceTrend.toFixed(0)}%
                    </span>
                  </div>
                )}
            </div>
            );
          })}
        </div>

        {/* Footer context summary with CVR */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {hasTrendData 
              ? `${total.toLocaleString()} conversations, ${previousTotal.toLocaleString()} last period`
              : `${total.toLocaleString()} conversations across ${sortedData.length} sources`
            }
          </span>
          {engagement && engagement.totalLeads > 0 && (
            <span className="text-foreground font-medium">
              {engagement.totalLeads.toLocaleString()} leads ({engagement.overallCVR.toFixed(1)}% CVR)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
