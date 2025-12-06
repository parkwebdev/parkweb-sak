import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';

interface TypingIndicatorProps {
  primaryColor: string;
  isHumanTyping?: boolean;
  typingAgentName?: string;
}

export const TypingIndicator = ({ primaryColor, isHumanTyping, typingAgentName }: TypingIndicatorProps) => {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
        <ChatBubbleIcon className="h-4 w-4" style={{ color: primaryColor }} />
      </div>
      <div className="bg-muted rounded-lg p-3">
        <div className="flex items-center gap-1.5">
          {isHumanTyping && typingAgentName && (
            <span className="text-xs text-blue-600 font-medium mr-1">{typingAgentName}</span>
          )}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
