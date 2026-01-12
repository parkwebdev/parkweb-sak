/**
 * SubscriptionFunnel Component
 * 
 * Visualization of trial to paid conversion funnel.
 * 
 * @module components/admin/revenue/SubscriptionFunnel
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPercentage } from '@/lib/admin/admin-utils';

interface FunnelData {
  trials: number;
  active: number;
  churned: number;
  conversionRate: number;
}

interface SubscriptionFunnelProps {
  /** Funnel data */
  data: FunnelData | null;
  /** Loading state */
  loading: boolean;
}

/**
 * Subscription funnel visualization.
 */
export function SubscriptionFunnel({ data, loading }: SubscriptionFunnelProps) {
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
