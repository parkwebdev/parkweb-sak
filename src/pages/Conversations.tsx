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
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium mb-6">
        <div className="items-stretch flex w-full flex-col gap-4 px-4 lg:px-8 py-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu size={16} />
            </Button>
            <h1 className="text-sm font-semibold text-foreground">Conversations</h1>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 pb-8">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="bg-card rounded-lg border h-full flex flex-col">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
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
                  <div className="p-4 text-center">
                    <MessageChatSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => {
                      const isSelected = selectedConversation?.id === conv.id;
                      const metadata = (conv.metadata as any) || {};
                      
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full text-left p-4 hover:bg-accent/50 transition-colors ${
                            isSelected ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User01 size={20} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-medium text-xs truncate">
                                  {metadata.lead_name || metadata.lead_email || 'Anonymous'}
                                </p>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate mb-1">
                                {conv.agents?.name}
                              </p>
                              <Badge variant="outline" className={`${getStatusColor(conv.status)} text-[9px] px-1.5 py-0.5`}>
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
          </div>

          {/* Chat Area */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            {selectedConversation ? (
              <div className="bg-card rounded-lg border h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User01 size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">
                        {((selectedConversation.metadata as any)?.lead_name || 
                          (selectedConversation.metadata as any)?.lead_email || 
                          'Anonymous')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
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
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageChatSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isUser = message.role === 'user';
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                              <p className={`text-[9px] mt-1 ${
                                isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input (disabled for now) */}
                {selectedConversation.status === 'human_takeover' && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Type a message..." 
                        disabled
                        className="flex-1"
                      />
                      <Button size="sm" disabled>
                        <Send01 size={16} />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Human messaging coming soon
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-lg border h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageChatSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Select a conversation to view details
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
