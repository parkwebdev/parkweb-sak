import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Tables } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;

/**
 * Hook for fetching properties and property counts by knowledge source.
 * 
 * @param {string} [agentId] - Agent ID to scope properties
 * @returns {Object} Property data and methods
 */
export const useProperties = (agentId?: string) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({});

  const fetchProperties = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProperties(data || []);
      
      // Calculate counts per knowledge source
      const counts: Record<string, number> = {};
      for (const prop of data || []) {
        const sourceId = prop.knowledge_source_id;
        counts[sourceId] = (counts[sourceId] || 0) + 1;
      }
      setPropertyCounts(counts);
    } catch (error) {
      logger.error('Error fetching properties', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    fetchProperties();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`properties-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          // Refetch on any change to update counts
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, fetchProperties]);

  const getPropertyCount = useCallback((sourceId: string): number => {
    return propertyCounts[sourceId] || 0;
  }, [propertyCounts]);

  return {
    properties,
    loading,
    propertyCounts,
    getPropertyCount,
    refetch: fetchProperties,
  };
};
