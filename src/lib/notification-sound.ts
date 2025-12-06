// Preload the audio for faster playback
let notificationAudio: HTMLAudioElement | null = null;

const getNotificationAudio = (): HTMLAudioElement => {
  if (!notificationAudio) {
    notificationAudio = new Audio('/sounds/notification.mp3');
    notificationAudio.volume = 0.5;
  }
  return notificationAudio;
};

export const playNotificationSound = (): void => {
  try {
    const audio = getNotificationAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay may be blocked by browser, silently ignore
    });
  } catch (error) {
    // Silently fail if audio cannot be played
  }
};
