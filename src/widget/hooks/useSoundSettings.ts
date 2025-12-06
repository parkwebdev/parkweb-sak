/**
 * useSoundSettings Hook
 * 
 * Manages sound notification preferences with localStorage persistence.
 */

import { useState, useCallback } from 'react';

export function useSoundSettings(agentId: string) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(`chatpad_sound_enabled_${agentId}`);
    return stored !== 'false'; // Default to true
  });

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(`chatpad_sound_enabled_${agentId}`, String(enabled));
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
