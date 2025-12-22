import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { useSupabaseQuery } from './useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables } from '@/integrations/supabase/types';
import type { KnowledgeSourceMetadata } from '@/types/metadata';

type KnowledgeSource = Tables<'knowledge_sources'>;
type KnowledgeType = 'pdf' | 'url' | 'api' | 'json' | 'xml' | 'csv';

/**
 * Hook for managing RAG knowledge sources for agents.
 * Handles URL/sitemap crawling, PDF processing, and embedding generation.
 * Supports batch processing with self-healing continuous processing architecture.
 * 
 * Now uses React Query for caching and real-time updates via useSupabaseQuery.
 * 
 * @param {string} [agentId] - Agent ID to scope knowledge sources
 * @returns {Object} Knowledge source management methods and state
 */
export const useKnowledgeSources = (agentId?: string) => {
  const queryClient = useQueryClient();

  // Fetch sources using React Query with real-time subscription
  const { data: sources = [], isLoading: loading, refetch } = useSupabaseQuery<KnowledgeSource[]>({
    queryKey: queryKeys.knowledgeSources.list(agentId || ''),
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    realtime: agentId ? {
      table: 'knowledge_sources',
      filter: `agent_id=eq.${agentId}`,
    } : undefined,
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper to optimistically update sources
  const optimisticUpdate = (updater: (prev: KnowledgeSource[]) => KnowledgeSource[]) => {
    queryClient.setQueryData<KnowledgeSource[]>(
      queryKeys.knowledgeSources.list(agentId || ''),
      (prev) => updater(prev || [])
    );
  };

  const markSourceAsError = async (sourceId: string, errorMessage: string) => {
    try {
      const { data: currentSource } = await supabase
        .from('knowledge_sources')
        .select('metadata')
        .eq('id', sourceId)
        .single();
      
      const existingMetadata = (currentSource?.metadata as Record<string, unknown>) || {};
      
      await supabase
        .from('knowledge_sources')
        .update({
          status: 'error',
          metadata: {
            ...existingMetadata,
            error: errorMessage,
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', sourceId);
    } catch (e) {
      logger.error('Failed to mark source as error', e);
    }
  };

  const uploadDocument = async (
    file: File,
    agentId: string,
    userId: string
  ): Promise<string | null> => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('PDF upload not supported', {
        description: 'PDF processing is temporarily unavailable. Please add a URL or text content instead.',
      });
      return null;
    }

    try {
      const fileName = `${agentId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('client-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-uploads')
        .getPublicUrl(fileName);

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

      optimisticUpdate((prev) => [data, ...prev]);

      toast.success('Document uploaded', {
        description: 'Processing document...',
      });

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: unknown) {
      logger.error('Error uploading document', error);
      toast.error('Upload failed', {
        description: getErrorMessage(error),
      });
      return null;
    }
  };

  const addUrlSource = async (
    url: string,
    agentId: string,
    userId: string,
    options?: { refreshStrategy?: string }
  ): Promise<string | null> => {
    try {
      const insertData: Record<string, unknown> = {
        agent_id: agentId,
        user_id: userId,
        type: 'url' as KnowledgeType,
        source: url,
        status: 'processing',
        source_type: 'url',
        refresh_strategy: options?.refreshStrategy || 'manual',
        metadata: {
          added_at: new Date().toISOString(),
        },
      };

      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;

      optimisticUpdate((prev) => [data, ...prev]);

      toast.success('URL added', {
        description: 'Processing content...',
      });

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: unknown) {
      logger.error('Error adding URL source', error);
      toast.error('Failed to add URL', {
        description: getErrorMessage(error),
      });
      return null;
    }
  };

  const addPropertyListingSource = async (
    url: string,
    agentId: string,
    userId: string,
    options?: { refreshStrategy?: string; locationId?: string }
  ): Promise<string | null> => {
    try {
      const insertData: Record<string, unknown> = {
        agent_id: agentId,
        user_id: userId,
        type: 'url' as KnowledgeType,
        source: url,
        status: 'processing',
        source_type: 'property_listings',
        refresh_strategy: options?.refreshStrategy || 'daily',
        default_location_id: options?.locationId || null,
        metadata: {
          added_at: new Date().toISOString(),
        },
      };

      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;

      optimisticUpdate((prev) => [data, ...prev]);

      toast.success('Property listing source added', {
        description: 'Extracting properties...',
      });

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: unknown) {
      logger.error('Error adding property listing source', error);
      toast.error('Failed to add property listings', {
        description: getErrorMessage(error),
      });
      return null;
    }
  };

  const addSitemapSource = async (
    url: string,
    agentId: string,
    userId: string,
    options?: {
      excludePatterns?: string[];
      includePatterns?: string[];
      pageLimit?: number;
    }
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
            exclude_patterns: options?.excludePatterns || [],
            include_patterns: options?.includePatterns || [],
            page_limit: options?.pageLimit || 200,
          },
        })
        .select()
        .single();

      if (error) throw error;

      optimisticUpdate((prev) => [data, ...prev]);

      toast.success('Sitemap added', {
        description: 'Discovering pages...',
      });

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: unknown) {
      logger.error('Error adding sitemap source', error);
      toast.error('Failed to add sitemap', {
        description: getErrorMessage(error),
      });
      return null;
    }
  };

  const addTextSource = async (
    content: string,
    agentId: string,
    userId: string,
    type: KnowledgeType = 'api',
    metadata?: Record<string, unknown>
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

      optimisticUpdate((prev) => [data, ...prev]);

      toast.success('Content added', {
        description: 'Processing content...',
      });

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId: data.id, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(data.id, `Processing failed: ${invokeError.message}`);
        }
      });

      return data.id;
    } catch (error: unknown) {
      logger.error('Error adding text source', error);
      toast.error('Failed to add content', {
        description: getErrorMessage(error),
      });
      return null;
    }
  };

  const deleteSource = async (sourceId: string) => {
    try {
      const sourceToDelete = sources.find(s => s.id === sourceId);
      const metadata = (sourceToDelete?.metadata || {}) as KnowledgeSourceMetadata;
      const isSitemap = metadata.is_sitemap === true;

      if (isSitemap) {
        logger.info(`Deleting sitemap children for source ${sourceId}`);
        const { error: childDeleteError } = await supabase
          .from('knowledge_sources')
          .delete()
          .contains('metadata', { parent_source_id: sourceId });
        
        if (childDeleteError) {
          logger.error('Failed to delete sitemap children', childDeleteError);
        }
      }

      optimisticUpdate((prev) => prev.filter((s) => {
        if (s.id === sourceId) return false;
        const meta = (s.metadata || {}) as KnowledgeSourceMetadata;
        if (meta.parent_source_id === sourceId) return false;
        return true;
      }));

      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);

      if (error) {
        await refetch();
        throw error;
      }

      toast.success('Source deleted', {
        description: 'Knowledge source has been removed.',
      });
    } catch (error: unknown) {
      logger.error('Error deleting source', error);
      toast.error('Delete failed', {
        description: getErrorMessage(error),
      });
    }
  };

  const reprocessSource = async (sourceId: string) => {
    try {
      optimisticUpdate((prev) =>
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

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(sourceId, `Reprocessing failed: ${invokeError.message}`);
        }
      });
    } catch (error: unknown) {
      logger.error('Error reprocessing source', error);
      toast.error('Reprocess failed', {
        description: getErrorMessage(error),
      });
      await refetch();
    }
  };

  const resumeProcessing = async (sourceId: string) => {
    try {
      toast.success('Resuming', {
        description: 'Resuming sitemap processing...',
      });

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId, agentId, resume: true },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          toast.error('Resume failed', {
            description: invokeError.message,
          });
        }
      });
    } catch (error: unknown) {
      logger.error('Error resuming processing', error);
      toast.error('Resume failed', {
        description: getErrorMessage(error),
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

    optimisticUpdate((prev) =>
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
      await refetch();
      return { success: 0, failed: total };
    }

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
            logger.error(`Failed to retrain source ${source.id}`, error);
            failed++;
          }
          
          onProgress?.(completed + failed, total);
        })
      );

      if (i + batchSize < sourcesToRetrain.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { success: completed, failed };
  };

  const isSourceOutdated = (source: KnowledgeSource): boolean => {
    const sourceType = (source as unknown as { source_type?: string }).source_type;
    if (sourceType === 'wordpress_home') return false;
    
    const metadata = source.metadata as Record<string, unknown> | null;
    
    if (metadata?.is_sitemap === true) return false;
    if (metadata?.wordpress_homes === true) return false;
    if (!metadata) return true;
    
    return metadata.embedding_model !== 'qwen/qwen3-embedding-8b';
  };

  const getChildSources = useCallback((parentId: string): KnowledgeSource[] => {
    return sources.filter(s => {
      const metadata = s.metadata as Record<string, unknown> | null;
      return metadata?.parent_source_id === parentId;
    });
  }, [sources]);

  const getParentSources = useCallback((): KnowledgeSource[] => {
    return sources.filter(s => {
      const metadata = s.metadata as Record<string, unknown> | null;
      return !metadata?.parent_source_id;
    });
  }, [sources]);

  const deleteChildSource = async (sourceId: string) => {
    try {
      optimisticUpdate((prev) => prev.filter((s) => s.id !== sourceId));

      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);

      if (error) {
        await refetch();
        throw error;
      }

      toast.success('Page deleted');
    } catch (error: unknown) {
      logger.error('Error deleting child source', error);
      toast.error('Delete failed', { description: getErrorMessage(error) });
    }
  };

  const retryChildSource = async (sourceId: string) => {
    try {
      optimisticUpdate((prev) =>
        prev.map((s) =>
          s.id === sourceId ? { ...s, status: 'processing' } : s
        )
      );

      const { error: updateError } = await supabase
        .from('knowledge_sources')
        .update({ status: 'processing' })
        .eq('id', sourceId);

      if (updateError) throw updateError;

      toast.success('Retrying page...');

      supabase.functions.invoke('process-knowledge-source', {
        body: { sourceId, agentId },
      }).then(({ error: invokeError }) => {
        if (invokeError) {
          logger.error('Edge function invocation failed', invokeError);
          markSourceAsError(sourceId, `Retry failed: ${invokeError.message}`);
        }
      });
    } catch (error: unknown) {
      logger.error('Error retrying child source', error);
      toast.error('Retry failed', { description: getErrorMessage(error) });
      await refetch();
    }
  };

  const triggerManualRefresh = async (sourceId: string) => {
    try {
      optimisticUpdate((prev) =>
        prev.map((s) =>
          s.id === sourceId ? { ...s, status: 'processing' } : s
        )
      );

      toast.success('Refreshing', {
        description: 'Checking for content updates...',
      });

      const { error } = await supabase.functions.invoke('refresh-knowledge-sources', {
        body: { sourceId },
      });

      if (error) {
        logger.error('Manual refresh failed', error);
        toast.error('Refresh failed', {
          description: error.message,
        });
        await refetch();
      }
    } catch (error: unknown) {
      logger.error('Error triggering manual refresh', error);
      toast.error('Refresh failed', {
        description: getErrorMessage(error),
      });
      await refetch();
    }
  };

  return {
    sources,
    loading,
    uploadDocument,
    addUrlSource,
    addSitemapSource,
    addTextSource,
    addPropertyListingSource,
    deleteSource,
    deleteChildSource,
    reprocessSource,
    resumeProcessing,
    retryChildSource,
    retrainAllSources,
    triggerManualRefresh,
    isSourceOutdated,
    getChildSources,
    getParentSources,
    refetch,
  };
};
