/**
 * MRRChart Component
 * 
 * Line chart showing Monthly Recurring Revenue over time.
 * 
 * @module components/admin/revenue/MRRChart
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAdminCurrency, formatCompactNumber } from '@/lib/admin/admin-utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
 * MRR chart over time.
 */
export function MRRChart({ data, loading }: MRRChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">MRR Over Time</CardTitle>
        <CardDescription>Monthly recurring revenue trend</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${formatCompactNumber(value)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatAdminCurrency(value), 'MRR']}
              />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
