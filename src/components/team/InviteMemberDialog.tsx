import React, { useState } from 'react';
import { Mail01 as Mail, AlertCircle } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isValidEmail } from '@/utils/validation';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InviteMemberData } from '@/types/team';

interface InviteMemberDialogProps {
  onInvite: (data: InviteMemberData) => Promise<boolean>;
  trigger?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function InviteMemberDialog({
  onInvite,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: InviteMemberDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { canAddTeamMember, showLimitWarning } = usePlanLimits();
  const limitCheck = canAddTeamMember();

  const handleInvite = async () => {
    if (!firstName.trim()) {
      return;
    }
    if (!email || !isValidEmail(email)) {
      return;
    }

    if (!limitCheck.allowed) {
      showLimitWarning('team members', limitCheck, 'invite');
      return;
    }

    setLoading(true);
    const success = await onInvite({ 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      email: email.trim() 
    });
    setLoading(false);

    if (success) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setIsOpen(false);
    }
  };

  const isValid = firstName.trim() && email && isValidEmail(email);

  const defaultTrigger = (
    <Button size="sm" className="w-full sm:w-auto ml-auto">
      Invite Member
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only show trigger when not in controlled mode */}
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new team member via email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {limitCheck.isAtLimit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                You've reached your plan limit of {limitCheck.limit} team members. Upgrade to invite more.
              </AlertDescription>
            </Alert>
          )}

          {limitCheck.isNearLimit && !limitCheck.isAtLimit && !limitCheck.isUnlimited && limitCheck.limit !== null && (
            <Alert>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                You have {limitCheck.limit - limitCheck.current + 1} team member slots remaining.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="coworker@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleInvite}
            loading={loading}
            disabled={!isValid}
          >
            <Mail size={16} className="mr-2" aria-hidden="true" />
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
