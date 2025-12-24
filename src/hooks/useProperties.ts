import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;

export interface PropertyWithLocation extends Property {
  location_name: string | null;
}

export interface LocationOption {
  id: string;
  name: string;
  display_name: string;
}

export interface ValidationStats {
  missingLotNumber: number;
  unmatchedLocation: number;
  total: number;
}

interface LocationData {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

interface PropertiesData {
  properties: Property[];
  locations: LocationData[];
}

/**
 * Hook for fetching properties with location data and validation stats.
 * Uses React Query for caching and real-time updates.
 * 
 * @param {string} [agentId] - Agent ID to scope properties
 * @returns {Object} Property data, validation stats, and methods
 */
export const useProperties = (agentId?: string) => {
  const queryClient = useQueryClient();

  // Fetch properties and locations together
  const { data, isLoading: loading, refetch } = useSupabaseQuery<PropertiesData>({
    queryKey: queryKeys.properties.list(agentId || ''),
    queryFn: async () => {
      if (!agentId) return { properties: [], locations: [] };
      
      // Fetch properties and locations in parallel
      const [propertiesResult, locationsResult] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false }),
        supabase
          .from('locations')
          .select('id, name, city, state')
          .eq('agent_id', agentId)
      ]);

      if (propertiesResult.error) throw propertiesResult.error;
      if (locationsResult.error) throw locationsResult.error;
      
      return {
        properties: propertiesResult.data || [],
        locations: locationsResult.data || [],
      };
    },
    realtime: {
      table: 'properties',
      filter: agentId ? `agent_id=eq.${agentId}` : undefined,
    },
    enabled: !!agentId,
    staleTime: 60000, // 1 minute
  });

  const properties = data?.properties || [];
  const locationsList = data?.locations || [];

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

  // Calculate counts per knowledge source
  const propertyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prop of properties) {
      const sourceId = prop.knowledge_source_id;
      counts[sourceId] = (counts[sourceId] || 0) + 1;
    }
    return counts;
  }, [properties]);

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

  // Map location names to ALL their location IDs (for multi-location filtering)
  const locationIdsByName = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const loc of locationsList) {
      const ids = map.get(loc.name) || [];
      ids.push(loc.id);
      map.set(loc.name, ids);
    }
    return map;
  }, [locationsList]);

  // Get unique locations for filtering (deduplicated by name, using name as filter key)
  const uniqueLocations: LocationOption[] = useMemo(() => {
    const seenNames = new Map<string, LocationOption>();
    
    for (const loc of locationsList) {
      // Only keep the first occurrence of each name
      if (!seenNames.has(loc.name)) {
        seenNames.set(loc.name, {
          id: loc.name,  // Use NAME as the filter key
          name: loc.name,
          display_name: loc.name,
        });
      }
    }
    
    return Array.from(seenNames.values());
  }, [locationsList]);

  return {
    properties,
    propertiesWithLocation,
    loading,
    propertyCounts,
    validationStats,
    uniqueLocations,
    locationIdsByName,
    getPropertyCount,
    refetch,
  };
};
