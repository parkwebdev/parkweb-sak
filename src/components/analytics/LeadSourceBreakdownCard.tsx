/**
 * LeadSourceBreakdownCard Component
 * 
 * Displays lead breakdown by traffic source with CVR per source.
 * Shows which traffic sources are generating the most leads and their conversion rates.
 * @module components/analytics/LeadSourceBreakdownCard
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { ChartCardHeader } from './ChartCardHeader';
import type { LeadSourceData } from '@/types/analytics';

interface LeadSourceBreakdownCardProps {
  data: LeadSourceData[];
  loading?: boolean;
  comparisonData?: LeadSourceData[];
}

// Color palette from light to dark (matching TrafficSourceChart)
const BAR_COLORS = [
  'hsl(142, 70%, 75%)',
  'hsl(145, 72%, 65%)',
  'hsl(148, 74%, 55%)',
  'hsl(151, 76%, 45%)',
  'hsl(154, 78%, 35%)',
];

const getBarColor = (index: number, total: number): string => {
  if (total <= 1) return BAR_COLORS[2];
  const ratio = index / (total - 1);
  const colorIndex = Math.min(Math.floor(ratio * BAR_COLORS.length), BAR_COLORS.length - 1);
  return BAR_COLORS[colorIndex];
};

const formatSourceName = (source: string): string => {
  const names: Record<string, string> = {
    organic: 'Organic Search',
    direct: 'Direct',
    social: 'Social Media',
    referral: 'Referral',
    email: 'Email',
    paid: 'Paid Search',
  };
  return names[source.toLowerCase()] || source;
};

export const LeadSourceBreakdownCard = React.memo(function LeadSourceBreakdownCard({
  data,
  loading,
  comparisonData,
}: LeadSourceBreakdownCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const { totalLeads, totalSessions, sortedData, maxLeads, overallCVR } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.leads - a.leads);
    const leads = sorted.reduce((acc, item) => acc + item.leads, 0);
    const sessions = sorted.reduce((acc, item) => acc + item.sessions, 0);
    const max = Math.max(...sorted.map(d => d.leads), 1);
    const cvr = sessions > 0 ? (leads / sessions) * 100 : 0;
    return { totalLeads: leads, totalSessions: sessions, sortedData: sorted, maxLeads: max, overallCVR: cvr };
  }, [data]);

  // Calculate trend from comparison data
  const trendPercentage = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) return undefined;
    const prevLeads = comparisonData.reduce((acc, item) => acc + item.leads, 0);
    if (prevLeads === 0) return totalLeads > 0 ? 100 : 0;
    return ((totalLeads - prevLeads) / prevLeads) * 100;
  }, [totalLeads, comparisonData]);

  // Find best performing source by CVR
  const bestSource = useMemo(() => {
    if (sortedData.length === 0) return null;
    const sourcesWithLeads = sortedData.filter(s => s.leads > 0);
    if (sourcesWithLeads.length === 0) return null;
    return sourcesWithLeads.reduce((best, current) => 
      current.cvr > best.cvr ? current : best
    );
  }, [sortedData]);

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
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || totalLeads === 0) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-foreground">
                No lead data available
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Lead sources will appear here once leads are captured
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
          title="Lead Sources"
          trendValue={trendPercentage}
          trendLabel="Leads"
          trendPeriod="this period"
        />

        <div className="space-y-3">
          {sortedData.map((source, index) => {
            const widthPercentage = (source.leads / maxLeads) * 100;
            const barColor = getBarColor(index, sortedData.length);
            const animationDelay = prefersReducedMotion ? 0 : index * 50;

            return (
              <div
                key={source.source}
                className="flex items-center gap-3 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${animationDelay}ms` }}
              >
                {/* Label */}
                <span className="text-sm text-muted-foreground w-24 text-right shrink-0 group-hover:text-foreground transition-colors">
                  {formatSourceName(source.source)}
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
                      <p className="font-medium text-xs">{formatSourceName(source.source)}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{source.leads.toLocaleString()}</span> leads from{' '}
                        <span className="text-foreground font-medium">{source.sessions.toLocaleString()}</span> sessions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Conversion rate: <span className="text-foreground font-medium">{source.cvr.toFixed(1)}%</span>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* CVR Badge - performance-based coloring */}
                <div 
                  className={cn(
                    "shrink-0 px-2 py-0.5 rounded text-xs tabular-nums font-medium",
                    source.cvr >= 15 
                      ? "bg-success/10 text-success" 
                      : source.cvr >= 10 
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {source.cvr.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {totalLeads.toLocaleString()} leads from {totalSessions.toLocaleString()} sessions ({overallCVR.toFixed(1)}% CVR)
          </span>
          {bestSource && (
            <span className="text-foreground font-medium">
              Best: {formatSourceName(bestSource.source)} ({bestSource.cvr.toFixed(1)}%)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
