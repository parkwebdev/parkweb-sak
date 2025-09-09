import { useEffect, useRef, useState } from 'react';

interface FieldAutoSaveOptions<T> {
  initialValue: T;
  onSave: (value: T) => Promise<void>;
  delay?: number;
}

interface FieldAutoSaveReturn<T> {
  updateField: (value: T) => void;
  isSaving: boolean;
  error: string | null;
}

export const useFieldAutoSave = <T>({
  initialValue,
  onSave,
  delay = 1000,
}: FieldAutoSaveOptions<T>): FieldAutoSaveReturn<T> => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedValueRef = useRef<T>(initialValue);
  const pendingValueRef = useRef<T>(initialValue);

  const updateField = (value: T) => {
    pendingValueRef.current = value;
    setError(null);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if value hasn't changed from last saved
    if (JSON.stringify(value) === JSON.stringify(lastSavedValueRef.current)) {
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(pendingValueRef.current);
        lastSavedValueRef.current = pendingValueRef.current;
        setError(null);
      } catch (err) {
        console.error('Field auto-save error:', err);
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setIsSaving(false);
      }
    }, delay);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update initial values when they change
  useEffect(() => {
    lastSavedValueRef.current = initialValue;
    pendingValueRef.current = initialValue;
  }, [initialValue]);

  return {
    updateField,
    isSaving,
    error,
  };
};