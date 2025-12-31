/**
 * LeadConversionChart Component
 * 
 * Stacked area chart showing lead conversion funnel over time.
 * Dynamically renders areas based on user's lead stages.
 * @module components/analytics/LeadConversionChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from './ChartCardHeader';
import { StackedAreaChartCard, SeriesConfig } from '@/components/charts/StackedAreaChartCard';
import { useLeadStages } from '@/hooks/useLeadStages';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadStageStats {
  date: string;
  total: number;
  [stageName: string]: number | string;
}

interface LeadConversionChartProps {
  /** Daily lead stage data */
  data: LeadStageStats[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Trend percentage value */
  trendValue?: number;
  /** Period for trend comparison */
  trendPeriod?: string;
  /** Optional CSS class name */
  className?: string;
}

export const LeadConversionChart = React.memo(function LeadConversionChart({ 
  data,
  loading = false,
  trendValue = 0,
  trendPeriod = 'this month',
  className,
}: LeadConversionChartProps) {
  const { stages } = useLeadStages();

  // Generate series config from stages
  const seriesConfig: SeriesConfig[] = useMemo(() => {
    return stages.map((stage) => ({
      key: stage.name.toLowerCase(),
      label: stage.name,
      color: stage.color,
    }));
  }, [stages]);

  // Calculate totals for context summary
  const totalLeads = useMemo(() => {
    if (data.length === 0) return 0;
    const lastDay = data[data.length - 1];
    return lastDay?.total ?? 0;
  }, [data]);

  // Format data for chart
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: (() => {
        try {
          return format(parseISO(d.date), 'MMM d');
        } catch {
          return d.date;
        }
      })(),
    }));
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="pt-6">
          <div className="space-y-4" role="status" aria-label="Loading lead conversion data">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-[350px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Lead Conversion Funnel"
          trendValue={trendValue}
          trendLabel="Leads"
          trendPeriod={trendPeriod}
        />

        <StackedAreaChartCard
          data={chartData}
          series={seriesConfig}
          gradientIdPrefix="lead"
        />
        
        {/* Context summary footer */}
        <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Showing {totalLeads.toLocaleString()} leads across {stages.length} stages
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
