/**
 * PilotRoleManagementDialog Component
 * 
 * Manages role and permissions for Pilot team members (super_admin, pilot_support).
 * Mirrors the customer RoleManagementDialog but uses admin permission types.
 * 
 * @module components/admin/team/PilotRoleManagementDialog
 */

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import type { 
  PilotTeamMember, 
  PilotTeamRole, 
  AdminPermission,
} from '@/types/admin';
import { 
  ADMIN_PERMISSION_GROUPS, 
  DEFAULT_PILOT_ROLE_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  ADMIN_FEATURE_LABELS,
} from '@/types/admin';

interface PilotRoleManagementDialogProps {
  member: PilotTeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, role: PilotTeamRole, permissions: AdminPermission[], previousRole: PilotTeamRole, previousPermissions: AdminPermission[]) => Promise<void>;
}

/**
 * Dialog for managing Pilot team member roles and permissions.
 */
export function PilotRoleManagementDialog({
  member,
  isOpen,
  onClose,
  onUpdate,
}: PilotRoleManagementDialogProps) {
  const { user } = useAuth();
  const { logRoleChange } = useSecurityLog();
  
  const [role, setRole] = useState<PilotTeamRole>('pilot_support');
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(false);

  // Prevent self-editing
  const isEditingSelf = member?.user_id === user?.id;

  // Build matrix data: rows are features, columns are View/Manage
  const matrixData = useMemo(() => {
    return Object.entries(ADMIN_PERMISSION_GROUPS).map(([group, groupPermissions]) => {
      const viewPerm = groupPermissions.find(p => p.startsWith('view_'));
      const managePerm = groupPermissions.find(p => !p.startsWith('view_'));
      return {
        feature: group,
        label: ADMIN_FEATURE_LABELS[group] || group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' '),
        viewPermission: viewPerm,
        managePermission: managePerm,
      };
    });
  }, []);

  // Calculate column states for select-all
  const allViewPermissions = matrixData.map(r => r.viewPermission).filter(Boolean) as AdminPermission[];
  const allManagePermissions = matrixData.map(r => r.managePermission).filter(Boolean) as AdminPermission[];
  
  const allViewSelected = allViewPermissions.every(p => permissions.includes(p));
  const someViewSelected = allViewPermissions.some(p => permissions.includes(p)) && !allViewSelected;
  
  const allManageSelected = allManagePermissions.every(p => permissions.includes(p));
  const someManageSelected = allManagePermissions.some(p => permissions.includes(p)) && !allManageSelected;

  // Initialize state when member changes
  useEffect(() => {
    if (member) {
      setRole(member.role);
      setPermissions(member.admin_permissions || []);
    }
  }, [member]);

  const handleRoleChange = (newRole: PilotTeamRole) => {
    setRole(newRole);
    // Auto-populate default permissions for the role
    setPermissions(DEFAULT_PILOT_ROLE_PERMISSIONS[newRole] || []);
  };

  const handlePermissionChange = (permission: AdminPermission, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, permission]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const toggleColumnPermissions = (columnPermissions: AdminPermission[], allSelected: boolean) => {
    if (allSelected) {
      setPermissions(prev => prev.filter(p => !columnPermissions.includes(p)));
    } else {
      setPermissions(prev => {
        const newPerms = new Set(prev);
        columnPermissions.forEach(p => newPerms.add(p));
        return Array.from(newPerms);
      });
    }
  };

  const handleSave = async () => {
    if (!member || isEditingSelf) return;

    setLoading(true);
    try {
      // Log role change if role changed
      // Log role change if role changed
      if (member.role !== role) {
        logRoleChange(member.user_id, member.role, role, true);
      }
      
      await onUpdate(member.user_id, role, permissions, member.role, member.admin_permissions || []);
      onClose();
    } catch (error: unknown) {
      toast.error('Failed to update permissions', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Role & Permissions</DialogTitle>
          <DialogDescription>
            Update role and permissions for {member.display_name || member.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isEditingSelf ? (
            <div className="p-6 border border-border rounded-lg bg-muted/50 text-center">
              <p className="text-sm font-medium text-foreground">Cannot Edit Own Permissions</p>
              <p className="text-xs text-muted-foreground mt-1">
                You cannot modify your own role or permissions. Ask another super admin to make changes.
              </p>
            </div>
          ) : (
            <>
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={(v) => handleRoleChange(v as PilotTeamRole)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="pilot_support">Pilot Support</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Changing role will reset permissions to defaults. You can customize below.
                </p>
              </div>

          {/* Permissions Section */}
          {role === 'super_admin' ? (
            <div className="p-6 border border-border rounded-lg bg-muted/50 text-center">
              <p className="text-sm font-medium text-foreground">Full Access</p>
              <p className="text-xs text-muted-foreground mt-1">
                Super Admins have unrestricted access to all platform features and settings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Permissions</Label>
              
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[45%] font-medium">Feature</TableHead>
                      <TableHead className="w-[27.5%] text-center font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Checkbox
                            checked={allViewSelected}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someViewSelected;
                              }
                            }}
                            onCheckedChange={() => toggleColumnPermissions(allViewPermissions, allViewSelected)}
                            className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                          />
                          <span>View</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-[27.5%] text-center font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Checkbox
                            checked={allManageSelected}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someManageSelected;
                              }
                            }}
                            onCheckedChange={() => toggleColumnPermissions(allManagePermissions, allManageSelected)}
                            className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                          />
                          <span>Manage</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixData.map((row) => (
                      <TableRow 
                        key={row.feature} 
                        className="transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="text-sm font-medium text-foreground">
                          {row.label}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.viewPermission && (
                            <div className="flex justify-center" title={ADMIN_PERMISSION_LABELS[row.viewPermission]}>
                              <Checkbox
                                checked={permissions.includes(row.viewPermission)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(row.viewPermission!, checked as boolean)
                                }
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.managePermission && (
                            <div className="flex justify-center" title={ADMIN_PERMISSION_LABELS[row.managePermission]}>
                              <Checkbox
                                checked={permissions.includes(row.managePermission)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(row.managePermission!, checked as boolean)
                                }
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-border mt-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading} disabled={isEditingSelf}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
