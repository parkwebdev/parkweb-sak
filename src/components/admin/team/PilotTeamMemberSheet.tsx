/**
 * PilotTeamMemberSheet Component
 * 
 * Sheet panel for viewing and editing Pilot team member details and permissions.
 * Replaces the modal dialog with a slide-in sheet pattern.
 * 
 * @module components/admin/team/PilotTeamMemberSheet
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/admin/shared/RoleBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Mail01, Calendar, Clock } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/admin/admin-utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import type { PilotTeamMember, PilotTeamRole, AdminPermission } from '@/types/admin';
import {
  ADMIN_PERMISSION_GROUPS,
  ADMIN_FEATURE_LABELS,
  ADMIN_PERMISSION_LABELS,
  DEFAULT_PILOT_ROLE_PERMISSIONS,
} from '@/types/admin';

interface PilotTeamMemberSheetProps {
  member: PilotTeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    userId: string,
    role: PilotTeamRole,
    permissions: AdminPermission[],
    previousRole: PilotTeamRole,
    previousPermissions: AdminPermission[]
  ) => Promise<void>;
}

/**
 * Sheet component for managing Pilot team member details and permissions.
 */
export function PilotTeamMemberSheet({
  member,
  open,
  onOpenChange,
  onUpdate,
}: PilotTeamMemberSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const { isSuperAdmin } = useRoleAuthorization();
  const { logSecurityEvent } = useSecurityLog();

  const [role, setRole] = useState<PilotTeamRole>('pilot_support');
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if current user can edit this member
  const isSelf = member?.user_id === user?.id;
  const isTargetSuperAdmin = member?.role === 'super_admin';
  const canEdit = !isSelf && (isSuperAdmin || !isTargetSuperAdmin);

  // Initialize state when member changes
  useEffect(() => {
    if (member) {
      setRole(member.role);
      setPermissions(member.admin_permissions || []);
    }
  }, [member]);

  // Build the permissions matrix data
  const matrixData = useMemo(() => {
    return Object.entries(ADMIN_PERMISSION_GROUPS).map(([feature, perms]) => ({
      feature,
      label: ADMIN_FEATURE_LABELS[feature] || feature,
      viewPermission: perms.find((p) => p.startsWith('view_')) as AdminPermission | undefined,
      managePermission: perms.find((p) => p.startsWith('manage_')) as AdminPermission | undefined,
    }));
  }, []);

  // Calculate column selection states
  const allViewSelected = matrixData.every(
    (row) => !row.viewPermission || permissions.includes(row.viewPermission)
  );
  const someViewSelected = matrixData.some(
    (row) => row.viewPermission && permissions.includes(row.viewPermission)
  );
  const allManageSelected = matrixData.every(
    (row) => !row.managePermission || permissions.includes(row.managePermission)
  );
  const someManageSelected = matrixData.some(
    (row) => row.managePermission && permissions.includes(row.managePermission)
  );

  const handleRoleChange = (newRole: PilotTeamRole) => {
    setRole(newRole);
    // Reset permissions to defaults for the new role
    setPermissions(DEFAULT_PILOT_ROLE_PERMISSIONS[newRole] || []);
  };

  const handlePermissionChange = (permission: AdminPermission, checked: boolean) => {
    if (checked) {
      setPermissions((prev) => [...prev, permission]);
    } else {
      setPermissions((prev) => prev.filter((p) => p !== permission));
    }
  };

  const toggleColumnPermissions = (column: 'view' | 'manage') => {
    const columnPermissions = matrixData
      .map((row) => (column === 'view' ? row.viewPermission : row.managePermission))
      .filter((p): p is AdminPermission => !!p);

    const allSelected = column === 'view' ? allViewSelected : allManageSelected;

    if (allSelected) {
      // Deselect all in this column
      setPermissions((prev) => prev.filter((p) => !columnPermissions.includes(p)));
    } else {
      // Select all in this column
      setPermissions((prev) => [...new Set([...prev, ...columnPermissions])]);
    }
  };

  const handleSave = async () => {
    if (!member || !canEdit) return;

    setLoading(true);
    try {
      await onUpdate(
        member.user_id,
        role,
        permissions,
        member.role,
        member.admin_permissions || []
      );

      // Log role change if it changed
      if (role !== member.role) {
        await logSecurityEvent({
          action: 'pilot_role_change',
          resourceType: 'pilot_team',
          resourceId: member.user_id,
          details: {
            previous_role: member.role,
            new_role: role,
          },
        });
      }

      onOpenChange(false);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Banner Header */}
        <div className="relative">
          <div className="h-20 bg-gradient-to-br from-foreground/90 to-foreground/70" />
          
          {/* Avatar - overlapping banner */}
          <motion.div
            className="absolute -bottom-8 left-6"
            initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.snappy}
          >
            <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-muted">
                {getInitials(member.display_name || member.email)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-12 pb-6">
          <SheetHeader className="text-left mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle className="text-lg truncate">
                  {member.display_name || 'Unnamed Member'}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 mt-1">
                  <Mail01 size={14} aria-hidden="true" />
                  <span className="truncate">{member.email}</span>
                </SheetDescription>
              </div>
              <RoleBadge role={member.role} />
            </div>
          </SheetHeader>

          {/* Member Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} aria-hidden="true" />
              <span>Added {member.created_at ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true }) : 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} aria-hidden="true" />
              <span>Last login {member.last_login_at ? formatDistanceToNow(new Date(member.last_login_at), { addSuffix: true }) : 'Never'}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Self-edit or Super Admin warning */}
          {!canEdit && (
            <div className="rounded-lg bg-muted/50 p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                {isSelf
                  ? "You cannot edit your own role or permissions."
                  : "Only Super Admins can edit other Super Admin accounts."}
              </p>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2 mb-6">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(value) => handleRoleChange(value as PilotTeamRole)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="pilot_support">Pilot Support</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'super_admin'
                ? 'Full access to all admin features'
                : 'Access based on assigned permissions'}
            </p>
          </div>

          {/* Permissions Matrix (only for pilot_support) */}
          {role === 'pilot_support' && (
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Feature</TableHead>
                      <TableHead className="w-[80px] text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={allViewSelected}
                            onCheckedChange={() => toggleColumnPermissions('view')}
                            disabled={!canEdit}
                            aria-label="Select all view permissions"
                            {...(someViewSelected && !allViewSelected ? { 'data-state': 'indeterminate' } : {})}
                          />
                          <span className="text-xs">View</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={allManageSelected}
                            onCheckedChange={() => toggleColumnPermissions('manage')}
                            disabled={!canEdit}
                            aria-label="Select all manage permissions"
                            {...(someManageSelected && !allManageSelected ? { 'data-state': 'indeterminate' } : {})}
                          />
                          <span className="text-xs">Manage</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixData.map((row) => (
                      <TableRow key={row.feature}>
                        <TableCell className="font-medium text-sm">
                          {row.label}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.viewPermission && (
                            <Checkbox
                              checked={permissions.includes(row.viewPermission)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(row.viewPermission!, !!checked)
                              }
                              disabled={!canEdit}
                              aria-label={ADMIN_PERMISSION_LABELS[row.viewPermission]}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.managePermission && (
                            <Checkbox
                              checked={permissions.includes(row.managePermission)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(row.managePermission!, !!checked)
                              }
                              disabled={!canEdit}
                              aria-label={ADMIN_PERMISSION_LABELS[row.managePermission]}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t bg-background">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canEdit || loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Skeleton loader for the sheet content.
 */
export function PilotTeamMemberSheetSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
