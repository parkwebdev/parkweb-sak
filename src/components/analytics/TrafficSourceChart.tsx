/**
 * TrafficSourceChart Component
 * 
 * Horizontal bar chart showing traffic distribution by referrer source.
 * Displays organic, direct, social, and referral traffic.
 * @module components/analytics/TrafficSourceChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendUp01, TrendDown01 } from '@untitledui/icons';

interface TrafficSourceData {
  name: string;
  value: number;
  color?: string;
}

interface TrafficSourceChartProps {
  data: TrafficSourceData[];
  loading?: boolean;
  /** Comparison period data for calculating trend percentage */
  comparisonData?: TrafficSourceData[];
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
}: TrafficSourceChartProps) {
  const { total, sortedData, maxValue } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const sum = sorted.reduce((acc, item) => acc + item.value, 0);
    const max = Math.max(...sorted.map(d => d.value), 1);
    return { total: sum, sortedData: sorted, maxValue: max };
  }, [data]);

  // Calculate trend percentage from comparison data
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
        {/* Trend header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-semibold text-foreground">
              {hasTrendData 
                ? `Traffic ${isPositiveTrend ? 'up' : 'down'} ${Math.abs(trendPercentage).toFixed(1)}% from last period`
                : `${total.toLocaleString()} total conversations`
              }
            </span>
            {hasTrendData && (
              isPositiveTrend ? (
                <TrendUp01 size={16} className="text-success" />
              ) : (
                <TrendDown01 size={16} className="text-destructive" />
              )
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasTrendData 
              ? `${total.toLocaleString()} conversations from ${previousTotal.toLocaleString()} last period`
              : `Across ${sortedData.length} traffic sources`
            }
          </p>
        </div>

        <div className="space-y-3">
          {sortedData.map((source, index) => {
            const widthPercentage = (source.value / maxValue) * 100;
            const barColor = getBarColor(index, sortedData.length);
            const percentage = ((source.value / total) * 100).toFixed(1);

            return (
              <div key={source.name} className="flex items-center gap-3 cursor-pointer group">
                {/* Label */}
                <span className="text-sm text-muted-foreground w-20 text-right shrink-0 group-hover:text-foreground transition-colors capitalize">
                  {source.name}
                </span>

                {/* Bar container with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 h-8 relative">
                      <div
                        className="h-full rounded-md transition-all duration-300 group-hover:opacity-90"
                        style={{
                          width: `${Math.max(widthPercentage, 8)}%`,
                          backgroundColor: barColor,
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
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
