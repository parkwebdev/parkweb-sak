/**
 * RevenueMetricsCards Component
 * 
 * Cards showing key revenue metrics.
 * 
 * @module components/admin/plans/RevenueMetricsCards
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAdminCurrency, formatPercentage, formatCompactNumber } from '@/lib/admin/admin-utils';

interface RevenueMetricsCardsProps {
  /** Monthly recurring revenue */
  mrr: number;
  /** Annual recurring revenue */
  arr: number;
  /** Churn rate percentage */
  churnRate: number;
  /** Number of active subscriptions */
  activeSubscriptions: number;
  /** Loading state */
  loading?: boolean;
}

/**
 * Revenue metrics cards component.
 */
export function RevenueMetricsCards({
  mrr,
  arr,
  churnRate,
  activeSubscriptions,
  loading,
}: RevenueMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    { label: 'MRR', value: formatAdminCurrency(mrr), description: 'Monthly recurring' },
    { label: 'ARR', value: formatAdminCurrency(arr), description: 'Annual recurring' },
    { label: 'Churn Rate', value: formatPercentage(churnRate), description: 'Monthly' },
    { label: 'Active Subs', value: formatCompactNumber(activeSubscriptions), description: 'Total' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
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
