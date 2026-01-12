/**
 * Admin Team Page
 * 
 * Manage the internal Pilot team.
 * Add/remove super_admin and internal users.
 * 
 * @module pages/admin/AdminTeam
 */

import { PilotTeamTable } from '@/components/admin/team';
import { useAdminTeam } from '@/hooks/admin';

/**
 * Pilot team management page for Super Admin.
 */
export function AdminTeam() {
  const { 
    team, 
    loading, 
    inviteMember, 
    removeMember, 
    isInviting, 
    isRemoving 
  } = useAdminTeam();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Pilot Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage internal team members and permissions
        </p>
      </div>

      {/* Team Table */}
      <PilotTeamTable
        team={team}
        loading={loading}
        onInvite={inviteMember}
        onRemove={removeMember}
        isInviting={isInviting}
        isRemoving={isRemoving}
      />
    </div>
  );
}
