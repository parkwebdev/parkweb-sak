/**
 * PromptTestChat Component
 * 
 * Interactive test chat for baseline prompts - exact mirror of PreviewChat.
 * Calls real AI with previewMode: true (no persistence).
 * 
 * @module components/admin/prompts/PromptTestChat
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { logger } from '@/utils/logger';
import { DotsVertical, RefreshCw01, Send01 } from '@untitledui/icons';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sendChatMessage, type ChatResponse } from '@/widget/api';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { useAgent } from '@/hooks/useAgent';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { stripUrlsFromContent, stripPhoneNumbersFromContent, formatMarkdownBullets } from '@/widget/utils/url-stripper';

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================
// PROMPT TEST CHAT COMPONENT
// ============================================

export function PromptTestChat() {
  const { agentId } = useAgent();
  
  // State (no conversationId - preview mode is ephemeral)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useAutoResizeTextarea(inputRef, inputValue, { minRows: 1, maxRows: 5, lineHeight: 26 });

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

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (!agentId) {
      toast.error('No agent configured', { description: 'Please configure an agent first.' });
      return;
    }

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

      // Add AI response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      logger.error('Test chat error:', error);
      toast.error('Failed to send message', { description: getErrorMessage(error) });
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
            <ChatBubbleIcon className="h-10 w-10 text-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              Send a test message to see how Ari responds with the current baseline prompt.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Test chats are not saved to conversations.
            </p>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-4">
            {messages.map((message) => (
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
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ChatBubbleIcon className="h-4 w-4 text-foreground" />
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
                      {message.role === 'assistant' 
                        ? formatMarkdownBullets(
                            stripPhoneNumbersFromContent(
                              stripUrlsFromContent(
                                message.content.replace(/\*\*(.*?)\*\*/g, '$1'),
                                false
                              ),
                              false
                            )
                          )
                        : message.content
                      }
                    </p>
                  </div>

                  {/* User Label */}
                  {message.role === 'user' && (
                    <span className="text-xs text-muted-foreground/60 self-end">You</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <ChatBubbleIcon className="h-4 w-4 text-foreground" />
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
      <div className="px-6 py-4 border-t bg-background shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center"
        >
          <div className="relative flex-1">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
              size="compact"
              rows={1}
              className="!min-h-0 max-h-[120px] py-2 pr-11 resize-none leading-tight"
            />
            <Button 
              type="submit" 
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <Send01 size={16} aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
