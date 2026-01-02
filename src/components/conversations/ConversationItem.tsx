/**
 * ConversationItem Component
 * 
 * Single conversation row in the conversations list sidebar.
 * Displays visitor info, status, last message preview, and activity indicators.
 * 
 * @component
 */

import React, { memo } from 'react';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { getStatusColor, getUnreadCount } from '@/lib/conversation-utils';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
  active_takeover?: {
    taken_over_by: string;
    profiles: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
};

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  isVisitorActive: boolean;
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onClick,
  isVisitorActive,
}: ConversationItemProps) {
  const metadata = (conversation.metadata || {}) as ConversationMetadata;
  const priority = metadata.priority;
  const unreadCount = getUnreadCount(conversation);

  // Get first name from display_name for human takeover badge
  const takeoverFirstName = conversation.active_takeover?.profiles?.display_name?.split(' ')[0];
  const takeoverAvatarUrl = conversation.active_takeover?.profiles?.avatar_url;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-accent/30 transition-colors border-b ${
        isSelected ? 'bg-accent/50' : ''
      }`}
    >
      <div className="flex flex-col gap-1">
        {/* Lead name with activity indicators */}
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate text-foreground flex-1">
            {metadata.lead_name || metadata.lead_email || 'Anonymous'}
          </p>
          {/* Unread indicator */}
          {unreadCount > 0 && !isVisitorActive && (
            <span className="w-2 h-2 bg-destructive rounded-full flex-shrink-0" />
          )}
          {/* Active visitor indicator */}
          {isVisitorActive && (
            <span className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
          )}
        </div>
        
        {/* Message preview */}
        {metadata.last_message_preview && (
          <p className="text-xs text-muted-foreground/70 truncate">
            {metadata.last_message_preview}
            {metadata.last_message_preview.length >= 60 && '...'}
          </p>
        )}
        
        {/* Status badge and timestamp */}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" size="sm" className={`${getStatusColor(conversation.status)} px-2 py-0.5`}>
            {conversation.status === 'human_takeover' ? (
              <span className="flex items-center gap-1">
                {takeoverAvatarUrl && (
                  <img 
                    src={takeoverAvatarUrl} 
                    alt="" 
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                )}
                {takeoverFirstName || 'Human'}
              </span>
            ) : conversation.status === 'active' ? (
              <span className="flex items-center gap-1">
                <AriAgentsIcon className="w-3 h-3" />
                Ari
              </span>
            ) : conversation.status}
          </Badge>
          <span className="text-2xs text-muted-foreground">
            • {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.status === nextProps.conversation.status &&
    prevProps.conversation.updated_at === nextProps.conversation.updated_at &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isVisitorActive === nextProps.isVisitorActive &&
    JSON.stringify(prevProps.conversation.metadata) === JSON.stringify(nextProps.conversation.metadata)
  );
});

export default ConversationItem;
