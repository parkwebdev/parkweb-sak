import React, { useState } from 'react';
import { Mail01 as Mail, AlertCircle } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isValidEmail } from '@/utils/validation';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InviteMemberData } from '@/types/team';

interface InviteMemberDialogProps {
  onInvite: (data: InviteMemberData) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({
  onInvite,
  trigger
}: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new team member via email.
          </DialogDescription>
        </DialogHeader>

        {limitCheck.isAtLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your plan limit of {limitCheck.limit} team members. Upgrade to invite more.
            </AlertDescription>
          </Alert>
        )}

        {limitCheck.isNearLimit && !limitCheck.isAtLimit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {limitCheck.limit - limitCheck.current + 1} team member slots remaining.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
          <div className="flex justify-end space-x-2">
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
              <Mail size={16} className="mr-2" />
              Send Invitation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
