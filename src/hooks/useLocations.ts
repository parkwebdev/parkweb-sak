/**
 * useLocations Hook
 * 
 * Hook for managing locations (communities/properties/sites) for agents.
 * Provides CRUD operations and real-time updates.
 * Uses HARD DELETES - deleted locations are permanently removed.
 * 
 * @module hooks/useLocations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
 * @returns Location management methods and state (loading only true on initial load)
 */
export const useLocations = (agentId?: string) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchLocations = useCallback(async (isRefetch = false) => {
    if (!agentId) return;

    // Only show loading state on initial load, not refetches
    if (!isRefetch && !initialLoadDone.current) {
      setLoading(true);
    }

    try {
      // Fetch ALL locations - no is_active filter (hard deletes now)
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('agent_id', agentId)
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
      initialLoadDone.current = true;
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
  const fetchLocationsRef = useRef(fetchLocations);
  fetchLocationsRef.current = fetchLocations;

  useEffect(() => {
    if (!agentId) return;

    fetchLocationsRef.current(false);

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
              // Avoid duplicates
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
            // Real-time DELETE event - remove from state
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
  }, [agentId]);

  /**
   * Create a new location
   */
  const createLocation = async (
    formData: LocationFormData,
    userId: string
  ): Promise<string | null> => {
    if (!agentId) return null;

    try {
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
   * Delete a location (HARD DELETE - permanently removes the record)
   */
  const deleteLocation = async (locationId: string): Promise<boolean> => {
    try {
      // HARD DELETE - permanently remove the location
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      // Optimistic update - remove from local state immediately
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
    refetch: () => fetchLocations(true),
  };
};
