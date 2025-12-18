/**
 * PreviewChat Component
 * 
 * Simplified chat interface for previewing AI responses in the Ari configurator.
 * This is NOT the production widget - it's a minimal test interface.
 * 
 * Features:
 * - Empty state with instructions
 * - Simple message bubbles (user right, AI left)
 * - Basic input with send button
 * - Clear conversation functionality
 * - Typing indicator while AI responds
 * - Rich content: Link previews, Quick replies, Call buttons, Booking flow
 * 
 * @module components/agents/PreviewChat
 */

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { DotsVertical, RefreshCw01, Send01 } from '@untitledui/icons';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendChatMessage, type ChatResponse } from '@/widget/api';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';

// Widget components for rich content
import { LinkPreviewsWidget } from '@/widget/components/LinkPreviewsWidget';
import { QuickReplies } from '@/widget/components/QuickReplies';
import { CallButton, type CallAction } from '@/widget/components/CallButton';
import { DayPicker, TimePicker, BookingConfirmed } from '@/widget/constants';
import { stripUrlsFromContent, stripPhoneNumbersFromContent } from '@/widget/utils/url-stripper';
import type { 
  DayPickerData, 
  TimePickerData, 
  BookingConfirmationData, 
  BookingDay, 
  BookingTime 
} from '@/widget/types';
import type { LinkPreviewData } from '@/components/chat/LinkPreviewCard';

// ============================================
// TYPES
// ============================================

interface PreviewChatProps {
  agentId: string;
  primaryColor?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Rich content features (from API response - using ChatResponse types directly)
  linkPreviews?: ChatResponse['linkPreviews'];
  quickReplies?: string[];
  callActions?: CallAction[];
  dayPicker?: DayPickerData;
  timePicker?: TimePickerData;
  bookingConfirmed?: BookingConfirmationData;
}

// ============================================
// PREVIEW CHAT COMPONENT
// ============================================

