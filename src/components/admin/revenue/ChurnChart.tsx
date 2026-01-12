/**
 * ChurnChart Component
 * 
 * Bar chart visualization of monthly churn rates.
 * Uses shared ChartCardHeader and ChartTooltipContent patterns.
 * 
 * @module components/admin/revenue/ChurnChart
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from '@/components/analytics/ChartCardHeader';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { formatPercentage } from '@/lib/admin/admin-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ChurnDataPoint {
  date: string;
  rate: number;
  count: number;
}

interface ChurnChartProps {
  /** Churn history data */
  data: ChurnDataPoint[];
  /** Loading state */
  loading: boolean;
}

/**
 * Churn rate trend chart with consistent analytics patterns.
 */
export function ChurnChart({ data, loading }: ChurnChartProps) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate trend from data (for churn, lower is better)
  const { trendValue, currentRate, contextSummary } = useMemo(() => {
    if (data.length < 2) {
      return { trendValue: 0, currentRate: 0, contextSummary: 'No historical data' };
    }
    
    const current = data[data.length - 1]?.rate || 0;
    const previous = data[data.length - 2]?.rate || 1;
    // Negative trend is good for churn (rate went down)
    const trend = current - previous;
    
    const totalChurned = data.reduce((sum, d) => sum + d.count, 0);
    
    return {
      trendValue: -trend, // Invert: positive = improvement (churn went down)
      currentRate: current,
      contextSummary: `${formatPercentage(current)} current rate, ${totalChurned} churned total`,
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
          title="Churn Rate"
          trendValue={trendValue}
          trendLabel="Churn"
          trendPeriod="vs last month"
          contextSummary={contextSummary}
        />
        
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No churn data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                  tickFormatter={(value) => `${value}%`}
                  width={40}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number, name: string) => {
                    if (name === 'rate') return [`${value.toFixed(1)}%`, 'Churn Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => String(label)}
                  cursor={{
                    fill: 'hsl(var(--muted))',
                    opacity: 0.3,
                  }}
                />
                <Bar
                  dataKey="rate"
                  name="rate"
                  fill="hsl(var(--destructive))"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Context footer */}
            <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                Showing {data.length} months of churn data
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
