/**
 * MessageBubble Component
 * 
 * Renders a single chat message with avatar, content, metadata, and reactions.
 * Supports text, audio, file attachments, link previews, booking components, and system notices.
 * Uses message grouping for cleaner UI with continuation messages.
 * 
 * @module widget/components/MessageBubble
 */

import { Suspense } from 'react';
import { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from '../ui';
import { Check, CheckCircle, XCircle, Download01 } from '../icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { LinkPreviewsWidget } from './LinkPreviewsWidget';
import { formatShortTime } from '@/lib/time-formatting';
import { formatFileSize } from '@/lib/file-validation';
import { downloadFile } from '@/lib/file-download';
import { AudioPlayer, MessageReactions, DayPicker, TimePicker, BookingConfirmed } from '../constants';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { stripUrlsFromContent, stripPhoneNumbersFromContent, formatMarkdownBullets } from '../utils/url-stripper';
import type { Message, BookingDay, BookingTime } from '../types';

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
  /** Handler for booking day selection */
  onBookingDaySelect?: (day: BookingDay) => void;
  /** Handler for booking time selection */
  onBookingTimeSelect?: (time: BookingTime) => void;
  /** Handler for booking go back action */
  onBookingGoBack?: () => void;
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
  onBookingDaySelect,
  onBookingTimeSelect,
  onBookingGoBack,
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
      : 'Ari';

  // Check if this message has booking components
  const hasBookingComponent = message.dayPicker || message.timePicker || message.bookingConfirmed;

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'justify-end' : ''} ${isContinuation ? 'mt-1' : 'mt-1 first:mt-0'}`}>
      {/* Avatar - only show for first message in group */}
      {!isUser && !isContinuation && (
        msgWithExtras.isHuman && msgWithExtras.senderAvatar ? (
          <WidgetAvatar className="w-7 h-7 flex-shrink-0">
            <WidgetAvatarImage src={msgWithExtras.senderAvatar} alt={msgWithExtras.senderName || 'Team member'} />
            <WidgetAvatarFallback className="text-xs bg-muted text-muted-foreground">
              {(msgWithExtras.senderName || 'T')[0].toUpperCase()}
            </WidgetAvatarFallback>
          </WidgetAvatar>
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
            <ChatBubbleIcon className="h-4 w-4 text-foreground" />
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
          <div className={`flex items-center gap-1.5 text-2xs text-muted-foreground ${isUser ? 'justify-end' : ''}`}>
            <span className="font-medium">{displayName}</span>
            <span>•</span>
            <span>{formatShortTime(message.timestamp)}</span>
            {/* Status indicator for user messages */}
            {isUser && (
              <>
                <span>•</span>
                {message.failed ? (
                  <span className="text-destructive inline-flex items-center" title="Failed">
                    <XCircle className="h-3 w-3" />
                  </span>
                ) : message.read_at ? (
                  <span className="text-info inline-flex items-center" title="Seen">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="inline-flex items-center" title="Sent">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Message bubble - only show if there's text content */}
        {message.content && (
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
            {(message.type === 'text' || !message.type) && (() => {
              // Check if we have link previews (cached or will fetch for URLs)
              const hasLinkPreviews = 
                (message.linkPreviews && message.linkPreviews.length > 0) ||
                /https?:\/\/[^\s<>"')\]]+/i.test(message.content);
              
              // Check for call actions
              const hasCallActions = !!(message.callActions && message.callActions.length > 0);
              
              // Apply stripping for ALL message types when previews exist
              const processedContent = formatMarkdownBullets(
                stripPhoneNumbersFromContent(
                  stripUrlsFromContent(
                    message.content.replace(/\*\*(.*?)\*\*/g, '$1'),
                    hasLinkPreviews
                  ),
                  hasCallActions
                )
              );
              
              // Only render if there's content after stripping
              return processedContent.trim() ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {processedContent}
                </p>
              ) : null;
            })()}
            
            {/* Link previews for messages with URLs */}
            {(
              // Assistant messages with cached previews
              (message.role === 'assistant' && message.linkPreviews && message.linkPreviews.length > 0) ||
              // User messages - let LinkPreviewsWidget fetch on client if URL detected
              (message.role === 'user' && /https?:\/\/[^\s<>"')\]]+/i.test(message.content))
            ) && (
              <div className="mt-2">
                <LinkPreviewsWidget 
                  content={message.content} 
                  cachedPreviews={message.role === 'assistant' ? message.linkPreviews : undefined} 
                />
              </div>
            )}
          </div>
        )}

        {/* Booking components - lazy loaded, rendered below message bubble */}
        {message.dayPicker && onBookingDaySelect && (
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-xl mt-2" />}>
            <div className="mt-2">
              <DayPicker
                data={message.dayPicker}
                onSelect={onBookingDaySelect}
                primaryColor={primaryColor}
              />
            </div>
          </Suspense>
        )}
        {message.timePicker && onBookingTimeSelect && (
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-xl mt-2" />}>
            <div className="mt-2">
              <TimePicker
                data={message.timePicker}
                onSelect={onBookingTimeSelect}
                onGoBack={onBookingGoBack}
                primaryColor={primaryColor}
              />
            </div>
          </Suspense>
        )}
        {message.bookingConfirmed && (
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-xl mt-2" />}>
            <div className="mt-2">
              <BookingConfirmed
                data={message.bookingConfirmed}
                primaryColor={primaryColor}
              />
            </div>
          </Suspense>
        )}
        
        {/* Footer: Reactions - only show on last message in group */}
        {isLastInGroup && !isUser && !hasBookingComponent && (
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