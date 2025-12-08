import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import type { Tables } from '@/integrations/supabase/types';

type KnowledgeSource = Tables<'knowledge_sources'>;
type KnowledgeType = 'pdf' | 'url' | 'api' | 'json' | 'xml' | 'csv';

export const useKnowledgeSources = (agentId?: string) => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Error loading knowledge sources', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [agentId]);

  const markSourceAsError = async (sourceId: string, errorMessage: string) => {
    try {
      await supabase
        .from('knowledge_sources')
        .update({
          status: 'error',
          metadata: {
            error: errorMessage,
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', sourceId);
    } catch (e) {
      console.error('Failed to mark source as error:', e);
    }
  };

  const uploadDocument = async (
    file: File,
    agentId: string,
    userId: string
  ): Promise<string | null> => {
    // PDF processing is temporarily disabled
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('PDF upload not supported', {
        description: 'PDF processing is temporarily unavailable. Please add a URL or text content instead.',
      });
      return null;
    }

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

      // Trigger processing and handle invocation errors
      const { error: invokeError } = await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      });

      if (invokeError) {
        console.error('Edge function invocation failed:', invokeError);
        await markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        toast.error('Processing failed', {
          description: 'The document could not be processed. Please try again.',
        });
        await fetchSources();
        return null;
      }

      toast.success('Document uploaded', {
        description: 'Processing document...',
      });

      await fetchSources();
      return data.id;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error('Upload failed', {
        description: error.message,
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

      // Trigger processing and handle invocation errors
      const { error: invokeError } = await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      });

      if (invokeError) {
        console.error('Edge function invocation failed:', invokeError);
        await markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        toast.error('Processing failed', {
          description: 'The URL could not be processed. Please try again.',
        });
        await fetchSources();
        return null;
      }

      toast.success('URL added', {
        description: 'Processing content...',
      });

      await fetchSources();
      return data.id;
    } catch (error: any) {
      console.error('Error adding URL source:', error);
      toast.error('Failed to add URL', {
        description: error.message,
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

      // Trigger processing and handle invocation errors
      const { error: invokeError } = await supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      });

      if (invokeError) {
        console.error('Edge function invocation failed:', invokeError);
        await markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        toast.error('Processing failed', {
          description: 'The content could not be processed. Please try again.',
        });
        await fetchSources();
        return null;
      }

      toast.success('Content added', {
        description: 'Processing content...',
      });

      await fetchSources();
      return data.id;
    } catch (error: any) {
      console.error('Error adding text source:', error);
      toast.error('Failed to add content', {
        description: error.message,
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

      toast.success('Source deleted', {
        description: 'Knowledge source has been removed.',
      });

      await fetchSources();
    } catch (error: any) {
      console.error('Error deleting source:', error);
      toast.error('Delete failed', {
        description: error.message,
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

      toast.success('Reprocessing', {
        description: 'Knowledge source is being reprocessed.',
      });

      await fetchSources();
    } catch (error: any) {
      console.error('Error reprocessing source:', error);
      toast.error('Reprocess failed', {
        description: error.message,
      });
    }
  };

  const retrainAllSources = async (
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: number; failed: number }> => {
    const sourcesToRetrain = sources.filter(s => s.status !== 'processing');
    const total = sourcesToRetrain.length;
    
    if (total === 0) {
      toast.info('No sources to retrain');
      return { success: 0, failed: 0 };
    }

    let completed = 0;
    let failed = 0;

    // Update all sources to processing status
    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('agent_id', agentId)
      .in('id', sourcesToRetrain.map(s => s.id));

    if (updateError) {
      toast.error('Failed to start retraining', { description: updateError.message });
      return { success: 0, failed: total };
    }

    await fetchSources();

    // Process sources in batches of 3 to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < sourcesToRetrain.length; i += batchSize) {
      const batch = sourcesToRetrain.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (source) => {
          try {
            const { error } = await supabase.functions.invoke('process-knowledge-source', {
              body: { sourceId: source.id, agentId },
            });
            
            if (error) throw error;
            completed++;
          } catch (error) {
            console.error(`Failed to retrain source ${source.id}:`, error);
            failed++;
          }
          
          onProgress?.(completed + failed, total);
        })
      );

      // Small delay between batches
      if (i + batchSize < sourcesToRetrain.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    await fetchSources();
    return { success: completed, failed };
  };

  const isSourceOutdated = (source: KnowledgeSource): boolean => {
    const metadata = source.metadata as Record<string, any> | null;
    if (!metadata) return true;
    return metadata.embedding_model !== 'nomic-ai/nomic-embed-text-v1.5';
  };

  return {
    sources,
    loading,
    uploadDocument,
    addUrlSource,
    addTextSource,
    deleteSource,
    reprocessSource,
    retrainAllSources,
    isSourceOutdated,
    refetch: fetchSources,
  };
};
