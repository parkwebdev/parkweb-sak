/**
 * MessageThread Component
 * 
 * Scrollable message list container for the admin inbox.
 * Handles message filtering, grouping logic for continuation detection,
 * and renders AdminMessageBubble for each message.
 * 
 * @component
 */

import React, { memo, useCallback, useMemo, forwardRef } from 'react';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { AdminMessageBubble } from './AdminMessageBubble';
import { updateMessageReaction } from '@/lib/conversation-utils';
import { SkeletonMessageThread } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import type { MessageMetadata, MessageReaction } from '@/types/metadata';

type Message = Tables<'messages'>;

export interface MessageThreadProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  visitorName: string;
  showTranslation: boolean;
  translatedMessages: Record<string, string>;
  isNewMessage: (messageId: string) => boolean;
  loadingMessages: boolean;
}

export const MessageThread = memo(forwardRef<HTMLDivElement, MessageThreadProps>(function MessageThread({
  messages,
  setMessages,
  visitorName,
  showTranslation,
  translatedMessages,
  isNewMessage,
  loadingMessages,
}, ref) {
  // Filter out tool call placeholder messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const meta = (msg.metadata || {}) as Record<string, unknown>;
      // Hide empty messages that are tool call placeholders
      if (!msg.content?.trim() && meta.message_type === 'tool_call') {
        return false;
      }
      return true;
    });
  }, [messages]);

  // Handle adding reactions with optimistic update
  const handleAddReaction = useCallback((messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const msgMetadata = (message.metadata || {}) as MessageMetadata;
    const reactions = msgMetadata.reactions;
    
    // Check if admin already reacted with this emoji
    const existingReaction = reactions?.find(r => r.emoji === emoji);
    if (existingReaction?.adminReacted) return;
    
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const meta = (m.metadata || {}) as MessageMetadata;
      const currentReactions = meta.reactions || [];
      const reactionIdx = currentReactions.findIndex((r: MessageReaction) => r.emoji === emoji);
      
      let newReactions;
      if (reactionIdx >= 0) {
        newReactions = [...currentReactions];
        newReactions[reactionIdx] = { ...newReactions[reactionIdx], count: newReactions[reactionIdx].count + 1, adminReacted: true };
      } else {
        newReactions = [...currentReactions, { emoji, count: 1, userReacted: false, adminReacted: true }];
      }
      
      return { ...m, metadata: { ...meta, reactions: newReactions } as unknown as Message['metadata'] };
    }));
    
    // Persist to database
    updateMessageReaction(messageId, emoji, 'add', 'admin');
  }, [messages, setMessages]);

  // Handle removing reactions with optimistic update
  const handleRemoveReaction = useCallback((messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const msgMetadata = (message.metadata || {}) as MessageMetadata;
    const reactions = msgMetadata.reactions;
    
    const existingReaction = reactions?.find(r => r.emoji === emoji);
    if (!existingReaction?.adminReacted) return;
    
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const meta = (m.metadata || {}) as MessageMetadata;
      const currentReactions = meta.reactions || [];
      const reactionIdx = currentReactions.findIndex((r: MessageReaction) => r.emoji === emoji);
      
      if (reactionIdx < 0) return m;
      
      let newReactions = [...currentReactions];
      newReactions[reactionIdx] = { ...newReactions[reactionIdx], count: newReactions[reactionIdx].count - 1, adminReacted: false };
      if (newReactions[reactionIdx].count <= 0) {
        newReactions = newReactions.filter((_, i) => i !== reactionIdx);
      }
      
      return { ...m, metadata: { ...meta, reactions: newReactions } as unknown as Message['metadata'] };
    }));
    
    // Persist to database
    updateMessageReaction(messageId, emoji, 'remove', 'admin');
  }, [messages, setMessages]);

  return (
    <div ref={ref} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4">
      {loadingMessages ? (
        <SkeletonMessageThread messages={4} />
      ) : messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <AriAgentsIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl mx-auto">
          {filteredMessages.map((message, msgIndex) => {
            const isUser = message.role === 'user';
            const msgMetadata = (message.metadata || {}) as MessageMetadata;
            const isHumanSent = msgMetadata.sender_type === 'human';
            
            // Detect if this is a continuation of previous message (same sender)
            const prevMessage = msgIndex > 0 ? filteredMessages[msgIndex - 1] : null;
            const prevMsgMetadata = (prevMessage?.metadata || null) as MessageMetadata | null;
            const isContinuation = prevMessage && 
              prevMessage.role === message.role &&
              (message.role === 'user' || prevMsgMetadata?.sender_type === msgMetadata?.sender_type);
            
            // Check if next message is from same sender (to know if we should show metadata)
            const nextMessage = msgIndex < filteredMessages.length - 1 ? filteredMessages[msgIndex + 1] : null;
            const nextMsgMetadata = (nextMessage?.metadata || null) as MessageMetadata | null;
            const isLastInGroup = !nextMessage || 
              nextMessage.role !== message.role ||
              (message.role !== 'user' && nextMsgMetadata?.sender_type !== msgMetadata?.sender_type);
            
            return (
              <AdminMessageBubble
                key={message.id}
                message={message}
                isUser={isUser}
                isHumanSent={isHumanSent}
                isContinuation={!!isContinuation}
                isLastInGroup={isLastInGroup}
                visitorName={visitorName}
                showTranslation={showTranslation}
                translatedContent={translatedMessages[message.id]}
                onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                onRemoveReaction={(emoji) => handleRemoveReaction(message.id, emoji)}
                isNew={isNewMessage(message.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}));

export default MessageThread;
