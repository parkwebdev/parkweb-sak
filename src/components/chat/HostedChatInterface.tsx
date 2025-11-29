import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send01 } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface HostedChatInterfaceProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    deployment_config: any;
  };
  branding: {
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    hide_powered_by: boolean | null;
  } | null;
  orgName: string;
}

export const HostedChatInterface = ({ agent, branding, orgName }: HostedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: agent.deployment_config?.greeting || `Hi! I'm ${agent.name}. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primaryColor = branding?.primary_color || '#6366f1';
  const secondaryColor = branding?.secondary_color || '#8b5cf6';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('widget-chat', {
        body: {
          agentId: agent.id,
          messages: newMessages,
        },
      });

      if (error) throw error;

      // Handle streaming response
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      if (!assistantMessage) {
        throw new Error('No response received');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className="border-b px-4 py-4 sm:px-6"
        style={{
          backgroundColor: `${primaryColor}10`,
          borderBottomColor: `${primaryColor}40`,
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {branding?.logo_url ? (
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src={branding.logo_url} alt={orgName} />
              <AvatarFallback style={{ backgroundColor: primaryColor }}>
                {orgName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {agent.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">{agent.name}</h1>
            {agent.description && (
              <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 sm:px-6 py-6" ref={scrollRef}>
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 shrink-0">
                  {branding?.logo_url ? (
                    <AvatarImage src={branding.logo_url} alt={agent.name} />
                  ) : null}
                  <AvatarFallback style={{ backgroundColor: secondaryColor }}>
                    {agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'text-white'
                    : 'bg-muted'
                }`}
                style={
                  message.role === 'user'
                    ? { backgroundColor: primaryColor }
                    : {}
                }
              >
                <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                {branding?.logo_url ? (
                  <AvatarImage src={branding.logo_url} alt={agent.name} />
                ) : null}
                <AvatarFallback style={{ backgroundColor: secondaryColor }}>
                  {agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-4 sm:px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={agent.deployment_config?.placeholder || 'Type your message...'}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send01 className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!branding?.hide_powered_by && (
            <p className="text-xs text-center text-muted-foreground mt-3">
              Powered by {orgName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
