/**
 * MessageBubble Component
 * 
 * Renders a single chat message with avatar, content, metadata, and reactions.
 * Supports text, audio, file attachments, link previews, and system notices.
 * Uses message grouping for cleaner UI with continuation messages.
 * 
 * @module widget/components/MessageBubble
 */

import { Suspense } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, CheckCircle, XCircle, Download01 } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatShortTime } from '@/lib/time-formatting';
import { formatFileSize } from '@/lib/file-validation';
import { downloadFile } from '@/lib/file-download';
import { AudioPlayer, MessageReactions } from '../constants';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { stripUrlsFromContent } from '../utils/url-stripper';
import type { Message } from '../types';

/**
 * Formats message content with basic markdown support.
 * Handles bullet lists, numbered lists, and bold text.
 */
function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (currentList) {
      const ListTag = currentList.type;
      elements.push(
        <ListTag key={key++} className={currentList.type === 'ul' ? 'list-disc pl-4 my-1' : 'list-decimal pl-4 my-1'}>
          {currentList.items.map((item, i) => (
            <li key={i} className="my-0.5">{formatInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Bullet list: * or -
    const bulletMatch = line.match(/^[\s]*[*-]\s+(.+)$/);
    if (bulletMatch) {
      if (currentList?.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered list: 1. 2. etc
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (numberedMatch) {
      if (currentList?.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[1]);
      continue;
    }

    // Regular line - flush any pending list
    flushList();
    
    if (line.trim() === '') {
      elements.push(<br key={key++} />);
    } else {
      elements.push(
        <span key={key++}>
          {formatInlineMarkdown(line)}
          {i < lines.length - 1 && <br />}
        </span>
      );
    }
  }

  flushList();
  return elements;
}

/**
 * Formats inline markdown: **bold**
 */
function formatInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** Props for the MessageBubble component */
interface MessageBubbleProps {
  /** Message data to render */
  message: Message;
  /** Primary brand color for styling */
  primaryColor: string;
  /** Whether emoji reactions are enabled */
  enableMessageReactions: boolean;
  /** Handler for adding a reaction */
  onAddReaction: (emoji: string) => Promise<void>;
  /** Handler for removing a reaction */
  onRemoveReaction: (emoji: string) => Promise<void>;
  /** Whether this message continues from the previous (same sender) */
  isContinuation?: boolean;
  /** Whether this is the last message in a group */
  isLastInGroup?: boolean;
}

/**
 * Chat message bubble component with full feature support.
 * 
 * @param props - Component props
 * @returns Message bubble element with content and metadata
 */
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
                <div key={i}>
                  {file.type?.startsWith('image/') ? (
                    <div className="flex items-center gap-3 p-2 border rounded-lg bg-background/50">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          className="w-12 h-12 object-cover rounded-md" 
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        {file.size && (
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => downloadFile(file.url, file.name)}
                        className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                        title="Download"
                      >
                        <Download01 size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-2 border rounded-lg bg-background/50">
                      <FileTypeIcon fileName={file.name} width={36} height={36} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        {file.size && (
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => downloadFile(file.url, file.name)}
                        className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                        title="Download"
                      >
                        <Download01 size={16} className="text-muted-foreground" />
                      </button>
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
            <div className="text-sm whitespace-pre-wrap break-words widget-message-content">
              {message.role === 'assistant' 
                ? formatMessageContent(
                    stripUrlsFromContent(
                      message.content,
                      !!(message.linkPreviews && message.linkPreviews.length > 0)
                    )
                  )
                : message.content}
            </div>
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
              .filter((r) => r.adminReacted && r.count > 0)
              .map((reaction, i: number) => (
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
