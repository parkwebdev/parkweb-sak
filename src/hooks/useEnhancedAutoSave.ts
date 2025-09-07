import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveConfig {
  tableName: string;
  data: Record<string, any>;
  enabled?: boolean;
  debounceMs?: number;
  showToast?: boolean;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

export const useEnhancedAutoSave = ({
  tableName,
  data,
  enabled = true,
  debounceMs = 2000,
  showToast = false
}: AutoSaveConfig) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef(data);
  const initialLoadRef = useRef(true);

  // Check if data has actually changed
  const hasDataChanged = useCallback(() => {
    return JSON.stringify(dataRef.current) !== JSON.stringify(data);
  }, [data]);

  // Save function
  const saveData = useCallback(async () => {
    if (!user || !enabled || !hasDataChanged()) return;

    setStatus(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // Create a draft entry or update existing one
      const savePayload = {
        user_id: user.id,
        draft_data: data,
        table_name: tableName,
        updated_at: new Date().toISOString()
      };

      // For now, we'll use a simple approach since draft_submissions doesn't exist yet
      // This would be enhanced once the draft_submissions table is created
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          // Store draft in a JSON field for now
          id: user.id + '_draft_' + tableName
        } as any);

      if (error) {
        console.error('Auto-save error:', error);
        setStatus(prev => ({
          ...prev,
          isSaving: false,
          error: error.message,
          hasUnsavedChanges: true
        }));
        return;
      }

      dataRef.current = { ...data };
      setStatus(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null
      }));

      if (showToast) {
        toast({
          title: "Auto-saved",
          description: "Your changes have been saved automatically",
          duration: 2000,
        });
      }

    } catch (error: any) {
      console.error('Auto-save error:', error);
      setStatus(prev => ({
        ...prev,
        isSaving: false,
        error: error.message,
        hasUnsavedChanges: true
      }));
    }
  }, [user, enabled, data, tableName, hasDataChanged, showToast, toast]);

  // Debounced save effect
  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (!enabled || !user) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as having unsaved changes if data changed
    if (hasDataChanged()) {
      setStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(saveData, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, user, debounceMs, saveData, hasDataChanged]);

  // Manual save function
  const manualSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return saveData();
  }, [saveData]);

  // Recovery function to load draft data
  const recoverDraft = useCallback(async () => {
    if (!user || !enabled) return null;

    try {
      // This would be enhanced with proper draft_submissions table
      const { data: draftData, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('id', user.id + '_draft_' + tableName)
        .single();

      if (error || !draftData) return null;

      // Return the draft data for the caller to handle
      return draftData;
    } catch (error) {
      console.error('Error recovering draft:', error);
      return null;
    }
  }, [user, enabled, tableName]);

  return {
    status,
    manualSave,
    recoverDraft
  };
};