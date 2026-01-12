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
