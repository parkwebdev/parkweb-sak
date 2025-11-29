import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type KnowledgeSource = Tables<'knowledge_sources'>;
type KnowledgeType = 'pdf' | 'url' | 'api' | 'json' | 'xml' | 'csv';

export const useKnowledgeSources = (agentId?: string) => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSources = async () => {
    if (!agentId) {
      setSources([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching knowledge sources',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    agentId: string,
    orgId: string
  ): Promise<string | null> => {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-uploads')
        .getPublicUrl(fileName);

      // Create knowledge source record
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          agent_id: agentId,
          org_id: orgId,
          type: 'pdf' as KnowledgeType,
          source: publicUrl,
          status: 'processing',
          metadata: {
            filename: file.name,
            size: file.size,
            uploaded_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger processing
      await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id },
      });

      toast({
        title: 'Document uploaded',
        description: 'Processing and generating embeddings...',
      });

      fetchSources();
      return data.id;
    } catch (error: any) {
      toast({
        title: 'Error uploading document',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addUrlSource = async (
    url: string,
    agentId: string,
    orgId: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          agent_id: agentId,
          org_id: orgId,
          type: 'url' as KnowledgeType,
          source: url,
          status: 'processing',
          metadata: {
            added_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger processing
      await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id },
      });

      toast({
        title: 'URL added',
        description: 'Fetching content and generating embeddings...',
      });

      fetchSources();
      return data.id;
    } catch (error: any) {
      toast({
        title: 'Error adding URL',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addTextSource = async (
    content: string,
    type: KnowledgeType,
    agentId: string,
    orgId: string,
    metadata?: Record<string, any>
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          agent_id: agentId,
          org_id: orgId,
          type,
          source: 'text',
          content,
          status: 'processing',
          metadata: {
            ...metadata,
            added_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger processing
      await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id },
      });

      toast({
        title: 'Content added',
        description: 'Generating embeddings...',
      });

      fetchSources();
      return data.id;
    } catch (error: any) {
      toast({
        title: 'Error adding content',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Knowledge source deleted',
        description: 'Source has been removed from the knowledge base',
      });

      fetchSources();
    } catch (error: any) {
      toast({
        title: 'Error deleting source',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const reprocessSource = async (id: string) => {
    try {
      await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: id },
      });

      toast({
        title: 'Reprocessing started',
        description: 'Generating new embeddings...',
      });

      fetchSources();
    } catch (error: any) {
      toast({
        title: 'Error reprocessing source',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSources();

    if (!agentId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel('knowledge-sources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_sources',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          fetchSources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return {
    sources,
    loading,
    uploadDocument,
    addUrlSource,
    addTextSource,
    deleteSource,
    reprocessSource,
    refetch: fetchSources,
  };
};
