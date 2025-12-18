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
 * 
 * @module components/agents/PreviewChat
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  // Send message
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
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
        { role: 'user', content: trimmedInput },
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
  }, [agentId, inputValue, isLoading]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Compute user message background color (12% opacity of primary)
  const userBubbleStyle = {
    backgroundColor: `${primaryColor}1F`, // 1F = ~12% opacity in hex
  };

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
              Ask Ari a question to see how your AI will respond.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Preview chats don't count toward your usage.
            </p>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {/* AI Avatar */}
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">A</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                    message.role === 'user' 
                      ? "rounded-br-md" 
                      : "bg-muted rounded-bl-md"
                  )}
                  style={message.role === 'user' ? userBubbleStyle : undefined}
                >
                  {message.content}
                </div>

                {/* User Label */}
                {message.role === 'user' && (
                  <span className="text-xs text-muted-foreground/60 self-end">You</span>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">A</span>
                </div>
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
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
            size="sm"
            label="Send message"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send01 size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
