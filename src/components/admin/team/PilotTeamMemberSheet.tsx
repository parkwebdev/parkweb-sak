/**
 * Pilot Team Member Detail Sheet
 * 
 * Displays member details and permissions management in a slide-over sheet.
 * Styled to match AccountDetailSheet exactly.
 * 
 * @module components/admin/team/PilotTeamMemberSheet
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CSSBubbleBackground } from '@/components/ui/css-bubble-background';
import { RoleBadge } from '@/components/admin/shared/RoleBadge';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { springs } from '@/lib/motion-variants';
import { getInitials, formatAdminDate, formatRelativeTime } from '@/lib/admin/admin-utils';
import { cn } from '@/lib/utils';
import { 
  Mail01, 
  Calendar,
  Clock,
  Shield01,
  X,
} from '@untitledui/icons';

import type { PilotTeamMember, PilotTeamRole, AdminPermission } from '@/types/admin';
import {
  ADMIN_PERMISSION_GROUPS,
  ADMIN_FEATURE_LABELS,
  ADMIN_PERMISSION_LABELS,
  DEFAULT_PILOT_ROLE_PERMISSIONS,
} from '@/types/admin';

// Banner colors - matching AccountDetailSheet exactly
const BANNER_COLORS = {
  first: '0,0,0',
  second: '30,64,175',
  third: '37,99,235',
  fourth: '59,130,246',
  fifth: '96,165,250',
  sixth: '14,45,120',
};

const BANNER_GRADIENT = {
  from: '0,0,0',
  to: '30,64,175'
};

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

interface DetailRowProps {
  icon: typeof Mail01;
  label: string;
  value: string | number | null | undefined;
  placeholder?: string;
}

/**
 * Single row displaying label and value in two-column layout
 * Matches AccountDetailSheet DetailRow exactly
 */
function DetailRow({ icon: Icon, label, value, placeholder }: DetailRowProps) {
  const displayValue = value ?? placeholder ?? `Set ${label.toLowerCase()}`;
  const isEmpty = !value;
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Icon size={16} className="shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <span className={cn(
        "text-sm text-right max-w-[200px] truncate",
        isEmpty ? "text-muted-foreground" : "text-foreground"
      )}>
        {displayValue}
      </span>
    </div>
  );
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
  
  const [contentReady, setContentReady] = useState(false);
  const [role, setRole] = useState<PilotTeamRole>('pilot_support');
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if current user can edit this member
  const isSelf = member?.user_id === user?.id;
  const isTargetSuperAdmin = member?.role === 'super_admin';
  const canEdit = !isSelf && (isSuperAdmin || !isTargetSuperAdmin);

  // Defer content mounting for smooth animation
  useEffect(() => {
    if (open && member) {
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [open, member]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-0">
        <VisuallyHidden.Root>
          <SheetTitle>Team Member Details</SheetTitle>
        </VisuallyHidden.Root>
        
        {!member ? (
          <PilotTeamMemberSheetSkeleton />
        ) : (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={contentReady ? { opacity: 1 } : { opacity: 0 }}
            transition={springs.smooth}
          >
            {/* Animated Banner Header */}
            <div className="relative h-36 overflow-hidden">
              <CSSBubbleBackground
                colors={BANNER_COLORS}
                baseGradient={BANNER_GRADIENT}
                className="absolute inset-0"
              />
              
              {/* Close button */}
              <button 
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Avatar - overlapping the banner */}
            <div className="relative px-5 -mt-10">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={member.avatar_url || undefined} alt={member.display_name || 'Team member'} />
                <AvatarFallback className="text-xl bg-muted">
                  {getInitials(member.display_name || member.email)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Role */}
            <div className="px-5 pt-3 pb-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold truncate">
                  {member.display_name || 'Unnamed Member'}
                </h2>
                <RoleBadge role={member.role} />
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 space-y-1">
              {/* Member Details Section */}
              <div className="space-y-0">
                <DetailRow 
                  icon={Mail01} 
                  label="Email" 
                  value={member.email}
                />
                <DetailRow 
                  icon={Calendar} 
                  label="Date added" 
                  value={member.created_at ? formatAdminDate(member.created_at) : undefined} 
                />
                <DetailRow 
                  icon={Clock} 
                  label="Last active" 
                  value={member.last_login_at ? formatRelativeTime(member.last_login_at) : 'Never'} 
                />
              </div>

              {/* Self-edit or Super Admin warning */}
              {!canEdit && (
                <div className="rounded-lg bg-muted/50 p-3 mt-3">
                  <p className="text-sm text-muted-foreground">
                    {isSelf
                      ? "You cannot edit your own role or permissions."
                      : "Only Super Admins can edit other Super Admin accounts."}
                  </p>
                </div>
              )}

              {/* Role Selection - inline like DetailRow */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield01 size={16} className="shrink-0" aria-hidden="true" />
                  <span>Role</span>
                </div>
                <Select
                  value={role}
                  onValueChange={(value) => handleRoleChange(value as PilotTeamRole)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-auto h-auto py-1 px-3 gap-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="pilot_support">Pilot Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions Matrix - only show for pilot_support */}
              {role === 'pilot_support' && (
                <div className="space-y-3 pt-3">
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left py-2 px-3 font-medium">Feature</th>
                            <th className="text-center py-2 px-3 font-medium w-16">
                              <div className="flex flex-col items-center gap-1">
                                <span>View</span>
                                <Checkbox
                                  checked={allViewSelected}
                                  onCheckedChange={() => toggleColumnPermissions('view')}
                                  disabled={!canEdit}
                                  aria-label="Toggle all view permissions"
                                  ref={(el) => {
                                    if (el) {
                                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = 
                                        someViewSelected && !allViewSelected;
                                    }
                                  }}
                                />
                              </div>
                            </th>
                            <th className="text-center py-2 px-3 font-medium w-16">
                              <div className="flex flex-col items-center gap-1">
                                <span>Manage</span>
                                <Checkbox
                                  checked={allManageSelected}
                                  onCheckedChange={() => toggleColumnPermissions('manage')}
                                  disabled={!canEdit}
                                  aria-label="Toggle all manage permissions"
                                  ref={(el) => {
                                    if (el) {
                                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = 
                                        someManageSelected && !allManageSelected;
                                    }
                                  }}
                                />
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrixData.map((row, index) => (
                            <tr 
                              key={row.feature}
                              className={cn(
                                index !== matrixData.length - 1 && "border-b"
                              )}
                            >
                              <td className="py-2 px-3">
                                <Label className="font-normal cursor-pointer">
                                  {row.label}
                                </Label>
                              </td>
                              <td className="text-center py-2 px-3">
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
                              </td>
                              <td className="text-center py-2 px-3">
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || !canEdit}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Loading skeleton for member details - matches AccountDetailSheet layout exactly
 */
export function PilotTeamMemberSheetSkeleton() {
  return (
    <div>
      {/* Banner skeleton */}
      <Skeleton className="h-36 w-full rounded-none" />
      
      {/* Overlapping avatar skeleton */}
      <div className="px-5 -mt-10">
        <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
      </div>
      
      {/* Name and role skeleton */}
      <div className="px-5 pt-3 pb-4 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* Detail row skeletons */}
      <div className="px-5 space-y-0">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      
      {/* Separator */}
      <div className="px-5 my-3">
        <Skeleton className="h-px w-full" />
      </div>
      
      {/* Role selector skeleton */}
      <div className="px-5 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Separator */}
      <div className="px-5 my-3">
        <Skeleton className="h-px w-full" />
      </div>
      
      {/* Action buttons skeleton */}
      <div className="px-5 pt-2 pb-5 flex justify-end gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
