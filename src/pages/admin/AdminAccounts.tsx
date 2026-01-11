/**
 * Admin Accounts Page
 * 
 * Manage all user accounts on the platform.
 * Includes search, filtering, and impersonation capabilities.
 * 
 * @module pages/admin/AdminAccounts
 */

import { Users01 } from '@untitledui/icons';

/**
 * Accounts management page for Super Admin.
 */
export function AdminAccounts() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and subscriptions
          </p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <Users01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Account management components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
