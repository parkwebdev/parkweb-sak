/**
 * MRRChart Component
 * 
 * Line chart visualization of Monthly Recurring Revenue over time.
 * Uses shared ChartCardHeader and ChartTooltipContent patterns.
 * 
 * @module components/admin/revenue/MRRChart
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from '@/components/analytics/ChartCardHeader';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface MRRDataPoint {
  date: string;
  mrr: number;
  growth: number;
}

interface MRRChartProps {
  /** MRR history data */
  data: MRRDataPoint[];
  /** Loading state */
  loading: boolean;
}

/**
 * MRR trend chart with consistent analytics patterns.
 */
export function MRRChart({ data, loading }: MRRChartProps) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate trend from data
  const { trendValue, currentMRR, contextSummary } = useMemo(() => {
    if (data.length < 2) {
      return { trendValue: 0, currentMRR: 0, contextSummary: 'No historical data' };
    }
    
    const current = data[data.length - 1]?.mrr || 0;
    const previous = data[data.length - 2]?.mrr || 1;
    const trend = ((current - previous) / previous) * 100;
    
    return {
      trendValue: trend,
      currentMRR: current,
      contextSummary: `${formatAdminCurrency(current)} current MRR across ${data.length} months`,
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="MRR Over Time"
          trendValue={trendValue}
          trendLabel="MRR"
          trendPeriod="vs last month"
          contextSummary={contextSummary}
        />
        
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No MRR data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false} 
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [formatAdminCurrency(value), 'MRR']}
                  labelFormatter={(label) => String(label)}
                  cursor={{
                    stroke: 'hsl(var(--primary))',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Context footer */}
            <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                Showing {data.length} months of MRR history
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
