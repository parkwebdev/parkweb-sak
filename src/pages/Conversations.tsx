import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/Badge';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SearchMd, MessageChatSquare, User01, Send01, FaceSmile, Globe01, Check, CheckCircle, XCircle, Download01, Attachment01, XClose } from '@untitledui/icons';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { formatFileSize, validateFiles } from '@/lib/file-validation';
import { EmptyState } from '@/components/ui/empty-state';
import { useConversations } from '@/hooks/useConversations';
import { useAgents } from '@/hooks/useAgents';
import { ConversationMetadataPanel } from '@/components/conversations/ConversationMetadataPanel';
import type { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { downloadFile } from '@/lib/file-download';
import { TakeoverDialog } from '@/components/conversations/TakeoverDialog';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { playNotificationSound } from '@/lib/notification-sound';
import { formatShortTime, formatSenderName } from '@/lib/time-formatting';
import { QuickEmojiButton } from '@/components/chat/QuickEmojiButton';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { toast } from '@/lib/toast';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type Message = Tables<'messages'>;

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

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

  const { agents } = useAgents();
  const agentNames = React.useMemo(() => {
    const map: Record<string, string> = {};
    agents.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [agents]);

  // Fetch current user's profile for optimistic message updates
  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ files: File[]; urls: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadataPanelCollapsed, setMetadataPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('conversations_metadata_collapsed');
    return saved === 'true';
  });

  // Persist metadata panel collapsed state
  useEffect(() => {
    localStorage.setItem('conversations_metadata_collapsed', String(metadataPanelCollapsed));
  }, [metadataPanelCollapsed]);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoadRef = useRef(true);
  const newMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Typing indicator state
  const [isTypingBroadcast, setIsTypingBroadcast] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  // Active visitor presence tracking
  const [activeVisitors, setActiveVisitors] = useState<Record<string, { currentPage: string; visitorId: string }>>({});

  // Format URL for display
  const formatUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      let path = parsed.pathname;
      if (path === '/') return '/';
      return path.length > 25 ? path.substring(0, 22) + '...' : path;
    } catch {
      return url.length > 25 ? url.substring(0, 22) + '...' : url;
    }
  };

  // Subscribe to presence for all agents to track active visitors
  useEffect(() => {
    if (agents.length === 0) return;

    const channels: RealtimeChannel[] = [];

    agents.forEach(agent => {
      const channel = supabase
        .channel(`visitor-presence-${agent.id}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const visitors: Record<string, { currentPage: string; visitorId: string }> = {};
          
          Object.values(state).flat().forEach((presence: any) => {
            if (presence.isWidgetOpen && presence.visitorId) {
              visitors[presence.visitorId] = {
                visitorId: presence.visitorId,
                currentPage: presence.currentPage || 'Unknown',
              };
            }
          });
          
          setActiveVisitors(prev => {
            const newState = { ...prev };
            // Remove visitors from this agent that are no longer present
            Object.keys(newState).forEach(vid => {
              const wasFromThisAgent = Object.values(state).flat().some((p: any) => p.visitorId === vid);
              if (!wasFromThisAgent) return;
              if (!visitors[vid]) delete newState[vid];
            });
            // Add/update visitors
            Object.assign(newState, visitors);
            return newState;
          });
        })
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [agents.map(a => a.id).join(',')]);

  // Check if a conversation's visitor is currently active
  const getVisitorPresence = (conversation: Conversation) => {
    const metadata = (conversation.metadata as any) || {};
    const visitorId = metadata.visitor_id;
    if (!visitorId) return null;
    return activeVisitors[visitorId] || null;
  };

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      isInitialLoadRef.current = true;
      loadMessages(selectedConversation.id, true);

      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`conv-messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            
            // Check if this replaces a pending optimistic message
            setMessages(prev => {
              // Avoid duplicates (real-time + optimistic update race)
              if (prev.some(m => m.id === newMessage.id)) return prev;
              
              // Check if we're replacing an optimistic temp message
              const isReplacingOptimistic = prev.some(m => 
                m.id.startsWith('temp-') && 
                (m.metadata as any)?.pending && 
                m.content === newMessage.content
              );
              
              // Only animate if it's a genuinely new message (not during initial load, not replacing optimistic)
              if (!isInitialLoadRef.current && !isReplacingOptimistic) {
                newMessageIdsRef.current.add(newMessage.id);
                setTimeout(() => newMessageIdsRef.current.delete(newMessage.id), 300);
              }
              
              // Remove any pending optimistic message with matching content
              const withoutTemp = prev.filter(m => {
                if (!m.id.startsWith('temp-')) return true;
                const tempMeta = m.metadata as any;
                return !(tempMeta?.pending && m.content === newMessage.content);
              });
              return [...withoutTemp, newMessage];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            console.log('[Admin] Message UPDATE received:', {
              messageId: payload.new?.id,
              metadata: (payload.new as any)?.metadata,
              reactions: (payload.new as any)?.metadata?.reactions,
            });
            const updatedMessage = payload.new as Message;
            // Incremental update - only update the affected message
            setMessages(prev => {
              console.log('[Admin] Updating message in state:', updatedMessage.id);
              return prev.map(m => m.id === updatedMessage.id ? updatedMessage : m);
            });
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

  // Track which conversation we've marked as read to prevent duplicate updates
  const lastMarkedReadRef = useRef<string | null>(null);

  // Track admin_last_read_at when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== lastMarkedReadRef.current) {
      lastMarkedReadRef.current = selectedConversation.id;
      updateConversationMetadata(selectedConversation.id, {
        admin_last_read_at: new Date().toISOString()
      }, { silent: true });
    }
  }, [selectedConversation?.id]);

  const loadMessages = async (conversationId: string, showLoading = true) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
      
      // Mark user messages as read by admin
      supabase.functions.invoke('mark-messages-read', {
        body: { conversationId, readerType: 'admin' }
      }).then(({ data }) => {
        if (data?.updated > 0) {
          console.log('[Conversations] Marked', data.updated, 'messages as read');
        }
      }).catch(err => console.error('Failed to mark messages as read:', err));
    } finally {
      if (showLoading) setLoadingMessages(false);
      isInitialLoadRef.current = false;
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

  // Check if conversation has unread messages for admin (only user messages, not team responses)
  const getUnreadCount = (conv: Conversation): number => {
    const metadata = conv.metadata as any;
    const lastReadAt = metadata?.admin_last_read_at;
    const lastUserMessageAt = metadata?.last_user_message_at;
    const lastMessageAt = metadata?.last_message_at;
    const lastMessageRole = metadata?.last_message_role;
    
    // Prefer last_user_message_at if available
    // Fallback to last_message_at only if last message wasn't from human team member
    const relevantMessageAt = lastUserMessageAt || 
      (lastMessageRole !== 'human' ? lastMessageAt : null);
    
    if (!relevantMessageAt) return 0;
    
    // Never read by admin - show indicator
    if (!lastReadAt) return 1;
    
    // New user messages since last read
    return new Date(relevantMessageAt) > new Date(lastReadAt) ? 1 : 0;
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
    if (!selectedConversation || sendingMessage) return;
    if (!messageInput.trim() && !pendingFiles) return;
    
    // Immediately stop typing indicator
    stopTypingIndicator();
    
    const content = messageInput.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update: show message instantly with sender info to prevent flicker
    const senderName = userProfile?.display_name || user?.email || 'Team Member';
    const senderAvatar = userProfile?.avatar_url || null;
    
    // Build file metadata for optimistic display
    const fileMetadata = pendingFiles?.files.map((file, i) => ({
      name: file.name,
      url: pendingFiles.urls[i],
      type: file.type,
      size: file.size,
    }));
    
    const tempMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation.id,
      role: 'assistant',
      content: content || (pendingFiles ? `Sent ${pendingFiles.files.length} file(s)` : ''),
      created_at: new Date().toISOString(),
      metadata: { 
        sender_type: 'human', 
        pending: true,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        files: fileMetadata,
      }
    };
    
    // Animate the optimistic message
    newMessageIdsRef.current.add(tempId);
    setTimeout(() => newMessageIdsRef.current.delete(tempId), 300);
    
    setMessages(prev => [...prev, tempMessage]);
    setMessageInput('');
    
    // Capture files before clearing state
    const filesToSend = pendingFiles;
    setPendingFiles(null);
    
    setSendingMessage(true);
    const success = await sendHumanMessage(selectedConversation.id, content, filesToSend?.files);
    
    if (!success) {
      // Rollback optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageInput(content); // Restore input
      setPendingFiles(filesToSend); // Restore files
    }
    // On success, real-time subscription will replace temp message with real one
    
    setSendingMessage(false);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const validation = validateFiles(files);
    if (!validation.valid) {
      toast.error('Invalid file', { description: validation.error });
      return;
    }
    
    const urls = files.map(file => URL.createObjectURL(file));
    setPendingFiles({ files, urls });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleRemoveFile = (index: number) => {
    if (!pendingFiles) return;
    URL.revokeObjectURL(pendingFiles.urls[index]);
    const newFiles = pendingFiles.files.filter((_, i) => i !== index);
    const newUrls = pendingFiles.urls.filter((_, i) => i !== index);
    if (newFiles.length === 0) {
      setPendingFiles(null);
    } else {
      setPendingFiles({ files: newFiles, urls: newUrls });
    }
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

  // Auto-resize message textarea
  useAutoResizeTextarea(messageTextareaRef, messageInput, { minRows: 1, maxRows: 5 });

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
              <EmptyState
                icon={<MessageChatSquare className="h-5 w-5 text-muted-foreground/50" />}
                title="No conversations yet"
                className="m-4"
              />
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
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                          <User01 size={16} className="text-primary" />
                          {/* Unread messages indicator */}
                          {getUnreadCount(conv) > 0 && !getVisitorPresence(conv) && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                          )}
                          {/* Active visitor indicator */}
                          {getVisitorPresence(conv) && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                          )}
                          {getPriorityIndicator(priority) && !getVisitorPresence(conv) && !getUnreadCount(conv) && (
                            <div className="absolute -top-0.5 -right-0.5">
                              {getPriorityIndicator(priority)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground mb-0.5">
                            {metadata.lead_name || metadata.lead_email || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            via {conv.agents?.name || 'Unknown'}
                          </p>
                          {metadata.last_message_preview && (
                            <p className="text-xs text-muted-foreground/70 truncate mb-1.5">
                              {metadata.last_message_preview}
                              {metadata.last_message_preview.length >= 60 && '...'}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`${getStatusColor(conv.status)} text-[10px] px-2 py-0.5`}>
                              {conv.status === 'human_takeover' ? 'Human' : conv.status === 'active' ? 'AI' : conv.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              • {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                            </span>
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
            {/* Chat Header - compact with active status */}
            {(() => {
              const visitorPresence = getVisitorPresence(selectedConversation);
              const isActive = !!visitorPresence;
              
              return (
                <div className="px-6 py-3 border-b flex items-center justify-between bg-background shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-success" />
                        <div className="absolute w-2.5 h-2.5 rounded-full border-2 border-success animate-ping" />
                      </div>
                    )}
                    <p className="font-medium text-sm text-foreground">
                      {((selectedConversation.metadata as any)?.lead_name || 
                        (selectedConversation.metadata as any)?.lead_email || 
                        'Anonymous')}
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
              );
            })()}
            <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                  {loadingMessages ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <EmptyState
                      icon={<MessageChatSquare className="h-5 w-5 text-muted-foreground/50" />}
                      title="No messages yet"
                    />
                  ) : (
                  <div className="space-y-3 max-w-4xl mx-auto">
                    {messages.map((message, msgIndex) => {
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
                      
                      const isNewMessage = newMessageIdsRef.current.has(message.id);
                      
                      // Detect if this is a continuation of previous message (same sender)
                      const prevMessage = msgIndex > 0 ? messages[msgIndex - 1] : null;
                      const prevMsgMetadata = prevMessage?.metadata as { sender_type?: string } | null;
                      const isContinuation = prevMessage && 
                        prevMessage.role === message.role &&
                        (message.role === 'user' || prevMsgMetadata?.sender_type === msgMetadata?.sender_type);
                      
                      // Check if next message is from same sender (to know if we should show metadata)
                      const nextMessage = msgIndex < messages.length - 1 ? messages[msgIndex + 1] : null;
                      const nextMsgMetadata = nextMessage?.metadata as { sender_type?: string } | null;
                      const isLastInGroup = !nextMessage || 
                        nextMessage.role !== message.role ||
                        (message.role !== 'user' && nextMsgMetadata?.sender_type !== msgMetadata?.sender_type);
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${
                            isNewMessage ? (isUser ? 'animate-slide-in-right' : 'animate-slide-in-left') : ''
                          } ${isContinuation ? 'mt-1' : 'mt-1 first:mt-0'}`}
                        >
                          <div className={`flex items-start gap-2 max-w-[75%] ${isContinuation && !isUser ? 'ml-10' : ''}`}>
                          {!isUser && !isContinuation && (
                              isHumanSent && msgMetadata?.sender_avatar ? (
                                <img 
                                  src={msgMetadata.sender_avatar} 
                                  alt={msgMetadata?.sender_name || 'Team member'} 
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                                />
                              ) : isHumanSent ? (
                                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 mt-1">
                                  <span className="text-info text-xs font-medium">
                                    {(msgMetadata?.sender_name || 'T').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                  <User01 size={14} className="text-primary" />
                                </div>
                              )
                            )}
                            <div className="flex flex-col">
                              {/* Name + Timestamp header row - only show if !isContinuation */}
                              {!isContinuation && (
                                <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 ${isUser ? 'justify-end mr-1' : 'ml-1'}`}>
                                  <span className="font-medium">
                                    {isUser ? ((selectedConversation?.metadata as any)?.lead_name || 'Visitor') : (isHumanSent ? formatSenderName(msgMetadata?.sender_name) : 'AI Agent')}
                                  </span>
                                  <span>•</span>
                                  <span>{formatShortTime(new Date(message.created_at))}</span>
                                  {/* Status badges for human messages */}
                                  {isHumanSent && (
                                    <>
                                      {msgMetadata?.error || msgMetadata?.failed ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-destructive inline-flex items-center">
                                              <XCircle size={12} />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>Failed</TooltipContent>
                                        </Tooltip>
                                      ) : msgMetadata?.read_at ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-info inline-flex items-center">
                                              <CheckCircle size={12} />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>Seen</TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="inline-flex items-center">
                                              <Check size={12} />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>Sent</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                              {/* Message bubble - content only */}
                              <div
                                className={`rounded-lg px-3 py-2 text-foreground ${isUser ? '' : 'bg-muted'}`}
                                style={isUser ? { backgroundColor: 'rgb(1 110 237 / 7%)' } : undefined}
                              >
                                {/* Check for file attachments in metadata */}
                                {msgMetadata?.files && Array.isArray(msgMetadata.files) && msgMetadata.files.length > 0 && (
                                  <div className="space-y-2 mb-2">
                                    {msgMetadata.files.map((file: { name: string; url: string; type?: string; size?: number }, i: number) => (
                                      <div key={i}>
                                        {file.type?.startsWith('image/') ? (
                                          <div className="flex items-center gap-3 p-2 border rounded-lg bg-background/50 max-w-[280px]">
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                              <img 
                                                src={file.url} 
                                                alt={file.name} 
                                                className="w-12 h-12 object-cover rounded-md" 
                                              />
                                            </a>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{file.name}</p>
                                              {file.size && (
                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                              )}
                                            </div>
                                            <button
                                              onClick={() => downloadFile(file.url, file.name)}
                                              className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                                              title="Download"
                                            >
                                              <Download01 size={16} className="text-muted-foreground" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-3 p-2 border rounded-lg bg-background/50 max-w-[280px]">
                                            <FileTypeIcon fileName={file.name} width={36} height={36} className="shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{file.name}</p>
                                              {file.size && (
                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                              )}
                                            </div>
                                            <button
                                              onClick={() => downloadFile(file.url, file.name)}
                                              className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                                              title="Download"
                                            >
                                              <Download01 size={16} className="text-muted-foreground" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Regular text content */}
                                {message.content && message.content !== 'Sent files' && (
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                )}
                                <LinkPreviews content={message.content} />
                              </div>
                              {/* Reactions row - only show for last message in group, team members can only react to user messages */}
                              {isLastInGroup && isUser && reactions && reactions.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
                                  {reactions.map((reaction, i) => (
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
                                </div>
                              )}
                              {/* Add reaction button when no reactions exist - only for user messages */}
                              {isLastInGroup && isUser && (!reactions || reactions.length === 0) && (
                                <div className="flex items-center gap-1 mt-1 px-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="text-xs bg-muted hover:bg-muted/80 rounded-full p-1 transition-colors opacity-50 hover:opacity-100">
                                        <FaceSmile size={12} />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto px-2 py-1 rounded-full" side="top" align="start">
                                      <div className="flex gap-1">
                                        {QUICK_EMOJIS.map((emoji) => (
                                          <button
                                            key={emoji}
                                            onClick={() => handleAddReaction(emoji)}
                                            className="text-lg p-1 hover:bg-muted rounded transition-transform hover:scale-110"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                              {/* Display user reactions on assistant/team messages - read-only */}
                              {isLastInGroup && !isUser && reactions && reactions.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
                                  {reactions
                                    .filter((r: any) => r.userReacted && r.count > 0)
                                    .map((reaction: any, i: number) => (
                                      <span 
                                        key={i} 
                                        className="text-xs bg-muted rounded-full px-1.5 py-0.5"
                                      >
                                        {reaction.emoji} {reaction.count > 1 && reaction.count}
                                      </span>
                                    ))}
                                </div>
                              )}
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
                {/* Pending Files Preview */}
                {pendingFiles && pendingFiles.files.length > 0 && (
                  <div className="max-w-4xl mx-auto mb-3">
                    <div className="flex flex-wrap gap-2">
                      {pendingFiles.files.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
                        >
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={pendingFiles.urls[index]} 
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <FileTypeIcon fileName={file.name} width={20} height={20} />
                          )}
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="p-0.5 hover:bg-accent rounded"
                          >
                            <XClose size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex items-end gap-3 max-w-4xl mx-auto"
                >
                  <QuickEmojiButton
                    onEmojiSelect={(emoji) => {
                      const textarea = messageTextareaRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newValue = messageInput.slice(0, start) + emoji + messageInput.slice(end);
                        setMessageInput(newValue);
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                        }, 0);
                      } else {
                        setMessageInput(prev => prev + emoji);
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingMessage}
                    className="h-10 w-10"
                  >
                    <Attachment01 size={18} />
                  </Button>
                  
                  <div className="relative flex-1">
                    <Textarea
                      ref={messageTextareaRef}
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={sendingMessage}
                      rows={1}
                      className="min-h-[40px] max-h-[120px] py-2.5 pr-12 resize-none"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      disabled={sendingMessage || (!messageInput.trim() && !pendingFiles)}
                    >
                      <Send01 size={16} />
                    </Button>
                  </div>
                </form>
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
