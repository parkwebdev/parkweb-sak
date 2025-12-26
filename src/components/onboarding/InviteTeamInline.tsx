/**
 * Invite Team Inline Component
 * 
 * Inline email input and send button for inviting team members.
 * Used in the completed onboarding state.
 * 
 * @module components/onboarding/InviteTeamInline
 */

import React, { useState } from 'react';
import { Users01, Send01, Check } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { isValidEmail } from '@/utils/validation';

export const InviteTeamInline: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !user) return;

    // Email validation using centralized utility
    if (!isValidEmail(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: email.trim(),
          invitedBy: user.email || 'Team Admin',
          companyName: 'our team'
        }
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Invitation sent!', {
        description: `Team invitation sent to ${email.trim()}`
      });
      
      // Reset after a delay
      setTimeout(() => {
        setEmail('');
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      logger.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users01 size={16} />
        <span>Invite your team</span>
      </div>
      
      <form onSubmit={handleInvite} className="flex gap-2">
        <Input
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || isSuccess}
          className="flex-1"
          size="sm"
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={isLoading || isSuccess || !email.trim()}
          className="gap-1.5"
        >
          {isSuccess ? (
            <>
              <Check size={14} />
              Sent
            </>
          ) : (
            <>
              <Send01 size={14} />
              Send
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
