import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Tables } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;
type Location = Tables<'locations'>;

export interface PropertyWithLocation extends Property {
  location_name: string | null;
}

export interface ValidationStats {
  missingLotNumber: number;
  unmatchedLocation: number;
  total: number;
}

/**
 * Hook for fetching properties with location data and validation stats.
 * 
 * @param {string} [agentId] - Agent ID to scope properties
 * @returns {Object} Property data, validation stats, and methods
 */
export const useProperties = (agentId?: string) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [locationsList, setLocationsList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({});

  const fetchProperties = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      
      // Fetch properties and locations in parallel
      const [propertiesResult, locationsResult] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false }),
        supabase
          .from('locations')
          .select('id, name')
          .eq('agent_id', agentId)
      ]);

      if (propertiesResult.error) throw propertiesResult.error;
      if (locationsResult.error) throw locationsResult.error;
      
      setProperties(propertiesResult.data || []);
      setLocationsList(locationsResult.data || []);
      
      // Calculate counts per knowledge source
      const counts: Record<string, number> = {};
      for (const prop of propertiesResult.data || []) {
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

  // Create a location lookup map
  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of locationsList) {
      map.set(loc.id, loc.name);
    }
    return map;
  }, [locationsList]);

  // Enrich properties with location names
  const propertiesWithLocation: PropertyWithLocation[] = useMemo(() => {
    return properties.map(prop => ({
      ...prop,
      location_name: prop.location_id ? locationMap.get(prop.location_id) || null : null,
    }));
  }, [properties, locationMap]);

  // Calculate validation stats
  const validationStats: ValidationStats = useMemo(() => {
    let missingLotNumber = 0;
    let unmatchedLocation = 0;

    for (const prop of properties) {
      if (!prop.lot_number) missingLotNumber++;
      if (!prop.location_id) unmatchedLocation++;
    }

    return {
      missingLotNumber,
      unmatchedLocation,
      total: properties.length,
    };
  }, [properties]);

  const getPropertyCount = useCallback((sourceId: string): number => {
    return propertyCounts[sourceId] || 0;
  }, [propertyCounts]);

  // Get unique locations for filtering
  const uniqueLocations = useMemo(() => {
    return locationsList.map(loc => ({ id: loc.id, name: loc.name }));
  }, [locationsList]);

  return {
    properties,
    propertiesWithLocation,
    loading,
    propertyCounts,
    validationStats,
    uniqueLocations,
    getPropertyCount,
    refetch: fetchProperties,
  };
};
