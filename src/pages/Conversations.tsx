import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu01 as Menu, SearchMd } from '@untitledui/icons';
import { useConversations } from '@/hooks/useConversations';
import { ConversationsTable } from '@/components/conversations/ConversationsTable';
import { ConversationDetailsSheet } from '@/components/conversations/ConversationDetailsSheet';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type ConversationStatus = 'all' | 'active' | 'human_takeover' | 'closed';

interface ConversationsProps {
  onMenuClick?: () => void;
}

const Conversations: React.FC<ConversationsProps> = ({ onMenuClick }) => {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const { 
    conversations, 
    loading, 
    fetchMessages, 
    updateConversationStatus, 
    takeover, 
    returnToAI 
  } = useConversations();

  const [statusFilter, setStatusFilter] = useState<ConversationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      conv.agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.metadata as any)?.lead_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsDetailsOpen(true);
  };

  const handleTakeover = async (conversationId: string, reason?: string) => {
    try {
      await takeover(conversationId, reason);
      toast({
        title: "Conversation taken over",
        description: "You now have control of this conversation",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to take over conversation",
        variant: "destructive",
      });
    }
  };

  const handleReturnToAI = async (conversationId: string) => {
    try {
      await returnToAI(conversationId);
      toast({
        title: "Returned to AI",
        description: "The AI agent has resumed control",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to return to AI",
        variant: "destructive",
      });
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    try {
      await updateConversationStatus(conversationId, 'closed');
      setIsDetailsOpen(false);
      toast({
        title: "Conversation closed",
        description: "The conversation has been marked as closed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close conversation",
        variant: "destructive",
      });
    }
  };

  // Stats
  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    humanTakeover: conversations.filter(c => c.status === 'human_takeover').length,
    closed: conversations.filter(c => c.status === 'closed').length,
  };

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Conversations</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and monitor all conversations for {currentOrg?.name || 'your organization'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold text-success mt-1">{stats.active}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Human Control</p>
              <p className="text-2xl font-semibold text-warning mt-1">{stats.humanTakeover}</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Closed</p>
              <p className="text-2xl font-semibold text-muted-foreground mt-1">{stats.closed}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ConversationStatus)} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="human_takeover">Human</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1 sm:max-w-sm">
              <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 mt-6 pb-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading conversations...</p>
          </div>
        ) : (
          <ConversationsTable
            conversations={filteredConversations}
            onView={handleViewConversation}
          />
        )}
      </div>

      {selectedConversation && (
        <ConversationDetailsSheet
          conversation={selectedConversation}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onFetchMessages={fetchMessages}
          onTakeover={handleTakeover}
          onReturnToAI={handleReturnToAI}
          onClose={handleCloseConversation}
        />
      )}
    </main>
  );
};

export default Conversations;
