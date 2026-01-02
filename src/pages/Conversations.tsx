/**
 * Conversations Page (Inbox)
 * 
 * Real-time conversation management interface for viewing and responding
 * to widget conversations. Features human takeover, emoji reactions,
 * file attachments, typing indicators, and conversation metadata panel.
 * 
 * Refactored in Phase 5 to be a composition layer using extracted hooks
 * and components for better maintainability.
 * 
 * @page
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { validateFiles } from '@/lib/file-validation';
import { useCanManage } from '@/hooks/useCanManage';

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
import { TakeoverDialog } from '@/components/conversations/TakeoverDialog';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';

import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

// === TYPES ===
type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type Message = Tables<'messages'>;

// === MAIN COMPONENT ===
function Conversations() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if user can manage conversations (takeover, send messages, close/reopen)
  const canManageConversations = useCanManage('manage_conversations');
  
  // === DATA HOOKS ===
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

  // === LOCAL STATE ===
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ files: File[]; urls: string[] } | null>(null);
  
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

  // Refs
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const lastMarkedReadRef = useRef<string | null>(null);

  // === EXTRACTED HOOKS (Phase 5 Section 1) ===
  
  // Visitor presence tracking
  const { getVisitorPresence: getVisitorPresenceById } = useVisitorPresence({ agentId });
  
  // Get visitor presence for a conversation
  const getVisitorPresence = useCallback((conversation: Conversation) => {
    const metadata = (conversation.metadata || {}) as ConversationMetadata;
    const visitorId = metadata.visitor_id;
    if (!visitorId) return null;
    return getVisitorPresenceById(visitorId);
  }, [getVisitorPresenceById]);
  
  // Typing presence for human takeover
  const { handleTyping, stopTypingIndicator } = useTypingPresence({
    conversation: selectedConversation,
    userId: user?.id,
    userEmail: user?.email,
  });
  
  // Message state and real-time
  const { 
    messages, 
    setMessages, 
    loadingMessages, 
    isNewMessage,
    newMessageIdsRef,
  } = useConversationMessages({
    conversationId: selectedConversation?.id,
    fetchMessages,
  });

  // === EFFECTS ===
  
  // Persist collapsed states
  useEffect(() => {
    localStorage.setItem('conversations_metadata_collapsed', String(metadataPanelCollapsed));
  }, [metadataPanelCollapsed]);
  
  useEffect(() => {
    localStorage.setItem('inbox_conversations_collapsed', String(conversationsCollapsed));
  }, [conversationsCollapsed]);

  // Reset translation when conversation changes
  useEffect(() => {
    setShowTranslation(false);
    setTranslatedMessages({});
  }, [selectedConversation?.id]);

  // Handle conversation ID from URL query param
  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('id');
    if (conversationIdFromUrl && conversations.length > 0 && !loading) {
      const conv = conversations.find(c => c.id === conversationIdFromUrl);
      if (conv) {
        setSelectedConversation(conv);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, conversations, loading, setSearchParams]);

  // Update selected conversation when conversations list updates
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations, selectedConversation]);

  // Track admin_last_read_at when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== lastMarkedReadRef.current) {
      lastMarkedReadRef.current = selectedConversation.id;
      updateConversationMetadata(selectedConversation.id, {
        admin_last_read_at: new Date().toISOString()
      }, { silent: true });
    }
  }, [selectedConversation?.id, updateConversationMetadata]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // === QUERIES ===
  
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

  // === MEMOIZED VALUES ===
  
  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv) => {
      const metadata = (conv.metadata || {}) as ConversationMetadata;
      
      let matchesFilter = true;
      if (activeFilter.type === 'status' && activeFilter.value) {
        matchesFilter = conv.status === activeFilter.value;
      } else if (activeFilter.type === 'channel' && activeFilter.value) {
        matchesFilter = conv.channel === activeFilter.value;
      } else if (activeFilter.type === 'yours') {
        matchesFilter = userTakeovers?.includes(conv.id) || false;
      }
      
      const matchesSearch = searchQuery === '' || 
        conv.agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.lead_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (metadata?.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const metaA = (a.metadata || {}) as ConversationMetadata;
      const metaB = (b.metadata || {}) as ConversationMetadata;
      
      if (sortBy === 'last_activity') {
        const timeA = metaA.last_message_at ? new Date(metaA.last_message_at).getTime() : new Date(a.updated_at).getTime();
        const timeB = metaB.last_message_at ? new Date(metaB.last_message_at).getTime() : new Date(b.updated_at).getTime();
        return timeB - timeA;
      } else if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
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

  // === HANDLERS (useCallback for Phase 4 optimization) ===
  
  const handleTakeover = useCallback(async (reason?: string) => {
    if (!selectedConversation) return;
    await takeover(selectedConversation.id, reason);
    setTakeoverDialogOpen(false);
  }, [selectedConversation, takeover]);

  const handleReturnToAI = useCallback(async () => {
    if (!selectedConversation) return;
    await returnToAI(selectedConversation.id);
  }, [selectedConversation, returnToAI]);

  const handleClose = useCallback(async () => {
    if (!selectedConversation) return;
    await updateConversationStatus(selectedConversation.id, 'closed');
  }, [selectedConversation, updateConversationStatus]);

  const handleReopen = useCallback(async () => {
    if (!selectedConversation) return;
    await reopenConversation(selectedConversation.id);
  }, [selectedConversation, reopenConversation]);

  const handleTranslate = useCallback(async () => {
    if (!selectedConversation || messages.length === 0) return;
    setIsTranslating(true);
    try {
      const messagesToTranslate = messages.map(m => ({ id: m.id, content: m.content }));
      logger.debug('Sending for translation', { count: messagesToTranslate.length });
      
      const { data, error } = await supabase.functions.invoke('translate-messages', {
        body: { messages: messagesToTranslate, targetLanguage: 'en' }
      });
      
      if (error) throw error;
      
      const translations: Record<string, string> = {};
      const translationsArray = data?.translations || data?.data?.translations || [];
      translationsArray.forEach((t: { id: string; translated: string }) => {
        translations[t.id] = t.translated;
      });
      
      setTranslatedMessages(translations);
      setShowTranslation(true);
    } catch (err: unknown) {
      toast.error('Failed to translate messages');
      logger.error('Translation error', err);
    } finally {
      setIsTranslating(false);
    }
  }, [selectedConversation, messages]);

  const handleTranslateOutbound = useCallback(async () => {
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
    } catch (err: unknown) {
      toast.error('Failed to translate message');
      logger.error('Outbound translation error', err);
    } finally {
      setIsTranslatingOutbound(false);
    }
  }, [selectedConversation?.metadata, messageInput]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || sendingMessage) return;
    if (!messageInput.trim() && !pendingFiles) return;
    
    stopTypingIndicator();
    
    const content = messageInput.trim();
    const tempId = `temp-${Date.now()}`;
    
    const senderName = userProfile?.display_name || user?.email || 'Team Member';
    const senderAvatar = userProfile?.avatar_url || null;
    
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
      tool_call_id: null,
      tool_name: null,
      tool_arguments: null,
      tool_result: null,
    };
    
    newMessageIdsRef.current.add(tempId);
    setTimeout(() => newMessageIdsRef.current.delete(tempId), 300);
    
    setMessages(prev => [...prev, tempMessage]);
    setMessageInput('');
    
    const filesToSend = pendingFiles;
    setPendingFiles(null);
    
    setSendingMessage(true);
    const success = await sendHumanMessage(selectedConversation.id, content, filesToSend?.files);
    
    if (!success) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageInput(content);
      setPendingFiles(filesToSend);
    }
    
    setSendingMessage(false);
  }, [selectedConversation, sendingMessage, messageInput, pendingFiles, stopTypingIndicator, userProfile, user?.email, newMessageIdsRef, setMessages, sendHumanMessage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const validation = validateFiles(files);
    if (!validation.valid) {
      toast.error('Invalid file', { description: validation.error });
      return;
    }
    
    const urls = files.map(file => URL.createObjectURL(file));
    setPendingFiles({ files, urls });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    if (!pendingFiles) return;
    URL.revokeObjectURL(pendingFiles.urls[index]);
    const newFiles = pendingFiles.files.filter((_, i) => i !== index);
    const newUrls = pendingFiles.urls.filter((_, i) => i !== index);
    if (newFiles.length === 0) {
      setPendingFiles(null);
    } else {
      setPendingFiles({ files: newFiles, urls: newUrls });
    }
  }, [pendingFiles]);

  // === RENDER ===
  return (
    <div className="h-full flex min-h-0 overflow-x-hidden">
      {/* Inbox Navigation Sidebar */}
      <InboxNavSidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredConversations={filteredConversations}
        onSelectConversation={setSelectedConversation}
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
            <ChatHeader
              conversation={selectedConversation}
              isVisitorActive={!!getVisitorPresence(selectedConversation)}
              onTakeover={() => setTakeoverDialogOpen(true)}
              onReturnToAI={handleReturnToAI}
              onClose={handleClose}
              onReopen={handleReopen}
            />
            
            {/* Translation Banner - conditional render */}
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

            {selectedConversation.status === 'human_takeover' && canManageConversations && (
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

      {/* Takeover Dialog */}
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
