/**
 * VirtualizedMessageThread Component
 * 
 * Virtualized message thread using @tanstack/react-virtual.
 * Only renders visible messages for improved performance with long conversations.
 * 
 * ARCHITECTURE NOTE: This component is PURELY PRESENTATIONAL.
 * - No internal auto-scroll logic (parent controls scrolling via ref)
 * - Virtualizer config is stabilized to prevent re-render loops
 * - Parent should remount via key={conversationId} when switching conversations
 * 
 * @component
 */

import React, { memo, useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { AdminMessageBubble } from './AdminMessageBubble';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { updateMessageReaction } from '@/lib/conversation-utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import type { MessageMetadata, MessageReaction } from '@/types/metadata';

type Message = Tables<'messages'>;

/** Estimated height of each message in pixels - will be measured dynamically */
const ESTIMATED_MESSAGE_HEIGHT = 80;

export interface VirtualizedMessageThreadProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  visitorName: string;
  showTranslation: boolean;
  translatedMessages: Record<string, string>;
  isNewMessage: (messageId: string) => boolean;
  loadingMessages: boolean;
}

export interface VirtualizedMessageThreadRef {
  scrollToBottom: (smooth?: boolean) => void;
}

export const VirtualizedMessageThread = memo(forwardRef<VirtualizedMessageThreadRef, VirtualizedMessageThreadProps>(
  function VirtualizedMessageThread({
    messages,
    setMessages,
    visitorName,
    showTranslation,
    translatedMessages,
    isNewMessage,
    loadingMessages,
  }, ref) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Filter out tool call placeholder messages
    const filteredMessages = useMemo(() => {
      return messages.filter(msg => {
        const meta = (msg.metadata || {}) as Record<string, unknown>;
        if (!msg.content?.trim() && meta.message_type === 'tool_call') {
          return false;
        }
        return true;
      });
    }, [messages]);

    // Stabilize virtualizer config callbacks to prevent re-creation on each render
    const getScrollElement = useCallback(() => parentRef.current, []);
    const estimateSize = useCallback(() => ESTIMATED_MESSAGE_HEIGHT, []);
    const getItemKey = useCallback(
      (index: number) => filteredMessages[index]?.id ?? index,
      [filteredMessages]
    );

    // Dynamic size cache for variable height messages
    const virtualizer = useVirtualizer({
      count: filteredMessages.length,
      getScrollElement,
      estimateSize,
      overscan: 10, // Render 10 items above and below viewport
      getItemKey,
    });

    // Scroll to bottom using direct DOM manipulation with smooth behavior
    const scrollToBottom = useCallback((smooth = false) => {
      const el = parentRef.current;
      if (el) {
        // Use requestAnimationFrame to ensure DOM has painted
        requestAnimationFrame(() => {
          if (smooth) {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          } else {
            el.scrollTop = el.scrollHeight;
          }
        });
      }
    }, []);

    // Track scroll position to show/hide scroll-to-bottom button
    const handleScroll = useCallback(() => {
      const el = parentRef.current;
      if (!el) return;
      
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 200);
    }, []);

    // Expose scroll to bottom via ref
    useImperativeHandle(ref, () => ({
      scrollToBottom,
    }), [scrollToBottom]);

    // Handle adding reactions with optimistic update
    const handleAddReaction = useCallback((messageId: string, emoji: string) => {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const msgMetadata = (message.metadata || {}) as MessageMetadata;
      const reactions = msgMetadata.reactions;

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

    const items = virtualizer.getVirtualItems();

    return (
      <div 
        ref={parentRef} 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4 relative"
        onScroll={handleScroll}
      >
        {loadingMessages ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? '' : 'items-end'}`}>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-lg`} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMessages.length > 0 ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
            className="max-w-4xl mx-auto"
          >
            {items.map((virtualItem) => {
              const message = filteredMessages[virtualItem.index];
              const msgIndex = virtualItem.index;
              
              const isUser = message.role === 'user';
              const msgMetadata = (message.metadata || {}) as MessageMetadata;
              const isHumanSent = msgMetadata.sender_type === 'human';

              // Detect if this is a continuation of previous message
              const prevMessage = msgIndex > 0 ? filteredMessages[msgIndex - 1] : null;
              const prevMsgMetadata = (prevMessage?.metadata || null) as MessageMetadata | null;
              const isContinuation = prevMessage &&
                prevMessage.role === message.role &&
                (message.role === 'user' || prevMsgMetadata?.sender_type === msgMetadata?.sender_type);

              // Check if next message is from same sender
              const nextMessage = msgIndex < filteredMessages.length - 1 ? filteredMessages[msgIndex + 1] : null;
              const nextMsgMetadata = (nextMessage?.metadata || null) as MessageMetadata | null;
              const isLastInGroup = !nextMessage ||
                nextMessage.role !== message.role ||
                (message.role !== 'user' && nextMsgMetadata?.sender_type !== msgMetadata?.sender_type);

              return (
                <div
                  key={message.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="py-1"
                >
                  <AdminMessageBubble
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <AriAgentsIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            </div>
          </div>
        )}
        
        {/* Scroll to bottom FAB */}
        <ScrollToBottomButton
          visible={showScrollButton && !loadingMessages && filteredMessages.length > 10}
          onClick={() => scrollToBottom(true)}
        />
      </div>
    );
  }
));

export default VirtualizedMessageThread;
