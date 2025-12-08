import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import type { Tables } from '@/integrations/supabase/types';

type KnowledgeSource = Tables<'knowledge_sources'>;
type KnowledgeType = 'pdf' | 'url' | 'api' | 'json' | 'xml' | 'csv';

export const useKnowledgeSources = (agentId?: string) => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
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
  }, [agentId]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!agentId) return;

    fetchSources();

    // Subscribe to real-time updates for this agent's knowledge sources
    const channel = supabase
      .channel(`knowledge-sources-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_sources',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSources((prev) => {
              // Avoid duplicates (optimistic update may already have added it)
              if (prev.some((s) => s.id === (payload.new as KnowledgeSource).id)) {
                return prev;
              }
              return [payload.new as KnowledgeSource, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSources((prev) =>
              prev.map((s) =>
                s.id === (payload.new as KnowledgeSource).id
                  ? (payload.new as KnowledgeSource)
                  : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSources((prev) =>
              prev.filter((s) => s.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, fetchSources]);

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

      // Optimistic update - add to local state immediately
      setSources((prev) => [data, ...prev]);

      toast.success('Document uploaded', {
        description: 'Processing document...',
      });

      // Trigger processing in background (don't await)
      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          console.error('Edge function invocation failed:', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

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

      // Optimistic update - add to local state immediately
      setSources((prev) => [data, ...prev]);

      toast.success('URL added', {
        description: 'Processing content...',
      });

      // Trigger processing in background (don't await)
      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          console.error('Edge function invocation failed:', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: any) {
      console.error('Error adding URL source:', error);
      toast.error('Failed to add URL', {
        description: error.message,
      });
      return null;
    }
  };

  const addSitemapSource = async (
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
            is_sitemap: true,
            added_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update - add to local state immediately
      setSources((prev) => [data, ...prev]);

      toast.success('Sitemap added', {
        description: 'Discovering pages...',
      });

      // Trigger processing in background (don't await)
      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          console.error('Edge function invocation failed:', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: any) {
      console.error('Error adding sitemap source:', error);
      toast.error('Failed to add sitemap', {
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

      // Optimistic update - add to local state immediately
      setSources((prev) => [data, ...prev]);

      toast.success('Content added', {
        description: 'Processing content...',
      });

      // Trigger processing in background (don't await)
      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          console.error('Edge function invocation failed:', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

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
      // Optimistic update - remove from local state immediately
      setSources((prev) => prev.filter((s) => s.id !== sourceId));

      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);

      if (error) {
        // Revert optimistic update on error
        await fetchSources();
        throw error;
      }

      toast.success('Source deleted', {
        description: 'Knowledge source has been removed.',
      });
    } catch (error: any) {
      console.error('Error deleting source:', error);
      toast.error('Delete failed', {
        description: error.message,
      });
    }
  };

  const reprocessSource = async (sourceId: string) => {
    try {
      // Optimistic update - set status to processing immediately
      setSources((prev) =>
        prev.map((s) =>
          s.id === sourceId ? { ...s, status: 'processing' } : s
        )
      );

      const { error: updateError } = await supabase
        .from('knowledge_sources')
        .update({ status: 'processing' })
        .eq('id', sourceId);

      if (updateError) throw updateError;

      toast.success('Reprocessing', {
        description: 'Knowledge source is being reprocessed.',
      });

      // Trigger reprocessing in background
      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          console.error('Edge function invocation failed:', invokeError);
          markSourceAsError(sourceId, `Reprocessing failed: ${invokeError.message}`);
        }
      });
    } catch (error: any) {
      console.error('Error reprocessing source:', error);
      toast.error('Reprocess failed', {
        description: error.message,
      });
      // Revert optimistic update
      await fetchSources();
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

    // Optimistic update - set all to processing
    setSources((prev) =>
      prev.map((s) =>
        sourcesToRetrain.some((sr) => sr.id === s.id)
          ? { ...s, status: 'processing' }
          : s
      )
    );

    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('agent_id', agentId)
      .in('id', sourcesToRetrain.map(s => s.id));

    if (updateError) {
      toast.error('Failed to start retraining', { description: updateError.message });
      await fetchSources();
      return { success: 0, failed: total };
    }

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

    return { success: completed, failed };
  };

  const isSourceOutdated = (source: KnowledgeSource): boolean => {
    const metadata = source.metadata as Record<string, any> | null;
    if (!metadata) return true;
    return metadata.embedding_model !== 'nomic-ai/nomic-embed-text-v1.5';
  };

  // Get child sources for a sitemap parent
  const getChildSources = (parentId: string): KnowledgeSource[] => {
    return sources.filter(s => {
      const metadata = s.metadata as Record<string, any> | null;
      return metadata?.parent_source_id === parentId;
    });
  };

  // Get only parent sources (not child sources from sitemaps)
  const getParentSources = (): KnowledgeSource[] => {
    return sources.filter(s => {
      const metadata = s.metadata as Record<string, any> | null;
      return !metadata?.parent_source_id;
    });
  };

  return {
    sources,
    loading,
    uploadDocument,
    addUrlSource,
    addSitemapSource,
    addTextSource,
    deleteSource,
    reprocessSource,
    retrainAllSources,
    isSourceOutdated,
    getChildSources,
    getParentSources,
    refetch: fetchSources,
  };
};
