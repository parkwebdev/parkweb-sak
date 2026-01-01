/**
 * @fileoverview Role management dialog for team member permissions.
 * Allows admins to assign roles and granular permissions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { SavedIndicator } from './SavedIndicator';
import { 
  TeamMember, 
  UserRole,
  AppPermission,
  PERMISSION_GROUPS, 
  DEFAULT_ROLE_PERMISSIONS,
} from '@/types/team';
import { logger } from '@/utils/logger';

interface RoleManagementDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (member: TeamMember, role: string, permissions: string[]) => Promise<void>;
}

// Feature labels for the matrix rows
const FEATURE_LABELS: Record<string, string> = {
  Dashboard: 'Dashboard',
  Ari: 'Ari Agent',
  Conversations: 'Conversations',
  Leads: 'Leads',
  Bookings: 'Bookings',
  Knowledge: 'Knowledge Base',
  'Help Articles': 'Help Articles',
  Team: 'Team',
  Settings: 'Settings',
  Billing: 'Billing',
  Integrations: 'Integrations',
  Webhooks: 'Webhooks',
  'API Keys': 'API Keys',
};

export function RoleManagementDialog({
  member,
  isOpen,
  onClose,
  onUpdate,
}: RoleManagementDialogProps) {
  const [role, setRole] = useState<UserRole>('member');
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const { user } = useAuth();
  const { logRoleChange } = useSecurityLog();

  // Check if user is editing their own settings vs admin managing others
  const isEditingSelf = member?.user_id === user?.id;
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('member');

  // Build matrix data: rows are features, columns are View/Manage
  const matrixData = useMemo(() => {
    return Object.entries(PERMISSION_GROUPS).map(([group, groupPermissions]) => {
      const viewPerm = groupPermissions.find(p => p.startsWith('view_'));
      const managePerm = groupPermissions.find(p => p.startsWith('manage_'));
      return {
        feature: group,
        label: FEATURE_LABELS[group] || group,
        viewPermission: viewPerm,
        managePermission: managePerm,
      };
    });
  }, []);

  // Calculate column states for select-all
  const allViewPermissions = matrixData.map(r => r.viewPermission).filter(Boolean) as AppPermission[];
  const allManagePermissions = matrixData.map(r => r.managePermission).filter(Boolean) as AppPermission[];
  
  const allViewSelected = allViewPermissions.every(p => permissions.includes(p));
  const someViewSelected = allViewPermissions.some(p => permissions.includes(p)) && !allViewSelected;
  
  const allManageSelected = allManagePermissions.every(p => permissions.includes(p));
  const someManageSelected = allManagePermissions.some(p => permissions.includes(p)) && !allManageSelected;

  useEffect(() => {
    if (member) {
      fetchMemberRole();
      fetchCurrentUserRole();
    }
  }, [member]);

  const fetchCurrentUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching current user role:', error);
        return;
      }

      setCurrentUserRole((data?.role as UserRole) || 'member');
    } catch (error: unknown) {
      logger.error('Error in fetchCurrentUserRole:', error);
    }
  };

  const fetchMemberRole = async () => {
    if (!member) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', member.user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching member role:', error);
        return;
      }

      if (data) {
        setRole((data.role as UserRole) || 'member');
        setPermissions((data.permissions as AppPermission[]) || []);
      } else {
        setRole('member');
        setPermissions([]);
      }
    } catch (error: unknown) {
      logger.error('Error in fetchMemberRole:', error);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Auto-populate default permissions for the role
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
  };

  const handlePermissionChange = (permission: AppPermission, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, permission]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const toggleColumnPermissions = (columnPermissions: AppPermission[], allSelected: boolean) => {
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
    if (!member) return;

    const oldRole = (member.role as UserRole) || 'member';
    setLoading(true);
    try {
      await onUpdate(member, role, permissions);
      
      if (oldRole !== role) {
        logRoleChange(member.user_id, oldRole, role, true);
      }
      
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        onClose();
      }, 1500);
    } catch (error: unknown) {
      logger.error('Error in handleSave:', error);
      
      if (oldRole !== role) {
        logRoleChange(member.user_id, oldRole, role, false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  const canEditPermissions = !isEditingSelf || currentUserRole === 'admin';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditingSelf ? 'Manage Your Settings' : 'Manage Role & Permissions'}
          </DialogTitle>
          <DialogDescription>
            {isEditingSelf 
              ? 'Update your personal preferences and settings'
              : `Update role and permissions for ${member.display_name || member.email}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Role Selection - Only show for admins managing others */}
          {!isEditingSelf && currentUserRole === 'admin' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing role will reset permissions to defaults. You can customize below.
              </p>
            </div>
          )}

          {/* Current Role - Read-only for users editing themselves */}
          {isEditingSelf && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Role</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground capitalize w-48">
                {role.replace('_', ' ')}
              </div>
            </div>
          )}

          {/* Permissions Section */}
          {role === 'admin' ? (
            <div className="p-6 border border-border rounded-lg bg-muted/50 text-center">
              <p className="text-sm font-medium text-foreground">Full Access</p>
              <p className="text-xs text-muted-foreground mt-1">
                Admins have unrestricted access to all features and settings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {isEditingSelf ? 'Your Permissions' : 'Permissions'}
              </Label>
              
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
                            disabled={!canEditPermissions}
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
                            disabled={!canEditPermissions}
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
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permissions.includes(row.viewPermission)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(row.viewPermission!, checked as boolean)
                                }
                                disabled={!canEditPermissions}
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.managePermission && (
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permissions.includes(row.managePermission)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(row.managePermission!, checked as boolean)
                                }
                                disabled={!canEditPermissions}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <SavedIndicator show={showSaved} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}