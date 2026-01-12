/**
 * Admin Team Page
 * 
 * Manage the internal Pilot team.
 * Add/remove super_admin and internal users.
 * 
 * @module pages/admin/AdminTeam
 */

import { useState, useMemo, useCallback } from 'react';
import { Users02 } from '@untitledui/icons';
import { PilotTeamTable } from '@/components/admin/team';
import { useAdminTeam } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { InviteTeamMemberDialog } from '@/components/admin/team/InviteTeamMemberDialog';

/**
 * Pilot team management page for Super Admin.
 */
export function AdminTeam() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { 
    team, 
    loading, 
    inviteMember, 
    removeMember, 
    isInviting, 
    isRemoving 
  } = useAdminTeam();

  const handleInvite = useCallback(async () => {
    await inviteMember(inviteEmail);
    setInviteEmail('');
    setInviteOpen(false);
  }, [inviteMember, inviteEmail]);

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
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        onInvite={handleInvite}
        isInviting={isInviting}
      />
    </div>
  );
}
