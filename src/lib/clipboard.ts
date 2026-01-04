/**
 * Clipboard Utilities
 * 
 * Provides consistent clipboard operations with optional toast feedback.
 * 
 * @module lib/clipboard
 */

import { toast } from '@/lib/toast';

/**
 * Copy text to clipboard with optional toast feedback.
 * 
 * @param text - Content to copy to clipboard
 * @param label - Optional label for toast message (e.g., "Email" → "Email copied")
 * @returns Promise resolving to true if successful, false otherwise
 * 
 * @example
 * // With label
 * await copyToClipboard(user.email, 'Email');
 * // Shows: "Email copied"
 * 
 * // Without label
 * await copyToClipboard(embedCode);
 * // Shows: "Copied to clipboard"
 * 
 * // Silent mode (no toast)
 * const success = await copyToClipboard(text, null);
 */
export async function copyToClipboard(
  text: string,
  label?: string | null
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    
    if (label !== null) {
      const message = label ? `${label} copied` : 'Copied to clipboard';
      toast.success(message);
    }
    
    return true;
  } catch {
    if (label !== null) {
      toast.error('Failed to copy');
    }
    return false;
  }
}
