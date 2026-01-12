/**
 * Admin Team Page
 * 
 * Manage the internal Pilot team.
 * Add/remove super_admin and pilot_support users.
 * 
 * @module pages/admin/AdminTeam
 */

import { useState, useMemo } from 'react';
import { Users02 } from '@untitledui/icons';
import { PilotTeamTable } from '@/components/admin/team';
import { useAdminTeam } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { InviteTeamMemberDialog } from '@/components/admin/team';
import type { InvitePilotMemberData } from '@/types/admin';

/**
 * Pilot team management page for Super Admin.
 */
export function AdminTeam() {
  const [inviteOpen, setInviteOpen] = useState(false);

  const { 
    team, 
    loading, 
    inviteMember, 
    removeMember, 
    isInviting, 
    isRemoving 
  } = useAdminTeam();

  const handleInvite = async (data: InvitePilotMemberData): Promise<boolean> => {
    return inviteMember(data);
  };

  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={Users02} title="Pilot Team" />,
    right: (
      <Button size="sm" onClick={() => setInviteOpen(true)}>
        Invite Member
      </Button>
    ),
  }), []);
  useTopBar(topBarConfig);

  return (
    <div className="p-6 space-y-6">
      {/* Team Table - no header, TopBar handles page title */}
      <PilotTeamTable
        team={team}
        loading={loading}
        onRemove={removeMember}
        isRemoving={isRemoving}
      />

      {/* Invite Dialog */}
      <InviteTeamMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
        isInviting={isInviting}
      />
    </div>
  );
}
