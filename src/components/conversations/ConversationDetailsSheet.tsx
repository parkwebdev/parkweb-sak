import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User01, Zap, UserCheck01, RefreshCcw01, XCircle } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { TakeoverDialog } from './TakeoverDialog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';
import { LoadingState } from '@/components/ui/loading-state';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type Message = Tables<'messages'>;

interface ConversationDetailsSheetProps {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFetchMessages: (conversationId: string) => Promise<Message[]>;
  onTakeover: (conversationId: string, reason?: string) => Promise<void>;
  onReturnToAI: (conversationId: string) => Promise<void>;
  onClose: (conversationId: string) => Promise<void>;
  onReopen: (conversationId: string) => Promise<void>;
}

export const ConversationDetailsSheet = ({
  conversation,
  open,
  onOpenChange,
  onFetchMessages,
  onTakeover,
  onReturnToAI,
  onClose,
  onReopen,
}: ConversationDetailsSheetProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);

  useEffect(() => {
    if (conversation?.id && open) {
      loadMessages();

      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`messages-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversation?.id, open]);

  const loadMessages = async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    try {
      const msgs = await onFetchMessages(conversation.id);
      setMessages(msgs);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeover = async (reason?: string) => {
    if (!conversation?.id) return;
    await onTakeover(conversation.id, reason);
    setTakeoverDialogOpen(false);
  };

  const handleReturnToAI = async () => {
    if (!conversation?.id) return;
    await onReturnToAI(conversation.id);
  };

  const handleCloseConversation = async () => {
    if (!conversation?.id) return;
    await onClose(conversation.id);
  };

  const handleReopen = async () => {
    if (!conversation?.id) return;
    await onReopen(conversation.id);
  };

  if (!conversation) return null;

  const metadata = (conversation.metadata || {}) as ConversationMetadata;
  const statusColors = {
    active: 'bg-success/10 text-success border-success/20',
    human_takeover: 'bg-warning/10 text-warning border-warning/20',
    closed: 'bg-muted text-muted-foreground',
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Conversation Details</SheetTitle>
              <Badge variant="outline" className={statusColors[conversation.status]}>
                {conversation.status === 'human_takeover' ? 'Human Takeover' : conversation.status}
              </Badge>
            </div>
            <SheetDescription>
              Agent: {conversation.agents?.name || 'Unknown'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Started</p>
                <p>{formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Last Update</p>
                <p>{formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}</p>
              </div>
            </div>

            {metadata?.lead_name && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Lead</p>
                <div className="flex items-center gap-2">
                  <User01 className="h-4 w-4" />
                  <span>{metadata.lead_name}</span>
                  {metadata.lead_email && (
                    <span className="text-muted-foreground">({metadata.lead_email})</span>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap gap-2">
              {conversation.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTakeoverDialogOpen(true)}
                >
                  <UserCheck01 className="h-4 w-4 mr-2" />
                  Take Over
                </Button>
              )}
              
              {conversation.status === 'human_takeover' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReturnToAI}
                >
                  <RefreshCcw01 className="h-4 w-4 mr-2" />
                  Return to AI
                </Button>
              )}

              {conversation.status !== 'closed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseConversation}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close
                </Button>
              )}

              {conversation.status === 'closed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReopen}
                >
                  <RefreshCcw01 className="h-4 w-4 mr-2" />
                  Re-open
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold mb-3">Message History</h3>
            
            {loading ? (
              <LoadingState size="md" className="flex-1" />
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                No messages yet
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <User01 className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TakeoverDialog
        open={takeoverDialogOpen}
        onOpenChange={setTakeoverDialogOpen}
        onConfirm={handleTakeover}
      />
    </>
  );
};
