import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type TableName = 'user_preferences' | 'profiles' | 'notification_preferences';

interface AutoSaveOptions {
  table: TableName;
  data: Record<string, any>;
  enabled: boolean;
  delay?: number; // milliseconds
  onSave?: () => void;
  onError?: (error: any) => void;
}

export const useAutoSave = ({
  table,
  data,
  enabled,
  delay = 30000, // 30 seconds default
  onSave,
  onError,
}: AutoSaveOptions) => {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !user) return;

    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from(table)
          .upsert({
            user_id: user.id,
            ...data,
          } as any);

        if (error) {
          console.error('Auto-save error:', error);
          onError?.(error);
        } else {
          lastSavedRef.current = currentData;
          onSave?.();
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        onError?.(error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, user, table, delay, onSave, onError]);

  return {
    isSaving: timeoutRef.current !== undefined,
  };
};