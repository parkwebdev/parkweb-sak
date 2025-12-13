/**
 * useLocations Hook
 * 
 * Hook for managing locations (communities/properties/sites) for agents.
 * Provides CRUD operations and real-time updates.
 * 
 * @module hooks/useLocations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import type { Tables } from '@/integrations/supabase/types';
import type { LocationFormData, BusinessHours } from '@/types/locations';

type Location = Tables<'locations'>;

/**
 * Hook for managing locations for an agent.
 * 
 * @param agentId - Agent ID to scope locations
 * @returns Location management methods and state
 */
export const useLocations = (agentId?: string) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      logger.error('Error fetching locations', error);
      toast.error('Error loading locations', {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!agentId) return;

    fetchLocations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`locations-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLocations((prev) => {
              if (prev.some((l) => l.id === (payload.new as Location).id)) {
                return prev;
              }
              return [...prev, payload.new as Location].sort((a, b) => 
                a.name.localeCompare(b.name)
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            setLocations((prev) =>
              prev.map((l) =>
                l.id === (payload.new as Location).id
                  ? (payload.new as Location)
                  : l
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLocations((prev) =>
              prev.filter((l) => l.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, fetchLocations]);

  /**
   * Create a new location
   */
  const createLocation = async (
    formData: LocationFormData,
    userId: string
  ): Promise<string | null> => {
    if (!agentId) return null;

    try {
      // Use RPC or direct insert with proper typing
      const insertData = {
        agent_id: agentId,
        user_id: userId,
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        country: formData.country || 'US',
        timezone: formData.timezone || 'America/New_York',
        phone: formData.phone || null,
        email: formData.email || null,
        business_hours: (formData.business_hours || {}) as unknown,
        wordpress_slug: formData.wordpress_slug || null,
      };

      const { data, error } = await supabase
        .from('locations')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;

      toast.success('Location created', {
        description: `${formData.name} has been added.`,
      });

      return data.id;
    } catch (error) {
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
      
      // Handle business_hours JSON conversion
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
    } catch (error) {
      logger.error('Error updating location', error);
      toast.error('Failed to update location', {
        description: getErrorMessage(error),
      });
      return false;
    }
  };

  /**
   * Delete a location (soft delete - sets is_active to false)
   */
  const deleteLocation = async (locationId: string): Promise<boolean> => {
    try {
      // Soft delete
      const { error } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', locationId);

      if (error) throw error;

      // Optimistic update
      setLocations((prev) => prev.filter((l) => l.id !== locationId));

      toast.success('Location deleted');
      return true;
    } catch (error) {
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
    refetch: fetchLocations,
  };
};
