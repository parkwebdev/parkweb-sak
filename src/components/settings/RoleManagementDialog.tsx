import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { SavedIndicator } from './SavedIndicator';
import { TeamMember, PERMISSION_GROUPS, PERMISSION_LABELS } from '@/types/team';

interface RoleManagementDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (member: TeamMember, role: string, permissions: string[]) => Promise<void>;
}


export const RoleManagementDialog: React.FC<RoleManagementDialogProps> = ({
  member,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [role, setRole] = useState<string>('member');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const { user } = useAuth();
  const { logRoleChange } = useSecurityLog();

  // Check if user is editing their own settings vs admin managing others
  const isEditingSelf = member?.user_id === user?.id;
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

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
        console.error('Error fetching current user role:', error);
        return;
      }

      setCurrentUserRole(data?.role || 'member');
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
    }
  };

  useEffect(() => {
    if (member) {
      fetchMemberRole();
    }
  }, [member]);

  const fetchMemberRole = async () => {
    if (!member) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', member.user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching member role:', error);
        return;
      }

      if (data) {
        setRole(data.role || 'member');
        setPermissions(data.permissions || []);
      } else {
        setRole('member');
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error in fetchMemberRole:', error);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    
    // Auto-assign permissions based on role
    if (newRole === 'super_admin') {
      setPermissions(Object.keys(PERMISSION_LABELS));
    } else if (newRole === 'admin') {
      setPermissions(Object.keys(PERMISSION_LABELS));
    } else if (newRole === 'manager') {
      setPermissions([
        'view_team', 'manage_projects', 'view_projects', 
        'manage_onboarding', 'view_onboarding',
        'manage_scope_works', 'view_scope_works',
        'view_settings'
      ]);
    } else {
      setPermissions(['view_team', 'view_projects', 'view_onboarding', 'view_scope_works']);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, permission]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const handleSave = async () => {
    if (!member) return;

    const oldRole = member.role || 'member';
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
    } catch (error) {
      console.error('Error in handleSave:', error);
      
      // Log failed role change attempt
      if (oldRole !== role) {
        logRoleChange(member.user_id, oldRole, role, false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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

        <div className="space-y-4">
          {/* Show role selection only for admins managing others */}
          {!isEditingSelf && ['admin', 'super_admin'].includes(currentUserRole) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show current role (read-only) for users editing themselves */}
          {isEditingSelf && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Role</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                {role === 'super_admin' ? 'Super Admin' : 
                 role === 'admin' ? 'Admin' : 
                 role === 'manager' ? 'Manager' : 'Member'}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {isEditingSelf ? 'Your Permissions' : 'Permissions'}
            </Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(PERMISSION_GROUPS).map(([group, groupPermissions]) => (
                <div key={group} className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {group}
                  </h4>
                  <div className="space-y-2 pl-2">
                    {groupPermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={permissions.includes(permission)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission, checked as boolean)
                          }
                          disabled={isEditingSelf && !['admin', 'super_admin'].includes(currentUserRole)}
                        />
                        <Label 
                          htmlFor={permission}
                          className="text-sm cursor-pointer"
                        >
                          {PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <SavedIndicator show={showSaved} />
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={loading}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};