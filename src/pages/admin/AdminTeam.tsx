/**
 * Admin Team Page
 * 
 * Manage the internal Pilot team.
 * Add/remove super_admin and internal users.
 * 
 * @module pages/admin/AdminTeam
 */

import { Users01 } from '@untitledui/icons';

/**
 * Pilot team management page for Super Admin.
 */
export function AdminTeam() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Pilot Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage internal team members and permissions
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <Users01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Team management components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
