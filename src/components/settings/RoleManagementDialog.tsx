/**
 * @fileoverview Role management dialog for team member permissions.
 * Allows admins to assign roles and granular permissions.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { SavedIndicator } from './SavedIndicator';
import { 
  TeamMember, 
  UserRole,
  AppPermission,
  PERMISSION_GROUPS, 
  PERMISSION_LABELS,
  DEFAULT_ROLE_PERMISSIONS,
} from '@/types/team';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from '@untitledui/icons';

interface RoleManagementDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (member: TeamMember, role: string, permissions: string[]) => Promise<void>;
}

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { logRoleChange } = useSecurityLog();

  // Check if user is editing their own settings vs admin managing others
  const isEditingSelf = member?.user_id === user?.id;
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('member');

  useEffect(() => {
    if (member) {
      fetchMemberRole();
      if (isEditingSelf) {
        fetchCurrentUserRole();
      }
    }
  }, [member, isEditingSelf]);

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

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const isGroupFullySelected = (groupPermissions: readonly AppPermission[]) => {
    return groupPermissions.every(p => permissions.includes(p));
  };

  const isGroupPartiallySelected = (groupPermissions: readonly AppPermission[]) => {
    const selectedCount = groupPermissions.filter(p => permissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < groupPermissions.length;
  };

  const toggleGroupPermissions = (groupPermissions: readonly AppPermission[]) => {
    if (isGroupFullySelected(groupPermissions)) {
      // Remove all group permissions
      setPermissions(prev => prev.filter(p => !groupPermissions.includes(p)));
    } else {
      // Add all group permissions
      setPermissions(prev => {
        const newPerms = new Set(prev);
        groupPermissions.forEach(p => newPerms.add(p));
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
      
      // Log the role change for security monitoring
      if (oldRole !== role) {
        logRoleChange(member.user_id, oldRole, role, true);
      }
      
      // Show saved indicator briefly before closing
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        onClose();
      }, 1500);
    } catch (error: unknown) {
      logger.error('Error in handleSave:', error);
      
      // Log failed role change attempt
      if (oldRole !== role) {
        logRoleChange(member.user_id, oldRole, role, false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  const canEditPermissions = !isEditingSelf || ['admin', 'super_admin'].includes(currentUserRole);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
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
          {!isEditingSelf && ['admin', 'super_admin'].includes(currentUserRole) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUserRole === 'super_admin' && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
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
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground capitalize">
                {role.replace('_', ' ')}
              </div>
            </div>
          )}

          {/* Permissions Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {isEditingSelf ? 'Your Permissions' : 'Permissions'}
            </Label>
            
            <div className="space-y-1 border border-border rounded-lg overflow-hidden">
              {Object.entries(PERMISSION_GROUPS).map(([group, groupPermissions]) => {
                const isExpanded = expandedGroups.has(group);
                const fullySelected = isGroupFullySelected(groupPermissions);
                const partiallySelected = isGroupPartiallySelected(groupPermissions);
                
                return (
                  <div key={group} className="border-b border-border last:border-b-0">
                    {/* Group Header */}
                    <div 
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors",
                        isExpanded && "bg-accent/30"
                      )}
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={16} className="text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{group}</span>
                      </div>
                      
                      {/* Group Toggle Checkbox */}
                      <Checkbox
                        checked={fullySelected}
                        ref={(el) => {
                          if (el) {
                            (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = partiallySelected;
                          }
                        }}
                        onCheckedChange={() => toggleGroupPermissions(groupPermissions)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!canEditPermissions}
                        className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                      />
                    </div>
                    
                    {/* Group Permissions */}
                    {isExpanded && (
                      <div className="px-3 py-2 bg-muted/30 space-y-2">
                        {groupPermissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-3 pl-6">
                            <Checkbox
                              id={permission}
                              checked={permissions.includes(permission)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission, checked as boolean)
                              }
                              disabled={!canEditPermissions}
                            />
                            <Label 
                              htmlFor={permission}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {PERMISSION_LABELS[permission]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
