import { Suspense } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, FileCheck02 } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { formatTimestamp } from '../utils';
import { AudioPlayer, MessageReactions } from '../constants';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
  enableMessageReactions: boolean;
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (emoji: string) => Promise<void>;
}

export const MessageBubble = ({
  message,
  primaryColor,
  enableMessageReactions,
  onAddReaction,
  onRemoveReaction,
}: MessageBubbleProps) => {
  const msgWithExtras = message as Message & { isHuman?: boolean; senderName?: string; senderAvatar?: string };

  // System notices render differently - centered, no avatar, no timestamp
  if (message.isSystemNotice) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground italic text-center">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
      {message.role === 'assistant' && (
        msgWithExtras.isHuman && msgWithExtras.senderAvatar ? (
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarImage src={msgWithExtras.senderAvatar} alt={msgWithExtras.senderName || 'Team member'} />
            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
              {(msgWithExtras.senderName || 'T')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
            <ChatBubbleIcon className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
        )
      )}
      <div className="flex flex-col gap-1 max-w-[80%]">
        {/* Human agent label */}
        {message.role === 'assistant' && msgWithExtras.isHuman && msgWithExtras.senderName && (
          <span className="text-xs text-blue-600 font-medium">
            {msgWithExtras.senderName}
          </span>
        )}
        <div 
          className={`rounded-lg p-3 ${
            message.role === 'user' 
              ? 'text-foreground' 
              : msgWithExtras.isHuman 
                ? 'bg-muted/50' 
                : 'bg-muted'
          }`}
          style={message.role === 'user' ? { 
            backgroundColor: `${primaryColor}12`
          } : undefined}
        >
          {message.type === 'audio' && message.audioUrl && (
            <Suspense fallback={<div className="h-8 flex items-center text-sm text-muted-foreground">Loading audio...</div>}>
              <AudioPlayer audioUrl={message.audioUrl} primaryColor={primaryColor} />
            </Suspense>
          )}
          {message.type === 'file' && message.files && (
            <div className="space-y-2">
              {message.files.map((file, i) => (
                <div key={i} className="flex items-center gap-2">
                  {file.type?.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="max-w-full rounded-lg" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <FileCheck02 className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
              ))}
              {message.content && message.content !== 'Sent files' && (
                <p className="text-sm whitespace-pre-wrap break-words mt-2">{message.content}</p>
              )}
            </div>
          )}
          {(message.type === 'text' || !message.type) && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          {/* Link previews for assistant messages */}
          {message.role === 'assistant' && message.linkPreviews && message.linkPreviews.length > 0 && (
            <div className="mt-2">
              <LinkPreviews content={message.content} cachedPreviews={message.linkPreviews} />
            </div>
          )}
        </div>
        
        {/* Message footer: timestamp + read receipt + reactions */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
          
          {/* Read receipt for user messages */}
          {message.role === 'user' && (
            <div className="flex items-center" title={message.read_at ? 'Read' : 'Sent'}>
              <Check className={`h-3 w-3 ${message.read_at ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </div>
          )}
          
          {/* Emoji reactions */}
          {enableMessageReactions && message.id && (
            <Suspense fallback={null}>
              <MessageReactions
                reactions={message.reactions || []}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
                primaryColor={primaryColor}
                compact
                isUserMessage={message.role === 'user'}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};
