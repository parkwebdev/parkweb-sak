/**
 * LeadConversionChart Component
 * 
 * Stacked area chart showing lead conversion funnel over time.
 * Dynamically renders areas based on user's lead stages.
 * @module components/analytics/LeadConversionChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCardHeader } from './ChartCardHeader';
import { StackedAreaChartCard, SeriesConfig } from '@/components/charts/StackedAreaChartCard';
import { useLeadStages } from '@/hooks/useLeadStages';
import { format, parseISO } from 'date-fns';

interface LeadStageStats {
  date: string;
  total: number;
  [stageName: string]: number | string;
}

interface LeadConversionChartProps {
  data: LeadStageStats[];
  trendValue?: number;
  trendPeriod?: string;
}

export const LeadConversionChart = React.memo(function LeadConversionChart({ 
  data,
  trendValue = 0,
  trendPeriod = 'this month',
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

  return (
    <Card className="h-full">
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
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {totalLeads.toLocaleString()} leads across {stages.length} stages
        </p>
      </CardContent>
    </Card>
  );
});
