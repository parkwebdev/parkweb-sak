/**
 * Notification Sound Utilities
 * 
 * Handles audio notification playback with preloading for instant feedback.
 * Uses lazy initialization to avoid loading audio until first use.
 * 
 * @module lib/notification-sound
 */

/** Cached audio element for reuse across playback calls */
let notificationAudio: HTMLAudioElement | null = null;

/**
 * Gets or creates the notification audio element with lazy initialization.
 * Audio is preloaded once and reused for subsequent plays.
 * 
 * @returns HTMLAudioElement configured for notification playback
 * @internal
 */
const getNotificationAudio = (): HTMLAudioElement => {
  if (!notificationAudio) {
    notificationAudio = new Audio('/sounds/notification.mp3');
    notificationAudio.volume = 0.5;
  }
  return notificationAudio;
};

/**
 * Plays the notification sound for new message alerts.
 * Handles browser autoplay restrictions gracefully by silently failing.
 * Resets playback position for rapid consecutive notifications.
 * 
 * @example
 * // Play notification when new message arrives
 * if (newMessage && soundEnabled) {
 *   playNotificationSound();
 * }
 * 
 * @remarks
 * - Volume is set to 50% by default
 * - Silently fails if browser blocks autoplay
 * - Resets to start on each call for rapid notifications
 */
export const playNotificationSound = (): void => {
  try {
    const audio = getNotificationAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay may be blocked by browser, silently ignore
    });
  } catch (error: unknown) {
    // Silently fail if audio cannot be played
  }
};
