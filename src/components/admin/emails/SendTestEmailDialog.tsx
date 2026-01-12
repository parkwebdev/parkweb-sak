/**
 * SendTestEmailDialog Component
 * 
 * Dialog for sending test emails.
 * 
 * @module components/admin/emails/SendTestEmailDialog
 */

import { useState } from 'react';
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

interface SendTestEmailDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when test email is sent */
  onSend: (email: string) => Promise<void>;
  /** Template name for display */
  templateName?: string;
  /** Whether send is in progress */
  isSending?: boolean;
}

/**
 * Send test email dialog.
 */
export function SendTestEmailDialog({
  open,
  onOpenChange,
  onSend,
  templateName,
  isSending,
}: SendTestEmailDialogProps) {
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    if (email) {
      await onSend(email);
      setEmail('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email using the "{templateName}" template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!email || isSending}>
            {isSending ? 'Sending...' : 'Send Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
