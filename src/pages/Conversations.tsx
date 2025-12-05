import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/Badge';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchMd, MessageChatSquare, User01, Send01, FaceSmile } from '@untitledui/icons';
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

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

// Format time as "11 hrs ago" or "5 mins ago"
const formatShortTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format sender name as "Aaron C."
const formatSenderName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
};

// Function to update message reaction via edge function
async function updateMessageReaction(
  messageId: string,
  emoji: string,
  action: 'add' | 'remove',
  reactorType: 'user' | 'admin'
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.functions.invoke('update-message-reaction', {
      body: { messageId, emoji, action, reactorType },
    });
    return error ? { success: false } : { success: true };
  } catch {
    return { success: false };
  }
}

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
    reopenConversation,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [metadataPanelCollapsed, setMetadataPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('conversations_metadata_collapsed');
    return saved === 'true';
  });

  // Persist metadata panel collapsed state
  useEffect(() => {
    localStorage.setItem('conversations_metadata_collapsed', String(metadataPanelCollapsed));
  }, [metadataPanelCollapsed]);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  
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
        return 'bg-info/10 text-info';
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

  const handleReopen = async () => {
    if (!selectedConversation) return;
    await reopenConversation(selectedConversation.id);
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
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
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
    <div className="h-full flex min-h-0">
      {/* Conversations List Sidebar */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 border-r flex-col bg-background min-h-0">
        {/* Header */}
        <div className="p-4 border-b shrink-0">
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
        <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-8 m-4 rounded-lg border border-dashed bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3">
                  <MessageChatSquare className="h-5 w-5 text-muted-foreground/50" />
                </div>
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
                            via {conv.agents?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={`${getStatusColor(conv.status)} text-[10px] px-2 py-0.5`}>
                              {conv.status === 'human_takeover' ? 'Human' : conv.status === 'active' ? 'AI' : conv.status}
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
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat Header - compact, no avatar */}
            <div className="px-6 py-3 border-b flex items-center justify-between bg-background shrink-0">
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
                {selectedConversation.status === 'closed' && (
                  <Button size="sm" variant="outline" onClick={handleReopen}>
                    Re-open
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                  {loadingMessages ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 px-8 rounded-lg border border-dashed bg-muted/30">
                      <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3">
                        <MessageChatSquare className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                  <div className="space-y-3 max-w-4xl mx-auto">
                    {messages.map((message) => {
                      const isUser = message.role === 'user';
                      const msgMetadata = message.metadata as any;
                      const isHumanSent = msgMetadata?.sender_type === 'human';
                      const reactions = msgMetadata?.reactions as Array<{ emoji: string; count: number; userReacted?: boolean; adminReacted?: boolean }> | undefined;
                      
                      const handleAddReaction = async (emoji: string) => {
                        // Check if admin already reacted with this emoji
                        const existingReaction = reactions?.find(r => r.emoji === emoji);
                        if (existingReaction?.adminReacted) return;
                        
                        // Optimistic update
                        const updatedMessages = messages.map(m => {
                          if (m.id !== message.id) return m;
                          const meta = (m.metadata as any) || {};
                          const currentReactions = meta.reactions || [];
                          const reactionIdx = currentReactions.findIndex((r: any) => r.emoji === emoji);
                          
                          let newReactions;
                          if (reactionIdx >= 0) {
                            newReactions = [...currentReactions];
                            newReactions[reactionIdx] = { ...newReactions[reactionIdx], count: newReactions[reactionIdx].count + 1, adminReacted: true };
                          } else {
                            newReactions = [...currentReactions, { emoji, count: 1, userReacted: false, adminReacted: true }];
                          }
                          
                          return { ...m, metadata: { ...meta, reactions: newReactions } };
                        });
                        setMessages(updatedMessages);
                        
                        // Persist to database
                        await updateMessageReaction(message.id, emoji, 'add', 'admin');
                      };
                      
                      const handleRemoveReaction = async (emoji: string) => {
                        const existingReaction = reactions?.find(r => r.emoji === emoji);
                        if (!existingReaction?.adminReacted) return;
                        
                        // Optimistic update
                        const updatedMessages = messages.map(m => {
                          if (m.id !== message.id) return m;
                          const meta = (m.metadata as any) || {};
                          const currentReactions = meta.reactions || [];
                          const reactionIdx = currentReactions.findIndex((r: any) => r.emoji === emoji);
                          
                          if (reactionIdx < 0) return m;
                          
                          let newReactions = [...currentReactions];
                          newReactions[reactionIdx] = { ...newReactions[reactionIdx], count: newReactions[reactionIdx].count - 1, adminReacted: false };
                          if (newReactions[reactionIdx].count <= 0) {
                            newReactions = newReactions.filter((_, i) => i !== reactionIdx);
                          }
                          
                          return { ...m, metadata: { ...meta, reactions: newReactions } };
                        });
                        setMessages(updatedMessages);
                        
                        // Persist to database
                        await updateMessageReaction(message.id, emoji, 'remove', 'admin');
                      };
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-start gap-2 max-w-[75%]">
                          {!isUser && (
                              isHumanSent && msgMetadata?.sender_avatar ? (
                                <img 
                                  src={msgMetadata.sender_avatar} 
                                  alt={msgMetadata?.sender_name || 'Team member'} 
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                                  isHumanSent ? 'bg-info/10' : 'bg-primary/10'
                                }`}>
                                  <User01 size={14} className={isHumanSent ? 'text-info' : 'text-primary'} />
                                </div>
                              )
                            )}
                            <div>
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isUser
                                    ? 'bg-primary text-primary-foreground'
                                    : isHumanSent
                                      ? 'bg-info/10 text-foreground border border-info/20'
                                      : 'bg-muted text-foreground'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              </div>
                              {/* Message reactions display + add + time */}
                              <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
                                {reactions && reactions.map((reaction, i) => (
                                  <button
                                    key={i}
                                    onClick={() => reaction.adminReacted ? handleRemoveReaction(reaction.emoji) : handleAddReaction(reaction.emoji)}
                                    className={`text-xs rounded-full px-1.5 py-0.5 transition-colors ${
                                      reaction.adminReacted 
                                        ? 'bg-primary/20 border border-primary/30' 
                                        : 'bg-muted hover:bg-muted/80'
                                    }`}
                                  >
                                    {reaction.emoji} {reaction.count > 1 && reaction.count}
                                  </button>
                                ))}
                                {/* Add reaction button */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="text-xs bg-muted hover:bg-muted/80 rounded-full p-1 transition-colors opacity-50 hover:opacity-100">
                                      <FaceSmile size={12} />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto px-2 py-1 rounded-full" side="top" align="start">
                                    <div className="flex gap-1">
                                      {QUICK_EMOJIS.map((emoji) => {
                                        const alreadyReacted = reactions?.find(r => r.emoji === emoji)?.adminReacted;
                                        return (
                                          <button
                                            key={emoji}
                                            onClick={() => alreadyReacted ? handleRemoveReaction(emoji) : handleAddReaction(emoji)}
                                            className={`text-lg p-1 hover:bg-muted rounded transition-transform hover:scale-110 ${alreadyReacted ? 'bg-primary/20' : ''}`}
                                          >
                                            {emoji}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                {/* Time inline with reactions */}
                                <span className={`text-[10px] text-muted-foreground ml-auto ${isUser ? 'order-first mr-auto ml-0' : ''}`}>
                                  {isHumanSent && msgMetadata?.sender_name && (
                                    <>{formatSenderName(msgMetadata.sender_name)} • </>
                                  )}
                                  {formatShortTime(new Date(message.created_at))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
            </div>

            {/* Message Input */}
            {selectedConversation.status === 'human_takeover' && (
              <div className="px-6 py-4 border-t bg-background shrink-0">
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
          <div className="flex-1 flex items-center justify-center bg-muted/20 min-h-0">
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
          isCollapsed={metadataPanelCollapsed}
          onToggleCollapse={() => setMetadataPanelCollapsed(!metadataPanelCollapsed)}
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
