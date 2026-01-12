/**
 * ChurnByPlanChart Component
 * 
 * Horizontal bar chart showing churn rate by subscription plan.
 * 
 * @module components/admin/revenue/ChurnByPlanChart
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
  Cell,
} from 'recharts';
import type { ChurnByPlanData } from '@/types/admin';

interface ChurnByPlanChartProps {
  data: ChurnByPlanData[];
  loading: boolean;
}

// Plan colors
const PLAN_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ChurnByPlanChart({ data, loading }: ChurnByPlanChartProps) {
  const prefersReducedMotion = useReducedMotion();

  const { avgChurnRate, contextSummary } = useMemo(() => {
    if (!data.length) {
      return { avgChurnRate: 0, contextSummary: 'No churn data by plan' };
    }

    // Calculate weighted average churn
    const totalCustomers = data.reduce((sum, d) => sum + d.totalCount, 0);
    const weightedChurn = data.reduce((sum, d) => sum + (d.churnRate * d.totalCount), 0);
    const avg = totalCustomers > 0 ? weightedChurn / totalCustomers : 0;

    const highestChurn = data.reduce((max, d) => d.churnRate > max.churnRate ? d : max, data[0]);

    return {
      avgChurnRate: avg,
      contextSummary: `${highestChurn.planName} has highest churn at ${formatPercentage(highestChurn.churnRate)}`,
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
          title="Churn by Plan"
          trendValue={avgChurnRate}
          trendLabel="avg churn"
          contextSummary={contextSummary}
        />

        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-muted-foreground">No churn data by plan available</p>
          </div>
        ) : (
          <div className="flex-1 min-h-[200px] mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 'dataMax']}
                />
                <YAxis
                  type="category"
                  dataKey="planName"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, _name, props) => {
                    const plan = props.payload as ChurnByPlanData;
                    return [
                      `${formatPercentage(Number(value))} (${plan.churnedCount}/${plan.totalCount})`,
                      'Churn Rate',
                    ];
                  }}
                  cursor={{
                    fill: 'hsl(var(--muted))',
                    fillOpacity: 0.4,
                  }}
                />
                <Bar
                  dataKey="churnRate"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Context footer */}
        <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Churn rate by plan helps identify which tiers need retention focus
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
