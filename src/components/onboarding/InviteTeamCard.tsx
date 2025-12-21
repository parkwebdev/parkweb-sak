/**
 * Invite Team Card Component
 * 
 * CTA card encouraging users to invite team members.
 * Opens the InviteMemberDialog when clicked.
 * 
 * @module components/onboarding/InviteTeamCard
 */

import React from 'react';
import { Users01, ArrowRight } from '@untitledui/icons';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const InviteTeamCard: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const handleInvite = async (email: string): Promise<boolean> => {
    // The InviteMemberDialog handles the actual invite via its own form
    // This is just the callback after successful invite
    return true;
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="flex-1 p-4 rounded-lg border border-border bg-card"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Users01 size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground mb-1">Invite your team</h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Collaborate with your team to manage conversations and leads together.
          </p>
          <InviteMemberDialog
            onInvite={handleInvite}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                Send invite
                <ArrowRight size={14} />
              </Button>
            }
          />
        </div>
      </div>
    </motion.div>
  );
};
