/**
 * Admin Account Detail Page
 * 
 * Detailed view of a specific user account.
 * Shows usage, subscription, conversations, and provides impersonation.
 * 
 * @module pages/admin/AdminAccountDetail
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from '@untitledui/icons';

/**
 * Individual account detail page for Super Admin.
 */
export function AdminAccountDetail() {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/admin/accounts" 
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-foreground">Account Details</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {userId}
          </p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Account detail components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
