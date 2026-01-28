/**
 * useLocations Hook
 * 
 * Hook for managing locations (communities/properties/sites) for agents.
 * Provides CRUD operations and real-time updates.
 * Uses HARD DELETES - deleted locations are permanently removed.
 * 
 * Now uses React Query for caching and real-time updates via useSupabaseQuery.
 * 
 * @module hooks/useLocations
 */

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useAccountOwnerId } from './useAccountOwnerId';
import { queryKeys } from '@/lib/query-keys';
import type { Tables, TablesInsert, Json } from '@/integrations/supabase/types';
import type { LocationFormData, BusinessHours } from '@/types/locations';

type Location = Tables<'locations'>;

/**
 * Hook for managing locations for an agent.
 * 
 * @param agentId - Agent ID to scope locations
 * @returns Location management methods and state
 */
export const useLocations = (agentId?: string) => {
  const { accountOwnerId } = useAccountOwnerId();
  const queryClient = useQueryClient();

  // Fetch locations using React Query with real-time subscription
  const { data: locations = [], isLoading: loading, refetch } = useSupabaseQuery<Location[]>({
    queryKey: queryKeys.locations.list(agentId || ''),
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('agent_id', agentId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    realtime: agentId ? {
      table: 'locations',
      filter: `agent_id=eq.${agentId}`,
    } : undefined,
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper to optimistically update locations
  const optimisticUpdate = (updater: (prev: Location[]) => Location[]) => {
    queryClient.setQueryData<Location[]>(
      queryKeys.locations.list(agentId || ''),
      (prev) => updater(prev || [])
    );
  };

  /**
   * Create a new location
   */
  const createLocation = async (
    formData: LocationFormData
  ): Promise<string | null> => {
    if (!agentId || !accountOwnerId) return null;

    try {
      const insertData: TablesInsert<'locations'> = {
        agent_id: agentId,
        user_id: accountOwnerId,
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        country: formData.country || 'US',
        timezone: formData.timezone || 'America/New_York',
        phone: formData.phone || null,
        email: formData.email || null,
        business_hours: (formData.business_hours || {}) as Json,
        wordpress_slug: formData.wordpress_slug || null,
      };

      const { data, error } = await supabase
        .from('locations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Location created', {
        description: `${formData.name} has been added.`,
      });

      return data.id;
    } catch (error: unknown) {
      logger.error('Error creating location', error);
      toast.error('Failed to create location', {
        description: getErrorMessage(error),
      });
      return null;
    }
  };

  /**
   * Update an existing location
   */
  const updateLocation = async (
    locationId: string,
    formData: Partial<LocationFormData>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = { ...formData };
      
      if (formData.business_hours) {
        updateData.business_hours = formData.business_hours as unknown as Record<string, unknown>;
      }

      const { error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', locationId);

      if (error) throw error;

      toast.success('Location updated');
      return true;
    } catch (error: unknown) {
      logger.error('Error updating location', error);
      toast.error('Failed to update location', {
        description: getErrorMessage(error),
      });
      return false;
    }
  };

  /**
   * Delete a location (HARD DELETE - permanently removes the record)
   */
  const deleteLocation = async (locationId: string): Promise<boolean> => {
    try {
      // Optimistic update - remove from local state immediately
      optimisticUpdate((prev) => prev.filter((l) => l.id !== locationId));

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        await refetch();
        throw error;
      }

      toast.success('Location deleted');
      return true;
    } catch (error: unknown) {
      logger.error('Error deleting location', error);
      toast.error('Failed to delete location', {
        description: getErrorMessage(error),
      });
      return false;
    }
  };

  /**
   * Get business hours for a location
   */
  const getBusinessHours = (location: Location): BusinessHours => {
    return (location.business_hours as BusinessHours) || {};
  };

  return {
    locations,
    loading,
    createLocation,
    updateLocation,
    deleteLocation,
    getBusinessHours,
    refetch,
  };
};
