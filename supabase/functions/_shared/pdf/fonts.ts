/**
 * PDF Font Configuration for Edge Functions
 * 
 * Using built-in Helvetica font family - no external fonts needed.
 */

// @ts-ignore - npm import for Deno
import { Font } from 'npm:@react-pdf/renderer@4.3.0';

let fontsRegistered = false;

/**
 * Register font configuration for PDF generation.
 * Safe to call multiple times - will only register once.
 */
export function registerFonts(): void {
  if (fontsRegistered) return;
  
  // Only configure hyphenation - Helvetica is built-in
  Font.registerHyphenationCallback((word: string) => [word]);
  
  fontsRegistered = true;
  console.log('[PDF Fonts] Using built-in Helvetica font family');
}

// Register fonts immediately on import
registerFonts();
