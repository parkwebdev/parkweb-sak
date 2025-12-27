/**
 * TrafficSourceChart Component
 * 
 * Horizontal bar chart showing traffic distribution by referrer source.
 * Displays organic, direct, social, and referral traffic.
 * @module components/analytics/TrafficSourceChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface TrafficSourceData {
  name: string;
  value: number;
  color?: string;
}

interface TrafficSourceChartProps {
  data: TrafficSourceData[];
  loading?: boolean;
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

export const TrafficSourceChart = React.memo(function TrafficSourceChart({ data, loading }: TrafficSourceChartProps) {
  const { total, sortedData, maxValue } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const sum = sorted.reduce((acc, item) => acc + item.value, 0);
    const max = Math.max(...sorted.map(d => d.value), 1);
    return { total: sum, sortedData: sorted, maxValue: max };
  }, [data]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No traffic data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} total conversations from {sortedData.length} sources
        </p>
      </CardHeader>
      <CardContent>
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
