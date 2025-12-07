import { Suspense } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, CheckCircle, XCircle, FileCheck02 } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatShortTime } from '@/lib/time-formatting';
import { AudioPlayer, MessageReactions } from '../constants';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
  enableMessageReactions: boolean;
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (emoji: string) => Promise<void>;
  isContinuation?: boolean;
  isLastInGroup?: boolean;
}

export const MessageBubble = ({
  message,
  primaryColor,
  enableMessageReactions,
  onAddReaction,
  onRemoveReaction,
  isContinuation = false,
  isLastInGroup = true,
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

  const isUser = message.role === 'user';
  const displayName = isUser 
    ? 'You' 
    : msgWithExtras.isHuman && msgWithExtras.senderName 
      ? msgWithExtras.senderName 
      : 'Assistant';

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'justify-end' : ''} ${isContinuation ? 'mt-1' : 'mt-1 first:mt-0'}`}>
      {/* Avatar - only show for first message in group */}
      {!isUser && !isContinuation && (
        msgWithExtras.isHuman && msgWithExtras.senderAvatar ? (
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarImage src={msgWithExtras.senderAvatar} alt={msgWithExtras.senderName || 'Team member'} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {(msgWithExtras.senderName || 'T')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
            <ChatBubbleIcon className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
        )
      )}
      
      {/* Spacer for continuation messages (align with previous bubble) */}
      {!isUser && isContinuation && (
        <div className="w-7 flex-shrink-0" />
      )}

      <div className="flex flex-col gap-0.5 max-w-[80%]">
        {/* Header: Name • Timestamp • Status - only show for first message in group */}
        {!isContinuation && (
          <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground ${isUser ? 'justify-end' : ''}`}>
            <span className="font-medium">{displayName}</span>
            <span>•</span>
            <span>{formatShortTime(message.timestamp)}</span>
            {/* Status indicator for user messages */}
            {isUser && (
              <>
                <span>•</span>
                {message.failed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-destructive inline-flex items-center">
                        <XCircle className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Failed</TooltipContent>
                  </Tooltip>
                ) : message.read_at ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-info inline-flex items-center">
                        <CheckCircle className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Seen</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center">
                        <Check className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Sent</TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div 
          className={`rounded-lg p-3 text-foreground ${isUser ? '' : 'bg-muted'}`}
          style={isUser ? { backgroundColor: 'rgb(1 110 237 / 7%)' } : undefined}
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
        
        {/* Footer: Reactions - only show on last message in group */}
        {isLastInGroup && !isUser && (
          <div className="flex items-center gap-2 px-1">
            {/* Emoji reactions for assistant/team messages - users can add reactions */}
            {enableMessageReactions && message.id && (
              <Suspense fallback={null}>
                <MessageReactions
                  reactions={message.reactions || []}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                  primaryColor={primaryColor}
                  compact
                  isUserMessage={isUser}
                />
              </Suspense>
            )}
          </div>
        )}
        
        {/* Footer: Display team member reactions on user messages - read-only */}
        {isLastInGroup && isUser && message.reactions && message.reactions.length > 0 && (
          <div className="flex items-center gap-1 px-1 justify-end flex-wrap">
            {message.reactions
              .filter((r: any) => r.adminReacted && r.count > 0)
              .map((reaction: any, i: number) => (
                <span 
                  key={i} 
                  className="text-xs bg-muted rounded-full px-1.5 py-0.5"
                >
                  {reaction.emoji} {reaction.count > 1 && reaction.count}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
