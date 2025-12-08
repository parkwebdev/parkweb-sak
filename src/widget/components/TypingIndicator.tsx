/**
 * TypingIndicator Component
 * 
 * Displays animated bouncing dots to indicate someone is typing.
 * Supports both AI and human typing indicators with agent name display.
 * 
 * @module widget/components/TypingIndicator
 */

import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';

/** Props for the TypingIndicator component */
interface TypingIndicatorProps {
  /** Primary brand color for avatar background */
  primaryColor: string;
  /** Whether a human agent is typing (vs AI) */
  isHumanTyping?: boolean;
  /** Name of the typing human agent */
  typingAgentName?: string;
}

/**
 * Animated typing indicator component.
 * 
 * @param props - Component props
 * @returns Typing indicator with bouncing dots
 */
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
