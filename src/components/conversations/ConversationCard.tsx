/**
 * @fileoverview Conversation card component for conversation list display.
 * Shows agent name, status badge, lead info, and timestamps.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageChatSquare, Users01, Clock } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

interface ConversationCardProps {
  conversation: Conversation;
  onView: (conversation: Conversation) => void;
}

export const ConversationCard = ({ conversation, onView }: ConversationCardProps) => {
  const statusColors = {
    active: 'bg-success/10 text-success border-success/20',
    human_takeover: 'bg-warning/10 text-warning border-warning/20',
    closed: 'bg-muted text-muted-foreground',
  };

  const metadata = (conversation.metadata || {}) as ConversationMetadata;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(conversation)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MessageChatSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {conversation.agents?.name || 'Unknown Agent'}
              </span>
            </div>
            <Badge variant="outline" className={statusColors[conversation.status]}>
              {conversation.status === 'human_takeover' ? 'Human Takeover' : conversation.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {metadata?.lead_name && (
          <div className="flex items-center gap-2 text-sm">
            <Users01 className="h-4 w-4 text-muted-foreground" />
            <span>{metadata.lead_name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Updated {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}</span>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
          e.stopPropagation();
          onView(conversation);
        }}>
          View Messages
        </Button>
      </CardContent>
    </Card>
  );
};
