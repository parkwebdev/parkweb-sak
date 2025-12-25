/**
 * ChatView Component
 * 
 * Main chat interface with message list, typing indicators, file attachments,
 * contact form, booking components, and message input. Handles message reactions and auto-scrolling.
 * 
 * @module widget/views/ChatView
 */

import { Suspense, RefObject } from 'react';
import { updateMessageReaction } from '../api';
import { MessageBubble, ContactForm, MessageInput, TypingIndicator, QuickReplies, CallButton } from '../components';
import { FileDropZone } from '../constants';
import { WidgetSkeletonMessage, WidgetSkeletonCard } from '../ui';
import type { Message, ChatUser, BookingDay, BookingTime } from '../types';
import type { WidgetConfig } from '../api';

interface PendingFile {
  file: File;
  preview: string;
}

interface ChatViewProps {
  config: WidgetConfig;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatUser: ChatUser | null;
  setChatUser: (user: ChatUser | null) => void;
  messageInput: string;
  setMessageInput: (value: string) => void;
  pendingFiles: PendingFile[];
  setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>;
  isTyping: boolean;
  isHumanTyping: boolean;
  typingAgentName?: string;
  isHumanTakeover: boolean;
  takeoverAgentName?: string;
  takeoverAgentAvatar?: string;
  isRecordingAudio: boolean;
  recordingTime: number;
  isAttachingFiles: boolean;
  setIsAttachingFiles: (value: boolean) => void;
  formLoadTime: number;
  isLoadingMessages: boolean;
  messagesContainerRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  onSendMessage: (overrideMessage?: string) => void;
  onQuickReplySelect: (suggestion: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onFormSubmit: (userData: ChatUser, conversationId?: string) => void;
  /** Set of message IDs that should animate (new messages) */
  newMessageIds?: Set<string>;
}

export const ChatView = ({
  config,
  messages,
  setMessages,
  chatUser,
  setChatUser,
  messageInput,
  setMessageInput,
  pendingFiles,
  setPendingFiles,
  isTyping,
  isHumanTyping,
  typingAgentName,
  isHumanTakeover,
  takeoverAgentName,
  takeoverAgentAvatar,
  isRecordingAudio,
  recordingTime,
  isAttachingFiles,
  setIsAttachingFiles,
  formLoadTime,
  isLoadingMessages,
  messagesContainerRef,
  messagesEndRef,
  onSendMessage,
  onQuickReplySelect,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onFormSubmit,
  newMessageIds,
}: ChatViewProps) => {
  const disabled = !chatUser && config.enableContactForm;

  const handleAddReaction = async (msgId: string, emoji: string) => {
    try {
      await updateMessageReaction(msgId, emoji, 'add', 'user');
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        const existing = m.reactions || [];
        const reactionIndex = existing.findIndex(r => r.emoji === emoji);
        if (reactionIndex >= 0) {
          // User already reacted - don't increment count again
          if (existing[reactionIndex].userReacted) return m;
          const updated = [...existing];
          updated[reactionIndex] = { ...updated[reactionIndex], userReacted: true };
          return { ...m, reactions: updated };
        }
        return { ...m, reactions: [...existing, { emoji, count: 1, userReacted: true }] };
      }));
    } catch (err) {
      // Reaction error handled silently in production
    }
  };

  const handleRemoveReaction = async (msgId: string, emoji: string) => {
    try {
      await updateMessageReaction(msgId, emoji, 'remove', 'user');
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        const existing = m.reactions || [];
        const reactionIndex = existing.findIndex(r => r.emoji === emoji);
        if (reactionIndex >= 0) {
          const updated = [...existing];
          // User not reacted - nothing to remove
          if (!updated[reactionIndex].userReacted) return m;
          // Remove the reaction entirely when user removes their reaction
          updated.splice(reactionIndex, 1);
          return { ...m, reactions: updated };
        }
        return m;
      }));
    } catch (err) {
      // Reaction error handled silently in production
    }
  };

  // Booking handlers - send user selections as messages to continue the booking flow
  const handleBookingDaySelect = (day: BookingDay) => {
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    const selectionMessage = `I'd like to book for ${formattedDate}`;
    onSendMessage(selectionMessage);
  };

  const handleBookingTimeSelect = (time: BookingTime) => {
    const selectionMessage = `${time.time} works for me`;
    onSendMessage(selectionMessage);
  };

  const handleBookingGoBack = () => {
    const backMessage = `I'd like to pick a different day`;
    onSendMessage(backMessage);
  };

  return (
    <>
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 messages-container min-h-0">
        {/* Loading indicator when fetching messages */}
        {isLoadingMessages && messages.length === 0 && chatUser && (
          <div className="py-4 space-y-4">
            <WidgetSkeletonMessage />
            <WidgetSkeletonMessage isUser />
            <WidgetSkeletonMessage />
          </div>
        )}

        {/* Contact form for new users */}
        {!chatUser && config.enableContactForm && (
          <ContactForm
            agentId={config.agentId}
            primaryColor={config.primaryColor}
            title={config.contactFormTitle || 'Quick intro before we chat 👋'}
            subtitle={config.contactFormSubtitle}
            customFields={config.customFields}
            formLoadTime={formLoadTime}
            onSubmit={onFormSubmit}
          />
        )}
        
        {/* AI greeting will be triggered when user sends first message or widget opens */}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const nextMsg = messages[idx + 1];
          
          // Get metadata for grouping logic
          const msgMetadata = msg as typeof msg & { isHuman?: boolean };
          const prevMsgMetadata = prevMsg as typeof prevMsg & { isHuman?: boolean };
          const nextMsgMetadata = nextMsg as typeof nextMsg & { isHuman?: boolean };
          
          // Determine if this message continues from the previous one
          const isContinuation = prevMsg && 
            prevMsg.role === msg.role &&
            !msg.isSystemNotice &&
            !prevMsg.isSystemNotice &&
            (msg.role === 'user' || prevMsgMetadata?.isHuman === msgMetadata?.isHuman);
          
          // Determine if this is the last message in its group
          const isLastInGroup = !nextMsg || 
            nextMsg.role !== msg.role ||
            nextMsg.isSystemNotice ||
            (msg.role !== 'user' && nextMsgMetadata?.isHuman !== msgMetadata?.isHuman);
          
          // Show quick replies and call buttons only on the last assistant message with suggestions
          const isLastMessage = idx === messages.length - 1;
          const showQuickReplies = isLastMessage && msg.role === 'assistant' && msg.quickReplies && msg.quickReplies.length > 0;
          const showCallButton = isLastMessage && msg.role === 'assistant' && msg.callActions && msg.callActions.length > 0;

          // Determine animation class for new messages
          const shouldAnimate = msg.id && newMessageIds?.has(msg.id);
          const animationClass = shouldAnimate 
            ? (msg.role === 'user' ? 'widget-message-slide-right' : 'widget-message-slide-left')
            : '';

          return (
            <div key={msg.id || idx} className={animationClass}>
              <MessageBubble
                message={msg}
                primaryColor={config.primaryColor}
                enableMessageReactions={config.enableMessageReactions}
                onAddReaction={(emoji) => handleAddReaction(msg.id!, emoji)}
                onRemoveReaction={(emoji) => handleRemoveReaction(msg.id!, emoji)}
                isContinuation={isContinuation}
                isLastInGroup={isLastInGroup}
                onBookingDaySelect={handleBookingDaySelect}
                onBookingTimeSelect={handleBookingTimeSelect}
                onBookingGoBack={handleBookingGoBack}
              />
              {showCallButton && (
                <CallButton callActions={msg.callActions!} />
              )}
              {showQuickReplies && (
                <QuickReplies
                  suggestions={msg.quickReplies!}
                  onSelect={onQuickReplySelect}
                  primaryColor={config.primaryColor}
                />
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {(isTyping || isHumanTyping) && (
          <TypingIndicator
            primaryColor={config.primaryColor}
            isHumanTyping={isHumanTyping}
            typingAgentName={typingAgentName}
          />
        )}

        {/* File attachment overlay */}
        {isAttachingFiles && (
          <div className="p-4">
            <Suspense fallback={<WidgetSkeletonCard className="h-32" />}>
              <FileDropZone
                onFilesSelected={(files, urls) => {
                  files.forEach((file, i) => {
                    setPendingFiles(prev => [...prev, { file, preview: urls[i] || '' }]);
                  });
                  setIsAttachingFiles(false);
                }}
                onCancel={() => setIsAttachingFiles(false)}
                primaryColor={config.primaryColor}
              />
            </Suspense>
          </div>
        )}

        {/* Scroll anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        messageInput={messageInput}
        onMessageChange={setMessageInput}
        onSend={() => onSendMessage()}
        disabled={disabled}
        primaryColor={config.primaryColor}
        enableFileAttachments={config.enableFileAttachments}
        enableVoiceMessages={config.enableVoiceMessages}
        isRecordingAudio={isRecordingAudio}
        recordingTime={recordingTime}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onCancelRecording={onCancelRecording}
        onAttachFiles={() => setIsAttachingFiles(true)}
        pendingFiles={pendingFiles}
        onRemoveFile={(index) => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
      />
    </>
  );
};