/**
 * ConversationChart Component
 * 
 * Stacked area chart showing conversation trends over time.
 * Displays active and closed conversation counts.
 * @module components/analytics/ConversationChart
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCardHeader } from './ChartCardHeader';
import { StackedAreaChartCard, SeriesConfig } from '@/components/charts/StackedAreaChartCard';
import { format, parseISO } from 'date-fns';

interface ConversationChartProps {
  data: Array<{
    date: string;
    total: number;
    active: number;
    closed: number;
  }>;
  trendValue?: number;
  trendPeriod?: string;
}

const SERIES_CONFIG: SeriesConfig[] = [
  { key: 'active', label: 'Active', color: 'hsl(220, 90%, 56%)' },
  { key: 'closed', label: 'Closed', color: 'hsl(210, 100%, 80%)' },
];

export const ConversationChart = React.memo(function ConversationChart({ 
  data,
  trendValue = 0,
  trendPeriod = 'this month',
}: ConversationChartProps) {
  // Calculate totals for context summary
  const totalConversations = useMemo(() => {
    return data.reduce((sum, d) => sum + d.total, 0);
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
          title="Conversation Volume"
          trendValue={trendValue}
          trendLabel="Conversations"
          trendPeriod={trendPeriod}
        />

        <StackedAreaChartCard
          data={chartData}
          series={SERIES_CONFIG}
          gradientIdPrefix="conv"
        />

        {/* Context summary footer */}
        <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Showing {totalConversations.toLocaleString()} conversations over {data.length} days
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
