/**
 * Admin Emails Page
 * 
 * Manage email templates and feature announcements.
 * Preview and test email delivery.
 * 
 * @module pages/admin/AdminEmails
 */

import { Mail01 } from '@untitledui/icons';

/**
 * Email templates and announcements page for Super Admin.
 */
export function AdminEmails() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Emails</h1>
        <p className="text-sm text-muted-foreground">
          Manage email templates and feature announcements
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <Mail01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Email template components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
