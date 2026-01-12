/**
 * PromptTestChat Component
 * 
 * Test conversation simulation for baseline prompts.
 * 
 * @module components/admin/prompts/PromptTestChat
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send01, Trash01, RefreshCw01 } from '@untitledui/icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface PromptTestChatProps {
  baselinePrompt: string;
}

/**
 * Chat interface for testing baseline prompts.
 */
export function PromptTestChat({ baselinePrompt }: PromptTestChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Simulate AI response (in production, this would call an edge function)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `[Test Response] Using baseline prompt: "${baselinePrompt.slice(0, 50)}..."\n\nThis is a simulated response to: "${input.trim()}"`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Test Chat</CardTitle>
            <CardDescription>
              Test how the baseline prompt affects responses
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash01 size={14} className="mr-1" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] rounded-lg border border-border p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Send a message to test the baseline prompt
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <RefreshCw01
                      size={16}
                      className="animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

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
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading}>
            <Send01 size={16} aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
