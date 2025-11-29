import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/Badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu01 as Menu, SearchMd, MessageChatSquare, User01, Send01 } from '@untitledui/icons';
import { useConversations } from '@/hooks/useConversations';
import type { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { TakeoverDialog } from '@/components/conversations/TakeoverDialog';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type Message = Tables<'messages'>;

interface ConversationsProps {
  onMenuClick?: () => void;
}

const Conversations: React.FC<ConversationsProps> = ({ onMenuClick }) => {
  const { currentOrg } = useOrganization();
  const { 
    conversations, 
    loading, 
    fetchMessages, 
    updateConversationStatus, 
    takeover, 
    returnToAI 
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = searchQuery === '' || 
      conv.agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.metadata as any)?.lead_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'human_takeover':
        return 'bg-warning/10 text-warning';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleTakeover = async (reason?: string) => {
    if (!selectedConversation) return;
    await takeover(selectedConversation.id, reason);
    setTakeoverDialogOpen(false);
  };

  const handleReturnToAI = async () => {
    if (!selectedConversation) return;
    await returnToAI(selectedConversation.id);
  };

  const handleClose = async () => {
    if (!selectedConversation) return;
    await updateConversationStatus(selectedConversation.id, 'closed');
  };

  return (
    <main className="flex-1 bg-muted/30 h-screen p-4">
      {/* Mobile header */}
      <header className="lg:hidden mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
          >
            <Menu size={16} />
          </Button>
          <h1 className="text-sm font-semibold text-foreground">Conversations</h1>
        </div>
      </header>

      <div className="h-full lg:h-[calc(100%-2rem)]">
        <div className="flex h-full rounded-lg border bg-card overflow-hidden shadow-sm">
          {/* Conversations List Sidebar */}
          <div className="hidden lg:flex lg:w-80 xl:w-96 border-r flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-base font-semibold text-foreground mb-3">Conversations</h2>
            <div className="relative">
              <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageChatSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const metadata = (conv.metadata as any) || {};
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-accent/30 transition-colors border-b ${
                        isSelected ? 'bg-accent/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User01 size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p className="font-medium text-sm truncate text-foreground">
                              {metadata.lead_name || metadata.lead_email || 'Anonymous'}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                              {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1.5">
                            via {conv.agents?.name}
                          </p>
                          <Badge variant="outline" className={`${getStatusColor(conv.status)} text-[10px] px-2 py-0.5`}>
                            {conv.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User01 size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {((selectedConversation.metadata as any)?.lead_name || 
                        (selectedConversation.metadata as any)?.lead_email || 
                        'Anonymous')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.agents?.name} • {selectedConversation.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedConversation.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => setTakeoverDialogOpen(true)}>
                      Take Over
                    </Button>
                  )}
                  {selectedConversation.status === 'human_takeover' && (
                    <Button size="sm" variant="outline" onClick={handleReturnToAI}>
                      Return to AI
                    </Button>
                  )}
                  {selectedConversation.status !== 'closed' && (
                    <Button size="sm" variant="destructive" onClick={handleClose}>
                      Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                {loadingMessages ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageChatSquare className="h-16 w-16 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-4xl mx-auto">
                    {messages.map((message) => {
                      const isUser = message.role === 'user';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-start gap-2 max-w-[75%]">
                            {!isUser && (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <User01 size={14} className="text-primary" />
                              </div>
                            )}
                            <div>
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              </div>
                              <p className={`text-[10px] mt-1 px-2 ${
                                isUser ? 'text-right text-muted-foreground' : 'text-muted-foreground'
                              }`}>
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {isUser && (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <User01 size={14} className="text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input (disabled for now) */}
              {selectedConversation.status === 'human_takeover' && (
                <div className="px-6 py-4 border-t">
                  <div className="flex gap-3 max-w-4xl mx-auto">
                    <Input 
                      placeholder="Type a message..." 
                      disabled
                      className="flex-1 bg-muted/50"
                    />
                    <Button size="sm" disabled>
                      <Send01 size={16} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Human messaging coming soon
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageChatSquare className="h-20 w-20 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {selectedConversation && (
        <TakeoverDialog
          open={takeoverDialogOpen}
          onOpenChange={setTakeoverDialogOpen}
          onConfirm={handleTakeover}
        />
      )}
    </main>
  );
};

export default Conversations;
