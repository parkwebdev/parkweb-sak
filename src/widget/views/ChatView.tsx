import { Suspense, RefObject } from 'react';
import { updateMessageReaction } from '../api';
import { MessageBubble, ContactForm, MessageInput, TypingIndicator } from '../components';
import { FileDropZone } from '../constants';
import type { Message, ChatUser } from '../types';
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
  onSendMessage: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onFormSubmit: (userData: ChatUser, conversationId?: string) => void;
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
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onFormSubmit,
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
      console.error('Failed to add reaction:', err);
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
      console.error('Failed to remove reaction:', err);
    }
  };

  return (
    <>
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 messages-container min-h-0">
        {/* Loading indicator when fetching messages */}
        {isLoadingMessages && messages.length === 0 && chatUser && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading messages...</span>
            </div>
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

          return (
            <MessageBubble
              key={msg.id || idx}
              message={msg}
              primaryColor={config.primaryColor}
              enableMessageReactions={config.enableMessageReactions}
              onAddReaction={(emoji) => handleAddReaction(msg.id!, emoji)}
              onRemoveReaction={(emoji) => handleRemoveReaction(msg.id!, emoji)}
              isContinuation={isContinuation}
              isLastInGroup={isLastInGroup}
            />
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
            <Suspense fallback={<div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}>
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
        onSend={onSendMessage}
        placeholder={config.placeholder || 'Type a message...'}
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
