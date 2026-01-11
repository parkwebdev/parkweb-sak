/**
 * Admin Plans Page
 * 
 * Manage subscription plans and Stripe integration.
 * View and edit plan features, limits, and pricing.
 * 
 * @module pages/admin/AdminPlans
 */

import { CreditCard01 } from '@untitledui/icons';

/**
 * Plans and billing management page for Super Admin.
 */
export function AdminPlans() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Plans & Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage subscription plans and view Stripe data
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <CreditCard01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Plans management components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
