/**
 * ChatHeader Component
 * 
 * Header bar for the chat area showing visitor name, active status indicator,
 * and action buttons (takeover, return to AI, close, reopen).
 * Respects manage_conversations permission for action buttons.
 * 
 * @component
 */

import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

export interface ChatHeaderProps {
  conversation: Conversation;
  isVisitorActive: boolean;
  onTakeover: () => void;
  onReturnToAI: () => void;
  onClose: () => void;
  onReopen: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  conversation,
  isVisitorActive,
  onTakeover,
  onReturnToAI,
  onClose,
  onReopen,
}: ChatHeaderProps) {
  const { hasPermission, isAdmin } = useRoleAuthorization();
  const canManageConversations = isAdmin || hasPermission('manage_conversations');
  
  const metadata = (conversation.metadata || {}) as ConversationMetadata;
  const displayName = metadata.lead_name || metadata.lead_email || 'Anonymous';

  return (
    <div className="h-14 px-6 border-b flex items-center justify-between bg-background shrink-0">
      <div className="flex items-center gap-3">
        {/* Active indicator dot */}
        {isVisitorActive && (
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <div className="absolute w-2.5 h-2.5 rounded-full border-2 border-success animate-ping" />
          </div>
        )}
        <p className="font-medium text-sm text-foreground">
          {displayName}
        </p>
      </div>
      
      {canManageConversations && (
        <div className="flex items-center gap-2">
          {conversation.status === 'active' && (
            <Button size="sm" variant="outline" onClick={onTakeover}>
              Take Over
            </Button>
          )}
          {conversation.status === 'human_takeover' && (
            <Button size="sm" variant="outline" onClick={onReturnToAI}>
              Return to AI
            </Button>
          )}
          {conversation.status !== 'closed' && (
            <Button size="sm" variant="destructive" onClick={onClose}>
              Close
            </Button>
          )}
          {conversation.status === 'closed' && (
            <Button size="sm" variant="outline" onClick={onReopen}>
              Re-open
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

export default ChatHeader;
