/**
 * Admin Revenue Page
 * 
 * Revenue analytics and metrics dashboard.
 * MRR, churn, growth, and subscription funnel.
 * 
 * @module pages/admin/AdminRevenue
 */

import { 
  RevenueOverview, 
  MRRChart, 
  ChurnChart, 
  SubscriptionFunnel, 
  RevenueByPlan, 
  TopAccountsTable 
} from '@/components/admin/revenue';
import { useRevenueAnalytics } from '@/hooks/admin';

/**
 * Revenue analytics page for Super Admin.
 */
export function AdminRevenue() {
  const { data, loading } = useRevenueAnalytics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor revenue, growth, and subscription metrics
        </p>
      </div>

      {/* Overview Cards */}
      <RevenueOverview data={data} loading={loading} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MRRChart data={data?.mrrHistory || []} loading={loading} />
        <ChurnChart data={data?.churnHistory || []} loading={loading} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SubscriptionFunnel data={data?.funnel ?? null} loading={loading} />
        <RevenueByPlan data={data?.byPlan || []} loading={loading} />
        <TopAccountsTable accounts={data?.topAccounts || []} loading={loading} />
      </div>
    </div>
  );
}
