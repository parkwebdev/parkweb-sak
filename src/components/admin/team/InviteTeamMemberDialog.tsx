/**
 * InviteTeamMemberDialog Component
 * 
 * Dialog for inviting new Pilot team members with role and permission selection.
 * 
 * @module components/admin/team/InviteTeamMemberDialog
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail01 as Mail } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isValidEmail } from '@/utils/validation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { PilotPermissionSelector } from './PilotPermissionSelector';
import type { InvitePilotMemberData, PilotTeamRole, AdminPermission } from '@/types/admin';
import { DEFAULT_PILOT_ROLE_PERMISSIONS } from '@/types/admin';

interface InviteTeamMemberDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when invite is submitted */
  onInvite: (data: InvitePilotMemberData) => Promise<boolean>;
  /** Whether invite is in progress */
  isInviting?: boolean;
}

const ROLE_OPTIONS: { value: PilotTeamRole; label: string; description: string }[] = [
  { 
    value: 'super_admin', 
    label: 'Super Admin', 
    description: 'Full access to all admin features' 
  },
  { 
    value: 'pilot_support', 
    label: 'Pilot Support', 
    description: 'Customizable access with granular permissions' 
  },
];

/**
 * Invite Pilot team member dialog with name, email, role, and permission selection.
 */
export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  onInvite,
  isInviting,
}: InviteTeamMemberDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PilotTeamRole>('pilot_support');
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>(
    DEFAULT_PILOT_ROLE_PERMISSIONS.pilot_support
  );

  // Update permissions when role changes
  useEffect(() => {
    if (role === 'super_admin') {
      // Super admins have full access, no need for permissions
      setAdminPermissions([]);
    } else {
      // Set default permissions for pilot_support
      setAdminPermissions(DEFAULT_PILOT_ROLE_PERMISSIONS.pilot_support);
    }
  }, [role]);

  const isValid = firstName.trim() && email && isValidEmail(email);

  const handleInvite = async () => {
    if (!isValid) return;

    const success = await onInvite({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      role,
      adminPermissions: role === 'pilot_support' ? adminPermissions : undefined,
    });

    if (success) {
      // Reset form on success
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('pilot_support');
    setAdminPermissions(DEFAULT_PILOT_ROLE_PERMISSIONS.pilot_support);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invite Pilot Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to the Pilot admin team. They'll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          className="flex-1 overflow-y-auto space-y-4 py-4 pr-1"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pilot-first-name">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pilot-first-name"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isInviting}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pilot-last-name">Last name</Label>
              <Input
                id="pilot-last-name"
                type="text"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isInviting}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Email and Role fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pilot-email">
                Email address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pilot-email"
                type="email"
                placeholder="team@getpilot.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isInviting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pilot-role">Role</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setRole(value as PilotTeamRole)}
                disabled={isInviting}
              >
                <SelectTrigger id="pilot-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      textValue={option.label}
                    >
                      <div className="flex flex-col items-start">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permission selector for pilot_support */}
          <AnimatePresence mode="wait">
            {role === 'pilot_support' && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={springs.smooth}
              >
                <PilotPermissionSelector
                  permissions={adminPermissions}
                  onChange={setAdminPermissions}
                />
              </motion.div>
            )}
            {role === 'super_admin' && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={springs.smooth}
                className="p-4 border border-border rounded-lg bg-muted/50 text-center"
              >
                <p className="text-sm font-medium text-foreground">Full Access</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Super Admins have unrestricted access to all platform features.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground">
            The user will receive an email invitation. When they sign up or log in, they'll be added to the Pilot team with the selected role and permissions.
          </p>
        </motion.div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isInviting}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={handleInvite} 
            disabled={!isValid || isInviting}
            loading={isInviting}
          >
            <Mail size={16} className="mr-2" aria-hidden="true" />
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
