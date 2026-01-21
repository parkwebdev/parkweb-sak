/**
 * PromptTestChat Component
 * 
 * Interactive test chat for baseline prompts.
 * 
 * @module components/admin/prompts/PromptTestChat
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send01, Trash01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface PromptTestChatProps {
  baselinePrompt: string;
}

/**
 * Interactive chat interface for testing baseline prompts.
 */
export function PromptTestChat({ baselinePrompt }: PromptTestChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Simulate AI response (in production, this would call an edge function with the baselinePrompt)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `This is a simulated response using the baseline prompt.\n\nYour message: "${userMessage.content}"`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Send a message to test the prompt
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3.5 py-2 flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a test message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            size="sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || loading}
            size="sm"
          >
            <Send01 size={16} aria-hidden="true" />
          </Button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1"
          >
            <Trash01 size={12} aria-hidden="true" />
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
}
