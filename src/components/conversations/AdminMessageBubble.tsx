/**
 * AdminMessageBubble Component
 * 
 * Individual message bubble for the admin inbox view.
 * Handles rendering of user messages, AI messages, and human team member messages
 * with avatars, timestamps, file attachments, link previews, reactions, and translation.
 * 
 * @component
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FaceSmile, Check, CheckCircle, XCircle, Download01 } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { formatFileSize } from '@/lib/file-validation';
import { downloadFile } from '@/lib/file-download';
import { formatShortTime, formatSenderName } from '@/lib/time-formatting';
import { formatMarkdownBullets, stripUrlsFromContent } from '@/widget/utils/url-stripper';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { messageBubbleVariants, messageBubbleUserVariants, messageBubbleReducedVariants, getVariants } from '@/lib/motion-variants';
import type { Tables } from '@/integrations/supabase/types';
import type { MessageMetadata, MessageReaction } from '@/types/metadata';

type Message = Tables<'messages'>;

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export interface AdminMessageBubbleProps {
  message: Message;
  isUser: boolean;
  isHumanSent: boolean;
  isContinuation: boolean;
  isLastInGroup: boolean;
  visitorName: string;
  showTranslation: boolean;
  translatedContent?: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isNew: boolean;
}

export const AdminMessageBubble = memo(function AdminMessageBubble({
  message,
  isUser,
  isHumanSent,
  isContinuation,
  isLastInGroup,
  visitorName,
  showTranslation,
  translatedContent,
  onAddReaction,
  onRemoveReaction,
  isNew,
}: AdminMessageBubbleProps) {
  const prefersReducedMotion = useReducedMotion();
  const msgMetadata = (message.metadata || {}) as MessageMetadata;
  const reactions = msgMetadata.reactions;

  const bubbleVariants = getVariants(
    isUser ? messageBubbleUserVariants : messageBubbleVariants,
    messageBubbleReducedVariants,
    prefersReducedMotion
  );

  const handleAddReactionClick = useCallback((emoji: string) => {
    const existingReaction = reactions?.find(r => r.emoji === emoji);
    if (existingReaction?.adminReacted) return;
    onAddReaction(emoji);
  }, [reactions, onAddReaction]);

  const handleRemoveReactionClick = useCallback((emoji: string) => {
    const existingReaction = reactions?.find(r => r.emoji === emoji);
    if (!existingReaction?.adminReacted) return;
    onRemoveReaction(emoji);
  }, [reactions, onRemoveReaction]);

  const handleReactionClick = useCallback((reaction: MessageReaction) => {
    if (reaction.adminReacted) {
      onRemoveReaction(reaction.emoji);
    } else {
      onAddReaction(reaction.emoji);
    }
  }, [onAddReaction, onRemoveReaction]);

  return (
    <motion.div
      key={message.id}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isContinuation ? 'mt-1' : 'mt-1 first:mt-0'}`}
      variants={isNew ? bubbleVariants : undefined}
      initial={isNew ? "hidden" : false}
      animate={isNew ? "visible" : undefined}
    >
      <div className={`flex items-start gap-2 max-w-[75%] min-w-0 ${isContinuation && !isUser ? 'ml-10' : ''}`}>
        {/* Avatar - only show for non-user, non-continuation messages */}
        {!isUser && !isContinuation && (
          isHumanSent && msgMetadata?.sender_avatar ? (
            <img 
              src={msgMetadata.sender_avatar} 
              alt={msgMetadata?.sender_name || 'Team member'} 
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
            />
          ) : isHumanSent ? (
            <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-info text-xs font-medium">
                {(msgMetadata?.sender_name || 'T').charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
              <ChatBubbleIcon className="h-4 w-4 text-foreground" />
            </div>
          )
        )}
        
        <div className="flex flex-col min-w-0">
          {/* Name + Timestamp header row - only show if !isContinuation */}
          {!isContinuation && (
            <div className={`flex items-center gap-1.5 text-2xs text-muted-foreground mb-1 ${isUser ? 'justify-end mr-1' : 'ml-1'}`}>
              <span className="font-medium">
                {isUser ? visitorName : (isHumanSent ? formatSenderName(msgMetadata.sender_name) : 'Ari')}
              </span>
              <span>•</span>
              <span>{formatShortTime(new Date(message.created_at))}</span>
              {/* Status badges for human messages */}
              {isHumanSent && (
                <>
                  {(msgMetadata as Record<string, unknown>)?.error || (msgMetadata as Record<string, unknown>)?.failed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-destructive inline-flex items-center">
                          <XCircle size={12} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Failed</TooltipContent>
                    </Tooltip>
                  ) : msgMetadata?.read_at ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-info inline-flex items-center">
                          <CheckCircle size={12} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Seen</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center">
                          <Check size={12} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Sent</TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Message bubble - content only */}
          <div
            className={`rounded-lg px-3 py-2 text-foreground overflow-hidden min-w-0 ${isUser ? '' : 'bg-muted'}`}
            style={isUser ? { backgroundColor: 'rgb(1 110 237 / 7%)' } : undefined}
          >
            {/* File attachments */}
            {msgMetadata?.files && Array.isArray(msgMetadata.files) && msgMetadata.files.length > 0 && (
              <div className="space-y-2 mb-2">
                {msgMetadata.files.map((file: { name: string; url: string; type?: string; size?: number }, i: number) => (
                  <div key={i}>
                    {file.type?.startsWith('image/') ? (
                      <div className="flex items-center gap-3 p-2 border rounded-lg bg-background/50 max-w-[280px]">
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
                      <div className="flex items-center gap-3 p-2 border rounded-lg bg-background/50 max-w-[280px]">
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
              </div>
            )}
            
            {/* Regular text content - show translation if available */}
            {message.content && message.content !== 'Sent files' && (() => {
              const hasUrls = /https?:\/\/[^\s<>"')\]]+/i.test(message.content);
              
              const displayContent = showTranslation && translatedContent
                ? formatMarkdownBullets(stripUrlsFromContent(translatedContent, hasUrls))
                : formatMarkdownBullets(stripUrlsFromContent(message.content, hasUrls));
              
              return displayContent.trim() ? (
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                    {displayContent}
                  </p>
                  {showTranslation && translatedContent && translatedContent !== message.content && (
                    <p className="text-xs text-muted-foreground mt-1 italic border-t border-dashed pt-1">
                      Original: {message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content}
                    </p>
                  )}
                </div>
              ) : null;
            })()}
            
            <LinkPreviews content={message.content} />
          </div>
          
          {/* Reactions row - only show for last message in group, team members can only react to user messages */}
          {isLastInGroup && isUser && reactions && reactions.length > 0 && (
            <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
              {reactions.map((reaction, i) => (
                <button
                  key={i}
                  onClick={() => handleReactionClick(reaction)}
                  className={`text-xs rounded-full px-1.5 py-0.5 transition-colors ${
                    reaction.adminReacted 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {reaction.emoji} {reaction.count > 1 && reaction.count}
                </button>
              ))}
              {/* Add reaction button */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-xs bg-muted hover:bg-muted/80 rounded-full p-1 transition-colors opacity-50 hover:opacity-100">
                    <FaceSmile size={12} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto px-2 py-1 rounded-full" side="top" align="start">
                  <div className="flex gap-1">
                    {QUICK_EMOJIS.map((emoji) => {
                      const alreadyReacted = reactions?.find(r => r.emoji === emoji)?.adminReacted;
                      return (
                        <button
                          key={emoji}
                          onClick={() => alreadyReacted ? handleRemoveReactionClick(emoji) : handleAddReactionClick(emoji)}
                          className={`text-lg p-1 hover:bg-muted rounded transition-transform hover:scale-110 ${alreadyReacted ? 'bg-primary/20' : ''}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Add reaction button when no reactions exist - only for user messages */}
          {isLastInGroup && isUser && (!reactions || reactions.length === 0) && (
            <div className="flex items-center gap-1 mt-1 px-1">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-xs bg-muted hover:bg-muted/80 rounded-full p-1 transition-colors opacity-50 hover:opacity-100">
                    <FaceSmile size={12} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto px-2 py-1 rounded-full" side="top" align="start">
                  <div className="flex gap-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReactionClick(emoji)}
                        className="text-lg p-1 hover:bg-muted rounded transition-transform hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Display user reactions on assistant/team messages - read-only */}
          {isLastInGroup && !isUser && reactions && reactions.length > 0 && (
            <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
              {reactions
                .filter((r: MessageReaction) => r.userReacted && r.count > 0)
                .map((reaction: MessageReaction, i: number) => (
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
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.isHumanSent === nextProps.isHumanSent &&
    prevProps.isContinuation === nextProps.isContinuation &&
    prevProps.isLastInGroup === nextProps.isLastInGroup &&
    prevProps.visitorName === nextProps.visitorName &&
    prevProps.showTranslation === nextProps.showTranslation &&
    prevProps.translatedContent === nextProps.translatedContent &&
    prevProps.isNew === nextProps.isNew &&
    JSON.stringify(prevProps.message.metadata) === JSON.stringify(nextProps.message.metadata)
  );
});

export default AdminMessageBubble;
