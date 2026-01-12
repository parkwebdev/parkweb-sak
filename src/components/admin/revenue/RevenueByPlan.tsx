/**
 * RevenueByPlan Component
 * 
 * Pie chart showing MRR breakdown by subscription tier.
 * Uses shared ChartCardHeader and ChartTooltipContent patterns.
 * 
 * @module components/admin/revenue/RevenueByPlan
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from '@/components/analytics/ChartCardHeader';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PlanRevenue {
  planName: string;
  mrr: number;
  percentage: number;
  subscriberCount: number;
}

interface RevenueByPlanProps {
  /** Revenue by plan data */
  data: PlanRevenue[];
  /** Loading state */
  loading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--status-active))',
  'hsl(var(--accent-foreground))',
  'hsl(var(--muted-foreground))',
];

/**
 * Revenue by plan chart with consistent analytics patterns.
 */
export function RevenueByPlan({ data, loading }: RevenueByPlanProps) {
  const prefersReducedMotion = useReducedMotion();

  const { totalMRR, contextSummary } = useMemo(() => {
    const total = data.reduce((sum, plan) => sum + plan.mrr, 0);
    const planCount = data.length;
    return {
      totalMRR: total,
      contextSummary: `${formatAdminCurrency(total)} across ${planCount} plan${planCount !== 1 ? 's' : ''}`,
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
          title="Revenue by Plan"
          contextSummary={contextSummary}
        />
        
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No plan data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="mrr"
                  nameKey="planName"
                  label={({ planName, percentage }) => `${planName} (${percentage.toFixed(0)}%)`}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number, name: string, props) => {
                    const plan = props.payload as PlanRevenue;
                    return [
                      `${formatAdminCurrency(value)} (${plan.subscriberCount} subscribers)`,
                      plan.planName,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Context footer */}
            <div className="mt-2 px-3 py-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                Total subscribers: {data.reduce((sum, p) => sum + p.subscriberCount, 0).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
