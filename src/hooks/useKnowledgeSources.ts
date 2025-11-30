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
    if (!agentId) return;

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
      console.error('Error fetching knowledge sources:', error);
      toast({
        title: 'Error loading knowledge sources',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [agentId]);

  const uploadDocument = async (
    file: File,
    agentId: string,
    userId: string
  ): Promise<string | null> => {
    try {
      // Upload file to Supabase Storage
      const fileName = `${agentId}/${Date.now()}-${file.name}`;
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
          user_id: userId,
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
        body: { sourceId: data.id, agentId },
      });

      toast({
        title: 'Document uploaded',
        description: 'Processing document...',
      });

      await fetchSources();
      return data.id;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addUrlSource = async (
    url: string,
    agentId: string,
    userId: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          agent_id: agentId,
          user_id: userId,
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
        body: { sourceId: data.id, agentId },
      });

      toast({
        title: 'URL added',
        description: 'Processing content...',
      });

      await fetchSources();
      return data.id;
    } catch (error: any) {
      console.error('Error adding URL source:', error);
      toast({
        title: 'Failed to add URL',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addTextSource = async (
    content: string,
    agentId: string,
    userId: string,
    type: KnowledgeType = 'api',
    metadata?: Record<string, any>
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          agent_id: agentId,
          user_id: userId,
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
        body: { sourceId: data.id, agentId },
      });

      toast({
        title: 'Content added',
        description: 'Processing content...',
      });

      await fetchSources();
      return data.id;
    } catch (error: any) {
      console.error('Error adding text source:', error);
      toast({
        title: 'Failed to add content',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSource = async (sourceId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;

      toast({
        title: 'Source deleted',
        description: 'Knowledge source has been removed.',
      });

      await fetchSources();
    } catch (error: any) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const reprocessSource = async (sourceId: string) => {
    try {
      // Update status to processing
      const { error: updateError } = await supabase
        .from('knowledge_sources')
        .update({ status: 'processing' })
        .eq('id', sourceId);

      if (updateError) throw updateError;

      // Trigger reprocessing
      const { error: invokeError } = await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId, agentId },
      });

      if (invokeError) throw invokeError;

      toast({
        title: 'Reprocessing',
        description: 'Knowledge source is being reprocessed.',
      });

      await fetchSources();
    } catch (error: any) {
      console.error('Error reprocessing source:', error);
      toast({
        title: 'Reprocess failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
