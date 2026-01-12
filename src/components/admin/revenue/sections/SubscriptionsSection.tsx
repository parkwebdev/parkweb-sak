/**
 * SubscriptionsSection Component
 * 
 * Displays subscription funnel and plan distribution.
 * 
 * @module components/admin/revenue/sections/SubscriptionsSection
 */

import { SubscriptionFunnel } from '../SubscriptionFunnel';
import { RevenueByPlan } from '../RevenueByPlan';
import type { RevenueData } from '@/types/admin';

interface SubscriptionsSectionProps {
  data: RevenueData | null;
  loading: boolean;
}

export function SubscriptionsSection({ data, loading }: SubscriptionsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Funnel and Plan Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionFunnel data={data?.funnel ?? null} loading={loading} />
        <RevenueByPlan data={data?.byPlan || []} loading={loading} />
      </div>
    </div>
  );
}
