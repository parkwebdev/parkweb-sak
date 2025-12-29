/**
 * PageDepthChart Component
 * 
 * Horizontal bar chart showing session depth distribution.
 * Visualizes how many pages visitors view per session.
 * @module components/analytics/PageDepthChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartCardHeader } from './ChartCardHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import type { PageDepthData } from '@/hooks/useTrafficAnalytics';

interface PageDepthChartProps {
  data: PageDepthData[];
  loading?: boolean;
}

// Color palette from light to dark based on depth
const DEPTH_COLORS = [
  'hsl(0, 70%, 65%)',     // 0 pages - red-ish (bad)
  'hsl(38, 92%, 55%)',    // 1 page - orange/amber (bounce)
  'hsl(50, 85%, 50%)',    // 2 pages - yellow
  'hsl(80, 75%, 45%)',    // 3 pages - lime
  'hsl(142, 76%, 46%)',   // 4 pages - green
  'hsl(160, 84%, 39%)',   // 5+ pages - teal (engaged)
];

export const PageDepthChart = React.memo(function PageDepthChart({
  data,
  loading,
}: PageDepthChartProps) {
  const prefersReducedMotion = useReducedMotion();

  const { totalSessions, maxValue, avgDepth } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const max = Math.max(...data.map(d => d.count), 1);
    
    // Calculate average depth (approximate based on buckets)
    const depthValues: Record<string, number> = {
      '0 pages': 0,
      '1 page': 1,
      '2 pages': 2,
      '3 pages': 3,
      '4 pages': 4,
      '5+ pages': 6, // Approximate
    };
    const weightedSum = data.reduce((sum, d) => sum + (depthValues[d.depth] || 0) * d.count, 0);
    const avg = total > 0 ? weightedSum / total : 0;
    
    return { totalSessions: total, maxValue: max, avgDepth: avg };
  }, [data]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
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

  if (data.length === 0 || totalSessions === 0) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Session Depth"
            contextSummary="No session data available yet"
          />
          <div className="py-8 text-center text-sm text-muted-foreground">
            Page depth distribution will appear once visitors browse your site
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Session Depth"
          contextSummary={`${totalSessions.toLocaleString()} sessions, avg ${avgDepth.toFixed(1)} pages/session`}
        />

        <div className="space-y-3">
          {data.map((item, index) => {
            const widthPercentage = (item.count / maxValue) * 100;
            const color = DEPTH_COLORS[index] || DEPTH_COLORS[DEPTH_COLORS.length - 1];
            const animationDelay = prefersReducedMotion ? 0 : index * 50;

            return (
              <div
                key={item.depth}
                className="flex items-center gap-3 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${animationDelay}ms` }}
              >
                {/* Label */}
                <span className="text-sm text-muted-foreground w-20 shrink-0 group-hover:text-foreground transition-colors">
                  {item.depth}
                </span>

                {/* Bar with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 h-8 relative overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-300 group-hover:opacity-90"
                        style={{
                          width: `${Math.max(widthPercentage, 8)}%`,
                          backgroundColor: color,
                          animation: prefersReducedMotion ? 'none' : `growWidth 600ms ease-out ${animationDelay}ms both`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <div className="space-y-1">
                      <p className="font-medium text-xs">{item.depth}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{item.count.toLocaleString()}</span> sessions ({item.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Percentage */}
                <span className="text-xs text-muted-foreground w-12 shrink-0 tabular-nums">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Insight footer */}
        <div className="mt-4 text-xs text-muted-foreground">
          {data.find(d => d.depth === '1 page')?.percentage || 0 > 50 ? (
            <span className="text-warning">High bounce rate — consider improving page engagement</span>
          ) : data.find(d => d.depth === '5+ pages')?.percentage || 0 > 20 ? (
            <span className="text-success">Strong engagement — visitors exploring multiple pages</span>
          ) : (
            <span>Healthy distribution of session depths</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
