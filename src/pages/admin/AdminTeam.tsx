/**
 * Admin Team Page
 * 
 * Manage the internal Pilot team.
 * Add/remove super_admin and pilot_support users.
 * 
 * @module pages/admin/AdminTeam
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Users01 } from '@untitledui/icons';
import { PilotTeamTable } from '@/components/admin/team';
import { AdminPermissionGuard } from '@/components/admin/AdminPermissionGuard';
import { useAdminTeam } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { InviteTeamMemberDialog } from '@/components/admin/team';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { useAuth } from '@/hooks/useAuth';
import type { InvitePilotMemberData } from '@/types/admin';

/**
 * Pilot team management page for Super Admin.
 */
export function AdminTeam() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { isSuperAdmin } = useRoleAuthorization();
  const { user } = useAuth();

  const { 
    team, 
    loading, 
    inviteMember, 
    removeMember, 
    updateMemberPermissions,
    isInviting, 
    isRemoving,
    isUpdating,
  } = useAdminTeam();

  const handleInvite = async (data: InvitePilotMemberData): Promise<boolean> => {
    return inviteMember(data);
  };

  // Configure top bar for this page - only super admins can invite
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={Users01} title="Pilot Team" />,
    right: isSuperAdmin ? (
      <Button size="sm" onClick={() => setInviteOpen(true)}>
        Invite Member
      </Button>
    ) : null,
  }), [isSuperAdmin]);
  useTopBar(topBarConfig);

  const prefersReducedMotion = useReducedMotion();

  return (
    <AdminPermissionGuard permission="view_team">
      <motion.div 
        className="p-6 space-y-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
      >
        {/* Team Table - no header, TopBar handles page title */}
        <PilotTeamTable
          team={team}
          loading={loading}
          onRemove={removeMember}
          onUpdatePermissions={updateMemberPermissions}
          isRemoving={isRemoving}
          isUpdating={isUpdating}
          currentUserIsSuperAdmin={isSuperAdmin}
          currentUserId={user?.id || ''}
        />

        {/* Invite Dialog */}
        <InviteTeamMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={handleInvite}
          isInviting={isInviting}
        />
      </motion.div>
    </AdminPermissionGuard>
  );
}
