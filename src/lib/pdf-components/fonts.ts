/**
 * PDF Font Configuration
 * 
 * Using built-in Helvetica font family - no external fonts needed.
 */

import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

/**
 * Register font configuration for PDF generation.
 * Safe to call multiple times - will only register once.
 */
export function registerFonts(): void {
  if (fontsRegistered) return;
  
  // Only configure hyphenation - Helvetica is built-in
  Font.registerHyphenationCallback(word => [word]);
  
  fontsRegistered = true;
}

// Register fonts immediately on import
registerFonts();
