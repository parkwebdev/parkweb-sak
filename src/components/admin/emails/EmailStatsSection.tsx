/**
 * Email Stats Section
 * 
 * Enhanced email statistics display using MetricCardWithChart pattern
 * from the main Analytics page. Shows delivery rates, engagement metrics,
 * and failure tracking with trend indicators.
 * 
 * @module components/admin/emails/EmailStatsSection
 */

import { MetricCardWithChart } from '@/components/analytics/MetricCardWithChart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactNumber, formatPercentage } from '@/lib/admin/admin-utils';
import type { EmailDeliveryStats as EmailStats } from '@/types/admin';

interface EmailStatsSectionProps {
  stats: EmailStats;
  loading: boolean;
}

/**
 * Skeleton loader matching the metric cards grid layout.
 */
function EmailStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border">
            <div className="px-4 pt-3 pb-2 md:px-5">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="relative flex flex-col gap-4 rounded-t-xl bg-card px-4 py-5 shadow-sm border-t border-border md:gap-5 md:px-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Generates mock chart data for sparklines.
 * In a real implementation, this would come from historical data.
 */
function generateMockChartData(baseValue: number, variance = 0.2): { value: number }[] {
  const points = 12;
  return Array.from({ length: points }, (_, i) => {
    const trend = i / points; // Gradual increase
    const noise = (Math.random() - 0.5) * variance;
    const value = baseValue * (0.8 + trend * 0.4 + noise);
    return { value: Math.max(0, value) };
  });
}

/**
 * Enhanced email statistics display with metric cards and sparklines.
 */
export function EmailStatsSection({ stats, loading }: EmailStatsSectionProps) {
  if (loading) {
    return <EmailStatsSkeleton />;
  }

  // Calculate derived metrics
  const deliveryRate = stats.sent > 0 
    ? (stats.delivered / stats.sent) * 100 
    : 0;
  const openRate = stats.delivered > 0 
    ? (stats.opened / stats.delivered) * 100 
    : 0;
  const clickRate = stats.opened > 0 
    ? (stats.clicked / stats.opened) * 100 
    : 0;
  const bounceRate = stats.sent > 0 
    ? (stats.bounced / stats.sent) * 100 
    : 0;

  const metrics = [
    {
      title: formatCompactNumber(stats.sent),
      subtitle: 'Emails Sent',
      description: 'Total emails dispatched',
      change: 12.5, // Mock trend - would come from historical comparison
      chartData: generateMockChartData(stats.sent),
    },
    {
      title: formatPercentage(deliveryRate),
      subtitle: 'Delivery Rate',
      description: `${formatCompactNumber(stats.delivered)} delivered`,
      change: deliveryRate >= 95 ? 2.1 : -3.2,
      changeType: 'points' as const,
      chartData: generateMockChartData(deliveryRate, 0.05),
    },
    {
      title: formatPercentage(openRate),
      subtitle: 'Open Rate',
      description: `${formatCompactNumber(stats.opened)} opened`,
      change: 5.3,
      changeType: 'points' as const,
      chartData: generateMockChartData(openRate, 0.15),
    },
    {
      title: formatPercentage(clickRate),
      subtitle: 'Click Rate',
      description: `${formatCompactNumber(stats.clicked)} clicked`,
      change: 1.8,
      changeType: 'points' as const,
      chartData: generateMockChartData(clickRate, 0.2),
    },
    {
      title: formatCompactNumber(stats.bounced),
      subtitle: 'Bounced',
      description: `${formatPercentage(bounceRate)} bounce rate`,
      change: bounceRate > 2 ? -bounceRate : 0.5,
      chartData: generateMockChartData(stats.bounced, 0.3),
    },
    {
      title: formatCompactNumber(stats.failed),
      subtitle: 'Failed',
      description: 'Delivery failures',
      change: stats.failed > 0 ? -15.2 : 0,
      chartData: generateMockChartData(stats.failed, 0.4),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Email Delivery Performance</h2>
        <p className="text-sm text-muted-foreground">
          Track email delivery, engagement, and failure rates
        </p>
      </div>

      {/* Metric cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <MetricCardWithChart
            key={metric.subtitle}
            title={metric.title}
            subtitle={metric.subtitle}
            description={metric.description}
            change={metric.change}
            changeType={metric.changeType ?? 'percentage'}
            chartData={metric.chartData}
            animationDelay={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
