/**
 * MessagesView Component
 * 
 * Conversation list view showing all past conversations with previews.
 * Allows users to open existing conversations or start new ones.
 * 
 * @module widget/views/MessagesView
 */

import { WidgetButton } from '../ui';
import { MessageChatCircle, ChevronRight } from '../icons';
import { formatTimestamp } from '../utils';
import type { Conversation } from '../types';

interface MessagesViewProps {
  conversations: Conversation[];
  onOpenConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
}

export const MessagesView = ({
  conversations,
  onOpenConversation,
  onStartNewConversation,
}: MessagesViewProps) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageChatCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start a new conversation below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onOpenConversation(conversation.id)}
                className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MessageChatCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.preview}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(new Date(conversation.updatedAt))}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Start New Conversation Button - Black styling */}
      <div className="p-4 border-t">
        <WidgetButton
          onClick={onStartNewConversation}
          className="w-full bg-foreground text-background hover:bg-foreground/90"
        >
          <MessageChatCircle className="h-4 w-4 mr-2" />
          Start New Conversation
        </WidgetButton>
      </div>
    </div>
  );
};