export const PreviewChat: React.FC<PreviewChatProps> = ({
  agentId,
  primaryColor = '#8B5CF6',
}) => {
  // State (no conversationId - preview mode is ephemeral)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear conversation
  const handleClearConversation = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    inputRef.current?.focus();
  }, []);

  // Send message (can be called with custom content for booking/quick replies)
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to API in preview mode (ephemeral, no persistence)
      const response: ChatResponse = await sendChatMessage(
        agentId,
        null, // no conversationId - each message is independent in preview
        { role: 'user', content: content.trim() },
        undefined, // no leadId
        undefined, // no pageVisits
        undefined, // no referrerJourney
        undefined, // no visitorId
        undefined, // no locationId
        true       // previewMode - skip persistence
      );

      // DEBUG: Log API response to trace link previews and call actions
      console.log('[PreviewChat] API Response:', {
        response: response.response?.substring(0, 100),
        linkPreviews: response.linkPreviews,
        callActions: response.callActions,
        quickReplies: response.quickReplies,
      });

      // Add AI response with all rich content
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        linkPreviews: response.linkPreviews || [],
        quickReplies: response.quickReplies || [],
        callActions: response.callActions || [],
        dayPicker: response.dayPicker,
        timePicker: response.timePicker,
        bookingConfirmed: response.bookingConfirmed,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Preview chat error:', error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, isLoading]);

  // Send message from input
  const handleSendMessage = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        sendMessage(inputValue);
      }
    }
  }, [inputValue, isLoading, sendMessage]);

  // Booking flow handlers
  const handleBookingDaySelect = useCallback((day: BookingDay) => {
    sendMessage(`I'd like to book on ${day.dayName}, ${day.date}`);
  }, [sendMessage]);

  const handleBookingTimeSelect = useCallback((time: BookingTime) => {
    sendMessage(`${time.time} works for me`);
  }, [sendMessage]);

  const handleBookingGoBack = useCallback(() => {
    sendMessage("I'd like to pick a different day");
  }, [sendMessage]);

  // Quick reply handler
  const handleQuickReplySelect = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  // Find last assistant message index (ES5-compatible)
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          Preview
        </span>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton 
                variant="ghost" 
                size="sm" 
                label="Preview options"
              >
                <DotsVertical size={16} />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClearConversation}>
                Clear conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <IconButton 
            variant="ghost" 
            size="sm" 
            label="Reset preview"
            onClick={handleClearConversation}
          >
            <RefreshCw01 size={16} />
          </IconButton>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <AriAgentsIcon size={40} className="text-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              Ask Ari a question your customers would ask to see how it will respond.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Preview chats do not count toward your usage.
            </p>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isLastAssistant = index === lastAssistantIndex;
              
              return (
                <div key={message.id} className="space-y-2">
                  {/* Message Row */}
                  <div
                    className={cn(
                      "flex gap-2",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* AI Avatar */}
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <AriAgentsIcon size={28} className="text-foreground" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "max-w-[80%] p-3 rounded-lg text-sm text-foreground",
                        message.role === 'user' 
                          ? "" 
                          : "bg-muted"
                      )}
                      style={message.role === 'user' ? { backgroundColor: 'rgb(1 110 237 / 7%)' } : undefined}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {(() => {
                          if (message.role !== 'assistant') return message.content;
                          
                          const hasLinkPreviews = !!(message.linkPreviews && message.linkPreviews.length > 0);
                          const hasCallActions = !!(message.callActions && message.callActions.length > 0);
                          
                          // DEBUG: Log stripping conditions and data
                          console.log('[PreviewChat] Content processing:', {
                            hasLinkPreviews,
                            hasCallActions,
                            linkPreviews: message.linkPreviews,
                            callActions: message.callActions,
                            contentPreview: message.content.substring(0, 100),
                          });
                          
                          let processed = message.content.replace(/\*\*(.*?)\*\*/g, '$1');
                          processed = stripUrlsFromContent(processed, hasLinkPreviews);
                          processed = stripPhoneNumbersFromContent(processed, hasCallActions);
                          
                          console.log('[PreviewChat] After stripping:', processed.substring(0, 100));
                          
                          return processed;
                        })()}
                      </p>
                      
                      {/* Link Previews (inside bubble for assistant) */}
                      {message.role === 'assistant' && message.linkPreviews && message.linkPreviews.length > 0 && (
                        <div className="mt-2">
                          <LinkPreviewsWidget 
                            content={message.content} 
                            cachedPreviews={message.linkPreviews as LinkPreviewData[]}
                          />
                        </div>
                      )}
                    </div>

                    {/* User Label */}
                    {message.role === 'user' && (
                      <span className="text-xs text-muted-foreground/60 self-end">You</span>
                    )}
                  </div>

                  {/* Rich Content Below Message (assistant only) */}
                  {message.role === 'assistant' && (
                    <>
                      {/* Day Picker */}
                      {message.dayPicker && (
                        <div className="ml-9">
                          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-xl" />}>
                            <DayPicker 
                              data={message.dayPicker} 
                              onSelect={handleBookingDaySelect} 
                              primaryColor={primaryColor} 
                            />
                          </Suspense>
                        </div>
                      )}

                      {/* Time Picker */}
                      {message.timePicker && (
                        <div className="ml-9">
                          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-xl" />}>
                            <TimePicker 
                              data={message.timePicker} 
                              onSelect={handleBookingTimeSelect} 
                              onGoBack={handleBookingGoBack}
                              primaryColor={primaryColor} 
                            />
                          </Suspense>
                        </div>
                      )}

                      {/* Booking Confirmed */}
                      {message.bookingConfirmed && (
                        <div className="ml-9">
                          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-xl" />}>
                            <BookingConfirmed 
                              data={message.bookingConfirmed} 
                              primaryColor={primaryColor} 
                            />
                          </Suspense>
                        </div>
                      )}

                      {/* Call Buttons (only on last assistant message) */}
                      {isLastAssistant && message.callActions && message.callActions.length > 0 && (
                        <div className="ml-9">
                          <CallButton callActions={message.callActions} />
                        </div>
                      )}

                      {/* Quick Replies (only on last assistant message) */}
                      {isLastAssistant && message.quickReplies && message.quickReplies.length > 0 && (
                        <div className="ml-9">
                          <QuickReplies 
                            suggestions={message.quickReplies} 
                            onSelect={handleQuickReplySelect} 
                            primaryColor={primaryColor} 
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <AriAgentsIcon size={28} className="text-foreground" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <IconButton
            variant="default"
            size="icon"
            label="Send message"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="h-10 w-10"
          >
            <Send01 size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
