/**
 * useKeyboardHeight Hook
 * 
 * Detects mobile keyboard appearance using the Visual Viewport API
 * and returns the keyboard height for layout adjustments.
 * 
 * @module widget/hooks/useKeyboardHeight
 */
import { useState, useEffect } from 'react';

interface KeyboardState {
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

export const useKeyboardHeight = (): KeyboardState => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    keyboardHeight: 0,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // Store initial viewport height
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      // Calculate keyboard height by comparing window height to visual viewport
      const currentHeight = visualViewport.height;
      const keyboardHeight = Math.max(0, initialHeight - currentHeight);
      
      // Consider keyboard "open" if height difference is significant (> 100px)
      const isKeyboardOpen = keyboardHeight > 100;

      setKeyboardState({
        keyboardHeight: isKeyboardOpen ? keyboardHeight : 0,
        isKeyboardOpen,
      });
    };

    // Also handle scroll to keep input visible
    const handleScroll = () => {
      // On iOS, sometimes the viewport scrolls instead of resizing
      // Reset scroll position to keep widget in place
      if (keyboardState.isKeyboardOpen) {
        window.scrollTo(0, 0);
      }
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleScroll);

    // Initial check
    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleScroll);
    };
  }, [keyboardState.isKeyboardOpen]);

  return keyboardState;
};

