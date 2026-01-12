/**
 * RevenueOverview Component
 * 
 * Key revenue metrics displayed using MetricCardWithChart.
 * Consistent with user-facing analytics patterns.
 * 
 * @module components/admin/revenue/RevenueOverview
 */

import { MetricCardWithChart } from '@/components/analytics/MetricCardWithChart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAdminCurrency, formatPercentage, formatCompactNumber } from '@/lib/admin/admin-utils';
import type { RevenueData } from '@/types/admin';

interface RevenueOverviewProps {
  /** Revenue data from hook */
  data: RevenueData | null;
  /** Loading state */
  loading: boolean;
}

/**
 * Revenue overview cards with sparklines and trend indicators.
 */
export function RevenueOverview({ data, loading }: RevenueOverviewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  // Generate sparkline data from MRR history (last 7 points)
  const mrrSparkline = data?.mrrHistory?.slice(-7).map(d => ({ value: d.mrr })) || [];
  const churnSparkline = data?.churnHistory?.slice(-7).map(d => ({ value: d.rate })) || [];
  
  // Calculate MRR growth from history
  const mrrGrowth = data?.mrrHistory && data.mrrHistory.length >= 2
    ? ((data.mrrHistory[data.mrrHistory.length - 1]?.mrr - data.mrrHistory[data.mrrHistory.length - 2]?.mrr) / 
       (data.mrrHistory[data.mrrHistory.length - 2]?.mrr || 1)) * 100
    : 0;

  const metrics = [
    {
      title: formatAdminCurrency(data?.mrr || 0),
      subtitle: 'Monthly Recurring Revenue',
      description: 'Total MRR from all active subscriptions',
      change: mrrGrowth,
      changeType: 'percentage' as const,
      chartData: mrrSparkline,
    },
    {
      title: formatAdminCurrency(data?.arr || 0),
      subtitle: 'Annual Recurring Revenue',
      description: 'Projected annual revenue',
      change: mrrGrowth, // ARR follows MRR
      changeType: 'percentage' as const,
      chartData: mrrSparkline,
    },
    {
      title: formatPercentage(data?.churnRate || 0),
      subtitle: 'Churn Rate',
      description: 'Monthly customer churn',
      change: data?.churnRate ? -data.churnRate : 0, // Negative is good for churn
      changeType: 'points' as const,
      chartData: churnSparkline,
    },
    {
      title: formatAdminCurrency(data?.arpu || 0),
      subtitle: 'ARPU',
      description: 'Average revenue per user',
      change: 0,
      changeType: 'percentage' as const,
      chartData: [],
    },
    {
      title: formatAdminCurrency(data?.ltv || 0),
      subtitle: 'Customer LTV',
      description: 'Average lifetime value',
      change: 0,
      changeType: 'percentage' as const,
      chartData: [],
    },
    {
      title: formatPercentage(data?.trialConversion || 0),
      subtitle: 'Trial Conversion',
      description: 'Trial to paid conversion rate',
      change: 0,
      changeType: 'points' as const,
      chartData: [],
    },
    {
      title: formatPercentage(data?.netRevenueRetention || 100),
      subtitle: 'Net Revenue Retention',
      description: 'Revenue retained + expansion',
      change: (data?.netRevenueRetention || 100) - 100,
      changeType: 'points' as const,
      chartData: [],
    },
    {
      title: formatCompactNumber(data?.activeSubscriptions || 0),
      subtitle: 'Active Subscriptions',
      description: `${formatCompactNumber(data?.trialSubscriptions || 0)} trials`,
      change: 0,
      changeType: 'percentage' as const,
      chartData: [],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCardWithChart
          key={metric.subtitle}
          title={metric.title}
          subtitle={metric.subtitle}
          description={metric.description}
          change={metric.change}
          changeType={metric.changeType}
          chartData={metric.chartData}
          animationDelay={index * 0.05}
        />
      ))}
    </div>
  );
}
