import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/Badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchMd, MessageChatSquare, User01, Send01 } from '@untitledui/icons';
import { useConversations } from '@/hooks/useConversations';
import { ConversationMetadataPanel } from '@/components/conversations/ConversationMetadataPanel';
import type { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { TakeoverDialog } from '@/components/conversations/TakeoverDialog';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type Message = Tables<'messages'>;

const Conversations: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations, 
    loading, 
    fetchMessages, 
    updateConversationStatus,
    updateConversationMetadata,
    takeover, 
    returnToAI,
    sendHumanMessage,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Typing indicator state
  const [isTypingBroadcast, setIsTypingBroadcast] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);

      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`conv-messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          () => {
            loadMessages(selectedConversation.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation?.id]);

  // Update selected conversation when conversations list updates
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations]);

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
    const metadata = (conv.metadata as any) || {};
    const matchesSearch = searchQuery === '' || 
      conv.agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metadata?.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metadata?.lead_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (metadata?.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

  const getPriorityIndicator = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="w-2 h-2 rounded-full bg-destructive" />;
      case 'high':
        return <span className="w-2 h-2 rounded-full bg-warning" />;
      default:
        return null;
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

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || sendingMessage) return;
    
    // Immediately stop typing indicator
    stopTypingIndicator();
    
    setSendingMessage(true);
    const success = await sendHumanMessage(selectedConversation.id, messageInput.trim());
    
    if (success) {
      setMessageInput('');
      // Messages will update via real-time subscription
    }
    setSendingMessage(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up typing presence channel when conversation is in human takeover mode
  useEffect(() => {
    if (selectedConversation && selectedConversation.status === 'human_takeover' && user) {
      const channel = supabase.channel(`typing-${selectedConversation.id}`);
      typingChannelRef.current = channel;
      
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ isTyping: false, userId: user.id, name: user.email });
        }
      });

      return () => {
        if (typingChannelRef.current) {
          supabase.removeChannel(typingChannelRef.current);
          typingChannelRef.current = null;
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [selectedConversation?.id, selectedConversation?.status, user]);

  // Handle typing state changes with debounce
  const handleTyping = () => {
    if (!typingChannelRef.current || !user) return;

    // Start typing
    if (!isTypingBroadcast) {
      setIsTypingBroadcast(true);
      typingChannelRef.current.track({ isTyping: true, userId: user.id, name: user.email });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingBroadcast(false);
      typingChannelRef.current?.track({ isTyping: false, userId: user?.id, name: user?.email });
    }, 2000);
  };

  // Stop typing indicator when message is sent
  const stopTypingIndicator = () => {
    if (typingChannelRef.current && user) {
      typingChannelRef.current.track({ isTyping: false, userId: user.id, name: user.email });
    }
    setIsTypingBroadcast(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  return (
    <div className="h-screen bg-muted/30 flex overflow-hidden">
      {/* Conversations List Sidebar */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 border-r flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground mb-3">Conversations</h2>
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
                const priority = metadata.priority;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-accent/30 transition-colors border-b ${
                      isSelected ? 'bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                        <User01 size={20} className="text-primary" />
                        {getPriorityIndicator(priority) && (
                          <div className="absolute -top-0.5 -right-0.5">
                            {getPriorityIndicator(priority)}
                          </div>
                        )}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className={`${getStatusColor(conv.status)} text-[10px] px-2 py-0.5`}>
                            {conv.status.replace('_', ' ')}
                          </Badge>
                          {metadata.country && (
                            <span className="text-[10px] text-muted-foreground">
                              {metadata.country}
                            </span>
                          )}
                        </div>
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
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-background">
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
                    const msgMetadata = message.metadata as any;
                    const isHumanSent = msgMetadata?.sender_type === 'human';
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-start gap-2 max-w-[75%]">
                          {!isUser && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                              isHumanSent ? 'bg-warning/10' : 'bg-primary/10'
                            }`}>
                              <User01 size={14} className={isHumanSent ? 'text-warning' : 'text-primary'} />
                            </div>
                          )}
                          <div>
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${
                                isUser
                                  ? 'bg-primary text-primary-foreground'
                                  : isHumanSent
                                    ? 'bg-warning/10 text-foreground border border-warning/20'
                                    : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                            <p className={`text-[10px] mt-1 px-2 ${
                              isUser ? 'text-right text-muted-foreground' : 'text-muted-foreground'
                            }`}>
                              {isHumanSent && <span className="mr-1">👤</span>}
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            {selectedConversation.status === 'human_takeover' && (
              <div className="px-6 py-4 border-t bg-background">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-3 max-w-4xl mx-auto"
                >
                  <Input 
                    placeholder="Type a message..." 
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={sendingMessage || !messageInput.trim()}
                  >
                    <Send01 size={16} />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Messages sent here will appear in the user's widget in real-time
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageChatSquare className="h-20 w-20 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Panel */}
      {selectedConversation && (
        <ConversationMetadataPanel
          conversation={selectedConversation}
          onUpdateMetadata={updateConversationMetadata}
        />
      )}

      {selectedConversation && (
        <TakeoverDialog
          open={takeoverDialogOpen}
          onOpenChange={setTakeoverDialogOpen}
          onConfirm={handleTakeover}
        />
      )}
    </div>
  );
};

export default Conversations;
