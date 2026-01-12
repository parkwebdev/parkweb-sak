/**
 * MRRMovementChart Component
 * 
 * Stacked bar chart showing MRR movement (New, Expansion, Contraction, Churned).
 * 
 * @module components/admin/revenue/MRRMovementChart
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from '@/components/analytics/ChartCardHeader';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { MRRMovementDataPoint } from '@/types/admin';

interface MRRMovementChartProps {
  data: MRRMovementDataPoint[];
  loading: boolean;
}

export function MRRMovementChart({ data, loading }: MRRMovementChartProps) {
  const prefersReducedMotion = useReducedMotion();

  const { chartData, contextSummary } = useMemo(() => {
    if (!data.length) {
      return { chartData: [], contextSummary: 'No movement data available' };
    }

    // Transform data for chart
    const transformed = data.map((point) => ({
      date: point.date,
      positive: point.newMRR + point.expansionMRR,
      negative: -(point.contractionMRR + point.churnedMRR),
      net: point.netChange,
      // Keep individual values for tooltip
      newMRR: point.newMRR,
      expansionMRR: point.expansionMRR,
      contractionMRR: point.contractionMRR,
      churnedMRR: point.churnedMRR,
    }));

    const latestNet = data[data.length - 1]?.netChange || 0;
    const avgNet = data.reduce((sum, d) => sum + d.netChange, 0) / data.length;

    return {
      chartData: transformed,
      contextSummary: `${formatAdminCurrency(latestNet)} net change this month, ${formatAdminCurrency(avgNet)} avg`,
    };
  }, [data]);

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardContent className="p-6 flex-1">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <ChartCardHeader
          title="MRR Movement"
          contextSummary={contextSummary}
        />

        {chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-muted-foreground">No movement data available</p>
          </div>
        ) : (
          <div className="flex-1 min-h-[200px] mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
                stackOffset="sign"
              >
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short' });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatAdminCurrency(value)}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => {
                    const val = Number(value);
                    if (name === 'positive') return [formatAdminCurrency(val), 'Growth'];
                    if (name === 'negative') return [formatAdminCurrency(Math.abs(val)), 'Loss'];
                    return [formatAdminCurrency(val), String(name)];
                  }}
                  labelFormatter={(label) => {
                    const date = new Date(String(label));
                    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  }}
                  cursor={{
                    fill: 'hsl(var(--muted))',
                    fillOpacity: 0.4,
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar
                  dataKey="positive"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="negative"
                  fill="hsl(var(--destructive))"
                  radius={[0, 0, 4, 4]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Context footer */}
        <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Green bars show growth (new + expansion), red bars show loss (contraction + churn)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
