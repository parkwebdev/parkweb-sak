/**
 * OverviewSection Component
 * 
 * Displays the key revenue KPI cards with sparklines.
 * Shows MRR, ARR, NRR, ARPU, LTV, Trial Conversion, Active Subs, Churn Rate.
 * 
 * @module components/admin/revenue/sections/OverviewSection
 */

import { useMemo } from 'react';
import { MetricCardWithChart } from '@/components/analytics/MetricCardWithChart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAdminCurrency, formatPercentage } from '@/lib/admin/admin-utils';
import type { RevenueData } from '@/types/admin';

interface OverviewSectionProps {
  data: RevenueData | null;
  loading: boolean;
}

export function OverviewSection({ data, loading }: OverviewSectionProps) {
  const metrics = useMemo(() => {
    if (!data) return [];

    // Generate sparkline data from MRR history (last 7 points)
    const mrrSparkline = data.mrrHistory?.slice(-7).map(d => ({ value: d.mrr })) || [];
    const churnSparkline = data.churnHistory?.slice(-7).map(d => ({ value: d.rate })) || [];

    // Calculate MRR growth
    const mrrGrowth = data.mrrHistory && data.mrrHistory.length >= 2
      ? ((data.mrrHistory[data.mrrHistory.length - 1]?.mrr || 0) - 
         (data.mrrHistory[data.mrrHistory.length - 2]?.mrr || 0)) / 
        (data.mrrHistory[data.mrrHistory.length - 2]?.mrr || 1) * 100
      : 0;

    return [
      {
        title: formatAdminCurrency(data.mrr),
        subtitle: 'Monthly Recurring Revenue',
        description: 'Total MRR from active subscriptions',
        change: mrrGrowth,
        changeType: 'percentage' as const,
        chartData: mrrSparkline,
      },
      {
        title: formatAdminCurrency(data.arr),
        subtitle: 'Annual Recurring Revenue',
        description: 'MRR × 12 annualized',
        change: mrrGrowth, // ARR follows MRR
        changeType: 'percentage' as const,
        chartData: mrrSparkline,
      },
      {
        title: formatPercentage(data.netRevenueRetention),
        subtitle: 'Net Revenue Retention',
        description: 'Revenue retained including expansion',
        change: data.netRevenueRetention - 100,
        changeType: 'points' as const,
        chartData: mrrSparkline,
      },
      {
        title: formatAdminCurrency(data.arpu),
        subtitle: 'Avg Revenue Per User',
        description: 'MRR divided by active subscribers',
        change: 0,
        changeType: 'percentage' as const,
        chartData: mrrSparkline,
      },
      {
        title: formatAdminCurrency(data.ltv),
        subtitle: 'Customer Lifetime Value',
        description: 'Average revenue per customer lifetime',
        change: 0,
        changeType: 'percentage' as const,
        chartData: mrrSparkline,
      },
      {
        title: formatPercentage(data.trialConversion),
        subtitle: 'Trial Conversion Rate',
        description: 'Trials converting to paid subscriptions',
        change: 0,
        changeType: 'points' as const,
        chartData: [],
      },
      {
        title: data.activeSubscriptions.toLocaleString(),
        subtitle: 'Active Subscriptions',
        description: 'Currently paying customers',
        change: 0,
        changeType: 'percentage' as const,
        chartData: [],
      },
      {
        title: formatPercentage(data.churnRate),
        subtitle: 'Monthly Churn Rate',
        description: 'Customers lost per month',
        change: -data.churnRate, // Negative churn is good
        changeType: 'points' as const,
        chartData: churnSparkline,
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-muted/50 p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <div className="pt-2 space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCardWithChart
          key={metric.subtitle}
          {...metric}
          animationDelay={index * 0.05}
        />
      ))}
    </div>
  );
}
