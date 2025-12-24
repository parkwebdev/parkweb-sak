/**
 * ConversationItem Component
 * 
 * Single conversation row in the conversations list sidebar.
 * Displays visitor info, status, last message preview, and activity indicators.
 * 
 * @component
 */

import React, { memo } from 'react';
import { User01 } from '@untitledui/icons';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { getStatusColor, getPriorityIndicator, getUnreadCount } from '@/lib/conversation-utils';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
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

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-accent/30 transition-colors border-b ${
        isSelected ? 'bg-accent/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
          <User01 size={16} className="text-primary" />
          {/* Unread messages indicator */}
          {unreadCount > 0 && !isVisitorActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
          )}
          {/* Active visitor indicator */}
          {isVisitorActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
          )}
          {getPriorityIndicator(priority) && !isVisitorActive && !unreadCount && (
            <div className="absolute -top-0.5 -right-0.5">
              {getPriorityIndicator(priority)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-foreground mb-0.5">
            {metadata.lead_name || metadata.lead_email || 'Anonymous'}
          </p>
          <p className="text-xs text-muted-foreground truncate mb-1">
            via {conversation.agents?.name || 'Ari'}
          </p>
          {metadata.last_message_preview && (
            <p className="text-xs text-muted-foreground/70 truncate mb-1.5">
              {metadata.last_message_preview}
              {metadata.last_message_preview.length >= 60 && '...'}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" size="sm" className={`${getStatusColor(conversation.status)} px-2 py-0.5`}>
              {conversation.status === 'human_takeover' ? 'Human' : conversation.status === 'active' ? 'AI' : conversation.status}
            </Badge>
            <span className="text-2xs text-muted-foreground">
              • {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
            </span>
          </div>
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
