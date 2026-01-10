/**
 * PDF Font Configuration
 * 
 * Uses Helvetica font family (built-in) for @react-pdf/renderer.
 * Built-in fonts ensure maximum compatibility without external dependencies.
 */

import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

/**
 * Register font family for PDF generation.
 * Safe to call multiple times - will only register once.
 */
export function registerFonts(): void {
  if (fontsRegistered) return;
  
  // Enable hyphenation for better text flow
  Font.registerHyphenationCallback(word => [word]);
  
  fontsRegistered = true;
}

// Register fonts immediately on import
registerFonts();
