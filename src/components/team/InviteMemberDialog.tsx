import React, { useState } from 'react';
import { Mail01 as Mail } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isValidEmail } from '@/utils/validation';

interface InviteMemberDialogProps {
  onInvite: (email: string) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  onInvite,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email || !isValidEmail(email)) {
      return;
    }

    setLoading(true);
    const success = await onInvite(email);
    setLoading(false);

    if (success) {
      setEmail('');
      setIsOpen(false);
    }
  };

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
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
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
              disabled={loading || !email || !isValidEmail(email)}
            >
              <Mail size={16} className="mr-2" />
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};