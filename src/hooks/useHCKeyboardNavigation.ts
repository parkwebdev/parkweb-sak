import { useEffect, useCallback } from 'react';

interface UseHCKeyboardNavigationOptions {
  onPrevious?: () => void;
  onNext?: () => void;
  enabled?: boolean;
}

/**
 * Hook for Help Center keyboard navigation.
 * Supports arrow keys and vim-style j/k bindings for article navigation.
 * 
 * @param onPrevious - Callback for previous article navigation
 * @param onNext - Callback for next article navigation  
 * @param enabled - Whether shortcuts are active (default: true)
 */
export function useHCKeyboardNavigation({
  onPrevious,
  onNext,
  enabled = true,
}: UseHCKeyboardNavigationOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if disabled
    if (!enabled) return;
    
    // Skip if user is in input field
    const activeElement = document.activeElement;
    const isInputField = 
      activeElement?.tagName === 'INPUT' || 
      activeElement?.tagName === 'TEXTAREA' || 
      activeElement?.getAttribute('contenteditable') === 'true';
    
    if (isInputField) return;
    
    // Skip if modifier keys are pressed (let other shortcuts work)
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    
    // Navigation shortcuts
    switch (event.key) {
      case 'ArrowLeft':
      case 'k': // Vim-style previous
        if (onPrevious) {
          event.preventDefault();
          onPrevious();
        }
        break;
        
      case 'ArrowRight':
      case 'j': // Vim-style next
        if (onNext) {
          event.preventDefault();
          onNext();
        }
        break;
    }
  }, [onPrevious, onNext, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
