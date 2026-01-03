/**
 * Account Settings Hook
 * 
 * Fetches and manages account-wide settings (stored in account_settings table).
 * These settings are shared across all team members and controlled by the account owner.
 * 
 * @module hooks/useAccountSettings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/utils/logger';
import type { VisibilityState } from '@tanstack/react-table';
import type { CardFieldKey } from '@/components/leads/KanbanCardFields';
import type { SortOption } from '@/components/leads/LeadsViewSettingsSheet';
import type { Json } from '@/integrations/supabase/types';

/** Shape of account settings from the database */
export interface AccountSettings {
  id: string;
  owner_id: string;
  leads_view_mode: 'kanban' | 'table';
  leads_kanban_visible_fields: CardFieldKey[];
  leads_table_column_visibility: VisibilityState;
  leads_table_column_order: string[];
  leads_default_sort: SortOption | null;
  created_at: string;
  updated_at: string;
}

/** Default settings for new accounts */
const DEFAULT_SETTINGS: Omit<AccountSettings, 'id' | 'owner_id' | 'created_at' | 'updated_at'> = {
  leads_view_mode: 'kanban',
  leads_kanban_visible_fields: ['firstName', 'lastName', 'email', 'phone', 'priority', 'tags', 'assignee', 'createdAt'],
  leads_table_column_visibility: {
    name: true,
    email: true,
    phone: true,
    stage_id: true,
    assignees: true,
    location: false,
    source: false,
    created_at: true,
    updated_at: false,
  },
  leads_table_column_order: ['name', 'email', 'phone', 'stage_id', 'assignees', 'location', 'source', 'created_at', 'updated_at'],
  leads_default_sort: null,
};

/** Updatable fields for account settings */
export type AccountSettingsUpdate = Partial<Omit<AccountSettings, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;

/** Helper to parse JSON fields safely */
function parseAccountSettings(data: {
  id: string;
  owner_id: string;
  leads_view_mode: string;
  leads_kanban_visible_fields: string[];
  leads_table_column_visibility: Json;
  leads_table_column_order: string[];
  leads_default_sort: Json | null;
  created_at: string;
  updated_at: string;
}): AccountSettings {
  return {
    id: data.id,
    owner_id: data.owner_id,
    leads_view_mode: data.leads_view_mode as 'kanban' | 'table',
    leads_kanban_visible_fields: data.leads_kanban_visible_fields as CardFieldKey[],
    leads_table_column_visibility: (data.leads_table_column_visibility ?? {}) as VisibilityState,
    leads_table_column_order: data.leads_table_column_order,
    leads_default_sort: data.leads_default_sort as unknown as SortOption | null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Hook to fetch and manage account-wide settings.
 * 
 * @returns Account settings, loading state, and update mutation
 */
export function useAccountSettings() {
  const { user } = useAuth();
  const { accountOwnerId, isTeamMember, loading: ownerLoading } = useAccountOwnerId();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.account.settings(accountOwnerId),
    queryFn: async (): Promise<AccountSettings | null> => {
      if (!accountOwnerId) return null;

      // First try to fetch existing settings
      const { data, error } = await supabase
        .from('account_settings')
        .select('*')
        .eq('owner_id', accountOwnerId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching account settings:', error);
        return null;
      }

      // If settings exist, return them
      if (data) {
        return parseAccountSettings(data);
      }

      // If no settings and user is the owner, create default settings
      if (!isTeamMember && user?.id === accountOwnerId) {
        const { data: newData, error: insertError } = await supabase
          .from('account_settings')
          .insert({ owner_id: accountOwnerId })
          .select()
          .single();

        if (insertError) {
          logger.error('Error creating account settings:', insertError);
          return null;
        }

        return parseAccountSettings(newData);
      }

      return null;
    },
    enabled: !!accountOwnerId && !ownerLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Update mutation - only works for account owners
  const updateMutation = useMutation({
    mutationFn: async (updates: AccountSettingsUpdate) => {
      if (!accountOwnerId || isTeamMember) {
        throw new Error('Only account owners can update settings');
      }

      // Convert to DB-compatible types
      const dbUpdates: Record<string, unknown> = {};
      if (updates.leads_view_mode !== undefined) dbUpdates.leads_view_mode = updates.leads_view_mode;
      if (updates.leads_kanban_visible_fields !== undefined) dbUpdates.leads_kanban_visible_fields = updates.leads_kanban_visible_fields;
      if (updates.leads_table_column_visibility !== undefined) dbUpdates.leads_table_column_visibility = updates.leads_table_column_visibility;
      if (updates.leads_table_column_order !== undefined) dbUpdates.leads_table_column_order = updates.leads_table_column_order;
      if (updates.leads_default_sort !== undefined) dbUpdates.leads_default_sort = updates.leads_default_sort;

      const { data, error } = await supabase
        .from('account_settings')
        .update(dbUpdates)
        .eq('owner_id', accountOwnerId)
        .select()
        .single();

      if (error) throw error;
      return parseAccountSettings(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.account.settings(accountOwnerId), data);
    },
    onError: (error) => {
      logger.error('Error updating account settings:', error);
    },
  });

  // Computed values with fallbacks to defaults
  const viewMode = settings?.leads_view_mode ?? DEFAULT_SETTINGS.leads_view_mode;
  const kanbanVisibleFields = new Set(settings?.leads_kanban_visible_fields ?? DEFAULT_SETTINGS.leads_kanban_visible_fields);
  const tableColumnVisibility = settings?.leads_table_column_visibility ?? DEFAULT_SETTINGS.leads_table_column_visibility;
  const tableColumnOrder = settings?.leads_table_column_order ?? DEFAULT_SETTINGS.leads_table_column_order;
  const defaultSort = settings?.leads_default_sort ?? DEFAULT_SETTINGS.leads_default_sort;

  // Helper to check if user can manage settings
  const canManageSettings = !!user?.id && !isTeamMember && user.id === accountOwnerId;

  return {
    // Settings values (with defaults)
    viewMode,
    kanbanVisibleFields,
    tableColumnVisibility,
    tableColumnOrder,
    defaultSort,
    
    // Raw settings object
    settings,
    
    // Loading state
    loading: ownerLoading || settingsLoading,
    
    // Permission
    canManageSettings,
    
    // Update function
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
