/**
 * Audio Recording Utilities
 * 
 * Helper functions for audio recording features.
 * @module lib/audio-recording
 */

/**
 * Formats a duration in seconds to MM:SS format for audio playback display.
 * 
 * @param seconds - Duration in seconds (can be fractional)
 * @returns Formatted string in "M:SS" or "MM:SS" format
 * 
 * @example
 * formatDuration(65)
 * // => '1:05'
 * 
 * @example
 * formatDuration(185.7)
 * // => '3:05'
 * 
 * @example
 * formatDuration(0)
 * // => '0:00'
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
