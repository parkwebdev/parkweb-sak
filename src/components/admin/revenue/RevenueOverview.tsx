/**
 * Revenue Analytics Components
 * 
 * Components for displaying revenue metrics and charts.
 * 
 * @module components/admin/revenue/RevenueOverview
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendUp01, TrendDown01 } from '@untitledui/icons';
import { formatAdminCurrency, formatPercentage, formatCompactNumber } from '@/lib/admin/admin-utils';
import type { RevenueData, TopAccount } from '@/types/admin';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface RevenueOverviewProps {
  data: RevenueData | null;
  loading: boolean;
}

/**
 * Revenue overview with KPI cards.
 */
export function RevenueOverview({ data, loading }: RevenueOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'MRR',
      value: formatAdminCurrency(data?.mrr || 0),
      description: 'Monthly recurring revenue',
      trend: null,
    },
    {
      label: 'ARR',
      value: formatAdminCurrency(data?.arr || 0),
      description: 'Annual recurring revenue',
      trend: null,
    },
    {
      label: 'Churn Rate',
      value: formatPercentage(data?.churnRate || 0),
      description: 'Monthly churn',
      trend: data?.churnRate && data.churnRate > 5 ? 'negative' : 'positive',
    },
    {
      label: 'ARPU',
      value: formatAdminCurrency(data?.arpu || 0),
      description: 'Avg revenue per user',
      trend: null,
    },
    {
      label: 'LTV',
      value: formatAdminCurrency(data?.ltv || 0),
      description: 'Lifetime value',
      trend: null,
    },
    {
      label: 'Trial → Paid',
      value: formatPercentage(data?.trialConversion || 0),
      description: 'Conversion rate',
      trend: data?.trialConversion && data.trialConversion > 20 ? 'positive' : null,
    },
    {
      label: 'NRR',
      value: formatPercentage(data?.netRevenueRetention || 100),
      description: 'Net revenue retention',
      trend: data?.netRevenueRetention && data.netRevenueRetention > 100 ? 'positive' : null,
    },
    {
      label: 'Active Subs',
      value: formatCompactNumber(data?.activeSubscriptions || 0),
      description: 'Total subscriptions',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {metric.label}
              {metric.trend === 'positive' && <TrendUp01 size={14} className="text-status-active" />}
              {metric.trend === 'negative' && <TrendDown01 size={14} className="text-destructive" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * MRR chart over time.
 */
export function MRRChart({
  data,
  loading,
}: {
  data: Array<{ date: string; mrr: number; growth: number }>;
  loading: boolean;
}) {
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

/**
 * Churn rate chart.
 */
export function ChurnChart({
  data,
  loading,
}: {
  data: Array<{ date: string; rate: number; count: number }>;
  loading: boolean;
}) {
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
        <CardTitle className="text-base">Churn Rate</CardTitle>
        <CardDescription>Monthly customer churn</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={data}>
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
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'rate' ? `${value}%` : value,
                  name === 'rate' ? 'Churn Rate' : 'Churned',
                ]}
              />
              <Bar dataKey="rate" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Subscription funnel visualization.
 */
export function SubscriptionFunnel({
  data,
  loading,
}: {
  data: { trials: number; active: number; churned: number; conversionRate: number } | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const funnel = data || { trials: 0, active: 0, churned: 0, conversionRate: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subscription Funnel</CardTitle>
        <CardDescription>Trial to paid conversion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Trials</span>
              <span className="font-mono text-sm">{funnel.trials}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <span className="font-mono text-sm">{funnel.active}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-status-active rounded-full"
                style={{ width: funnel.trials ? `${(funnel.active / funnel.trials) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Churned</span>
              <span className="font-mono text-sm">{funnel.churned}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-destructive/60 rounded-full"
                style={{ width: funnel.trials ? `${(funnel.churned / funnel.trials) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Rate</span>
              <Badge variant="secondary">{formatPercentage(funnel.conversionRate)}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Revenue by plan chart.
 */
export function RevenueByPlan({
  data,
  loading,
}: {
  data: Array<{ planName: string; mrr: number; percentage: number; subscriberCount: number }>;
  loading: boolean;
}) {
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--secondary))',
    'hsl(var(--muted))',
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
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
        <CardTitle className="text-base">Revenue by Plan</CardTitle>
        <CardDescription>MRR breakdown by subscription tier</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="mrr"
                nameKey="planName"
                label={({ planName, percentage }) => `${planName} (${percentage}%)`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatAdminCurrency(value), 'MRR']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Top accounts table.
 */
export function TopAccountsTable({
  accounts,
  loading,
}: {
  accounts: TopAccount[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Accounts by Revenue</CardTitle>
        <CardDescription>Highest value customers</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No accounts yet
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account, index) => (
              <div
                key={account.userId}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {account.displayName || account.companyName || account.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.planName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium">
                    {formatAdminCurrency(account.mrr)}/mo
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    LTV: {formatAdminCurrency(account.lifetimeValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
