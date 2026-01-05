/**
 * PDF Font Registration for Edge Functions
 * 
 * Uses built-in PDF fonts for maximum compatibility.
 */

// @ts-ignore - npm import for Deno
import { Font } from 'npm:@react-pdf/renderer@4.3.0';

let fontsRegistered = false;

/**
 * Register font settings for PDF generation.
 * Safe to call multiple times - will only register once.
 */
export function registerFonts(): void {
  if (fontsRegistered) return;
  
  // Enable hyphenation for better text flow
  Font.registerHyphenationCallback((word: string) => [word]);
  
  fontsRegistered = true;
  console.log('[PDF Fonts] Font settings initialized');
}
