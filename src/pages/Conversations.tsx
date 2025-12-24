/**
 * Conversations Page (Inbox)
 * 
 * Real-time conversation management interface for viewing and responding
 * to widget conversations. Features human takeover, emoji reactions,
 * file attachments, typing indicators, and conversation metadata panel.
 * 
 * @page
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SearchMd, MessageChatSquare, User01, Send01, FaceSmile, Globe01, Check, CheckCircle, XCircle, Download01, Attachment01, XClose, ChevronLeft, ChevronRight, SwitchVertical01, ChevronDown, Translate01 } from '@untitledui/icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { formatFileSize, validateFiles } from '@/lib/file-validation';
import { getStatusColor, getPriorityIndicator, getUnreadCount, formatUrl, updateMessageReaction } from '@/lib/conversation-utils';

import { useConversations } from '@/hooks/useConversations';
import { useAgent } from '@/hooks/useAgent';
import { useVisitorPresence } from '@/hooks/useVisitorPresence';
import { useTypingPresence } from '@/hooks/useTypingPresence';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { 
  ConversationMetadataPanel,
  InboxNavSidebar, 
  type InboxFilter,
  ConversationsList,
  ChatHeader,
  TranslationBanner,
  MessageThread,
  MessageInputArea,
} from '@/components/conversations';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata, MessageMetadata, MessageReaction } from '@/types/metadata';
import { formatDistanceToNow } from 'date-fns';
import { downloadFile } from '@/lib/file-download';
import { getLanguageFlag } from '@/lib/language-utils';
import { TakeoverDialog } from '@/components/conversations/TakeoverDialog';
import { supabase } from '@/integrations/supabase/client';
import { formatShortTime, formatSenderName } from '@/lib/time-formatting';
import { QuickEmojiButton } from '@/components/chat/QuickEmojiButton';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { formatMarkdownBullets, stripUrlsFromContent } from '@/widget/utils/url-stripper';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { messageBubbleVariants, messageBubbleUserVariants, messageBubbleReducedVariants, getVariants } from '@/lib/motion-variants';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type Message = Tables<'messages'>;

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

// updateMessageReaction is now imported from @/lib/conversation-utils

const Conversations: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
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

  const { agent } = useAgent();
  const agentId = agent?.id;
  const agentName = agent?.name || 'Ari';

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
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ files: File[]; urls: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadataPanelCollapsed, setMetadataPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('conversations_metadata_collapsed');
    return saved === 'true';
  });
  const [conversationsCollapsed, setConversationsCollapsed] = useState(() => {
    const saved = localStorage.getItem('inbox_conversations_collapsed');
    return saved === 'true';
  });
  const [activeFilter, setActiveFilter] = useState<InboxFilter>({ type: 'all', label: 'All Conversations' });
  const [sortBy, setSortBy] = useState<'last_activity' | 'newest' | 'oldest'>('last_activity');
  
  // Translation state
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingOutbound, setIsTranslatingOutbound] = useState(false);

  // Persist collapsed states
  useEffect(() => {
    localStorage.setItem('conversations_metadata_collapsed', String(metadataPanelCollapsed));
  }, [metadataPanelCollapsed]);
  useEffect(() => {
    localStorage.setItem('inbox_conversations_collapsed', String(conversationsCollapsed));
  }, [conversationsCollapsed]);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  // === EXTRACTED HOOKS (Phase 5 Section 1) ===
  
  // Visitor presence tracking via hook
  const { activeVisitors, getVisitorPresence: getVisitorPresenceById } = useVisitorPresence({ agentId });
  
  // Get visitor presence for a conversation
  const getVisitorPresence = useCallback((conversation: Conversation) => {
    const metadata = (conversation.metadata || {}) as ConversationMetadata;
    const visitorId = metadata.visitor_id;
    if (!visitorId) return null;
    return getVisitorPresenceById(visitorId);
  }, [getVisitorPresenceById]);
  
  // Typing presence for human takeover via hook
  const { handleTyping, stopTypingIndicator } = useTypingPresence({
    conversation: selectedConversation,
    userId: user?.id,
    userEmail: user?.email,
  });
  
  // Message state and real-time via hook
  const { 
    messages, 
    setMessages, 
    loadingMessages, 
    isNewMessage,
    newMessageIdsRef,
    isInitialLoadRef,
  } = useConversationMessages({
    conversationId: selectedConversation?.id,
    fetchMessages,
  });

  // formatUrl is now imported from @/lib/conversation-utils

  // Visitor presence tracking is now handled by useVisitorPresence hook


  // Translate messages to English
  const handleTranslate = async () => {
    if (!selectedConversation || messages.length === 0) return;
    setIsTranslating(true);
    try {
      const messagesToTranslate = messages.map(m => ({ id: m.id, content: m.content }));
      logger.debug('Sending for translation', { count: messagesToTranslate.length });
      
      const { data, error } = await supabase.functions.invoke('translate-messages', {
        body: { messages: messagesToTranslate, targetLanguage: 'en' }
      });
      
      logger.debug('Translation response', data);
      
      if (error) throw error;
      
      const translations: Record<string, string> = {};
      // Handle both direct array and nested response structure
      const translationsArray = data?.translations || data?.data?.translations || [];
      logger.debug('Translations array', translationsArray);
      
      translationsArray.forEach((t: { id: string; translated: string }) => {
        translations[t.id] = t.translated;
      });
      
      logger.debug('Parsed translations map', { entries: Object.keys(translations).length });
      
      setTranslatedMessages(translations);
      setShowTranslation(true);
    } catch (err) {
      toast.error('Failed to translate messages');
      logger.error('Translation error', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Translate outbound message from English to conversation language
  const handleTranslateOutbound = async () => {
    const convMetadata = (selectedConversation?.metadata || {}) as ConversationMetadata;
    const targetLang = convMetadata.detected_language_code;
    const targetLangName = convMetadata.detected_language || targetLang;
    
    if (!targetLang || !messageInput.trim()) return;
    
    setIsTranslatingOutbound(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-messages', {
        body: { 
          messages: [{ id: 'outbound', content: messageInput }], 
          targetLanguage: targetLang 
        }
      });
      
      if (error) throw error;
      
      const translationsArray = data?.translations || data?.data?.translations || [];
      const translated = translationsArray[0]?.translated;
      if (translated) {
        setMessageInput(translated);
        toast.success(`Translated to ${targetLangName}`);
      }
    } catch (err) {
      toast.error('Failed to translate message');
      logger.error('Outbound translation error', err);
    } finally {
      setIsTranslatingOutbound(false);
    }
  };

  // Reset translation when conversation changes
  useEffect(() => {
    setShowTranslation(false);
    setTranslatedMessages({});
  }, [selectedConversation?.id]);

  // Message loading and real-time subscription is now handled by useConversationMessages hook

  // Handle conversation ID from URL query param (e.g., from "View Conversation" in leads)
  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('id');
    if (conversationIdFromUrl && conversations.length > 0 && !loading) {
      const conv = conversations.find(c => c.id === conversationIdFromUrl);
      if (conv) {
        setSelectedConversation(conv);
        // Clear the query param after selecting
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, conversations, loading]);

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

  // loadMessages is now handled by useConversationMessages hook

  // Fetch user's active takeovers for "Your Inbox" filter
  const { data: userTakeovers } = useQuery({
    queryKey: ['user-takeovers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('conversation_takeovers')
        .select('conversation_id')
        .eq('taken_over_by', user.id)
        .is('returned_to_ai_at', null);
      return data?.map(t => t.conversation_id) || [];
    },
    enabled: !!user?.id,
  });

  // Filter and sort conversations by active filter + search + sort
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv) => {
      const metadata = (conv.metadata || {}) as ConversationMetadata;
      
      // Apply nav filter
      let matchesFilter = true;
      if (activeFilter.type === 'status' && activeFilter.value) {
        matchesFilter = conv.status === activeFilter.value;
      } else if (activeFilter.type === 'channel' && activeFilter.value) {
        matchesFilter = conv.channel === activeFilter.value;
      } else if (activeFilter.type === 'yours') {
        matchesFilter = userTakeovers?.includes(conv.id) || false;
      }
      
      // Apply search
      const matchesSearch = searchQuery === '' || 
        conv.agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.lead_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (metadata?.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });

    // Sort conversations
    return filtered.sort((a, b) => {
      const metaA = (a.metadata || {}) as ConversationMetadata;
      const metaB = (b.metadata || {}) as ConversationMetadata;
      
      if (sortBy === 'last_activity') {
        const timeA = metaA.last_message_at ? new Date(metaA.last_message_at).getTime() : new Date(a.updated_at).getTime();
        const timeB = metaB.last_message_at ? new Date(metaB.last_message_at).getTime() : new Date(b.updated_at).getTime();
        return timeB - timeA; // Most recent first
      } else if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else { // oldest
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });
  }, [conversations, activeFilter, searchQuery, userTakeovers, sortBy]);

  // Calculate counts for nav sidebar
  const filterCounts = useMemo(() => ({
    all: conversations.length,
    yours: userTakeovers?.length || 0,
    resolved: conversations.filter(c => c.status === 'closed').length,
    widget: conversations.filter(c => c.channel === 'widget' || !c.channel).length,
    facebook: conversations.filter(c => c.channel === 'facebook').length,
    instagram: conversations.filter(c => c.channel === 'instagram').length,
    x: conversations.filter(c => c.channel === 'x').length,
  }), [conversations, userTakeovers]);

  // getStatusColor, getPriorityIndicator, getUnreadCount are now imported from @/lib/conversation-utils

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
      },
      // Tool columns - null for human messages
      tool_call_id: null,
      tool_name: null,
      tool_arguments: null,
      tool_result: null,
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

  // Typing is now handled by useTypingPresence hook

  return (
    <div className="h-full flex min-h-0 overflow-x-hidden">
      {/* Inbox Navigation Sidebar */}
      <InboxNavSidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Conversations List Sidebar */}
      <ConversationsList
        conversations={filteredConversations}
        allConversations={conversations}
        selectedId={selectedConversation?.id || null}
        onSelect={setSelectedConversation}
        isCollapsed={conversationsCollapsed}
        onToggleCollapse={() => setConversationsCollapsed(!conversationsCollapsed)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeFilterLabel={activeFilter.label}
        getVisitorPresence={getVisitorPresence}
        loading={loading}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={selectedConversation}
              isVisitorActive={!!getVisitorPresence(selectedConversation)}
              onTakeover={() => setTakeoverDialogOpen(true)}
              onReturnToAI={handleReturnToAI}
              onClose={handleClose}
              onReopen={handleReopen}
            />
            
            {/* Translation Banner */}
            {(() => {
              const convMetadata = (selectedConversation?.metadata || {}) as ConversationMetadata;
              const detectedLang = convMetadata.detected_language_code;
              if (!detectedLang || detectedLang === 'en') return null;
              
              return (
                <TranslationBanner
                  detectedLanguageCode={detectedLang}
                  detectedLanguageName={convMetadata.detected_language}
                  showTranslation={showTranslation}
                  isTranslating={isTranslating}
                  onToggleTranslation={() => setShowTranslation(false)}
                  onTranslate={handleTranslate}
                />
              );
            })()}
            
            {/* Message Thread */}
            <MessageThread
              ref={messagesScrollRef}
              messages={messages}
              setMessages={setMessages}
              visitorName={((selectedConversation?.metadata || {}) as ConversationMetadata).lead_name || 'Visitor'}
              showTranslation={showTranslation}
              translatedMessages={translatedMessages}
              isNewMessage={isNewMessage}
              loadingMessages={loadingMessages}
            />

            {/* Message Input */}
            {selectedConversation.status === 'human_takeover' && (
              <MessageInputArea
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                onFileSelect={handleFileSelect}
                pendingFiles={pendingFiles}
                onRemoveFile={handleRemoveFile}
                isSending={sendingMessage}
                onTyping={handleTyping}
                detectedLanguageCode={((selectedConversation?.metadata || {}) as ConversationMetadata).detected_language_code}
                detectedLanguageName={((selectedConversation?.metadata || {}) as ConversationMetadata).detected_language}
                onTranslateOutbound={handleTranslateOutbound}
                isTranslatingOutbound={isTranslatingOutbound}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20 min-h-0">
            <div className="text-center">
              <AriAgentsIcon className="h-6 w-6 mx-auto mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No conversations handled by Ari yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You'll see all conversations that Ari was a part of, whether completed, resolved or abandoned.
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
