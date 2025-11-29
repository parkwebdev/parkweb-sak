import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send01, Minimize02 } from '@untitledui/icons';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ChatBubbleIcon } from './ChatBubbleIcon';

interface EmbeddedChatPreviewProps {
  config: EmbeddedChatConfig;
}

export const EmbeddedChatPreview = ({ config }: EmbeddedChatPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: config.greeting },
  ]);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div className="relative h-[600px] bg-muted/30 rounded-lg p-4 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <p>Website Preview Area</p>
      </div>

      {/* Chat Container */}
      <div className={`absolute ${positionClasses[config.position]} z-10`}>
        {isOpen ? (
          <Card 
            className="w-[380px] h-[600px] flex flex-col shadow-xl"
            style={{ 
              borderColor: config.primaryColor,
              borderWidth: '2px',
            }}
          >
            {/* Header */}
            <div 
              className="p-4 flex items-center justify-between rounded-t-lg"
              style={{ backgroundColor: config.primaryColor }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: config.secondaryColor, color: config.primaryColor }}
                >
                  {config.agentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{config.agentName}</h3>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <Minimize02 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'text-white'
                        : 'bg-muted'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: config.primaryColor } : {}}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={config.placeholder}
                  className="flex-1"
                />
                <Button size="icon" style={{ backgroundColor: config.primaryColor }}>
                  <Send01 className="h-4 w-4 text-white" />
                </Button>
              </div>
              {config.showBranding && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Powered by Your Company
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Button
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg"
            style={{ backgroundColor: config.primaryColor }}
            onClick={() => setIsOpen(true)}
          >
            <ChatBubbleIcon className="h-8 w-8 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
};
