/**
 * PilotPermissionSelector Component
 * 
 * Inline permission selector for the Pilot team invite dialog.
 * Shows when pilot_support role is selected.
 * 
 * @module components/admin/team/PilotPermissionSelector
 */

import { PermissionsMatrix } from './PermissionsMatrix';
import type { AdminPermission } from '@/types/admin';

interface PilotPermissionSelectorProps {
  permissions: AdminPermission[];
  onChange: (permissions: AdminPermission[]) => void;
}

/**
 * Inline permission matrix for selecting Pilot team member permissions.
 * Wrapper around PermissionsMatrix with header text for the invite dialog.
 */
export function PilotPermissionSelector({
  permissions,
  onChange,
}: PilotPermissionSelectorProps) {
  return (
    <PermissionsMatrix
      permissions={permissions}
      onChange={onChange}
      showHeader
    />
  );
}
