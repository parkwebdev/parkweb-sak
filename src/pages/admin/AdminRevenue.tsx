/**
 * Admin Revenue Page
 * 
 * Revenue analytics and metrics dashboard.
 * MRR, churn, growth, and subscription funnel.
 * 
 * @module pages/admin/AdminRevenue
 */

import { TrendUp01 } from '@untitledui/icons';

/**
 * Revenue analytics page for Super Admin.
 */
export function AdminRevenue() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor revenue, growth, and subscription metrics
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <TrendUp01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Revenue analytics components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
