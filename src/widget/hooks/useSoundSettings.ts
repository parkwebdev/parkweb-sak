/**
 * useSoundSettings Hook
 * 
 * Manages sound notification preferences with localStorage persistence.
 * Provides toggle functionality and sound playback for notifications.
 * 
 * @module widget/hooks/useSoundSettings
 * 
 * @example
 * ```tsx
 * const { soundEnabled, setSoundEnabled, playNotificationSound } = useSoundSettings('agent-123');
 * 
 * // Toggle sound
 * setSoundEnabled(!soundEnabled);
 * 
 * // Play notification
 * playNotificationSound();
 * ```
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing sound notification settings.
 * 
 * @param agentId - Agent ID for localStorage key namespacing
 * @returns Sound state, setter, and play function
 */
export function useSoundSettings(agentId: string) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(`pilot_sound_enabled_${agentId}`);
    return stored !== 'false'; // Default to true
  });

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(`pilot_sound_enabled_${agentId}`, String(enabled));
  }, [agentId]);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    setSoundEnabled,
    playNotificationSound,
  };
}
