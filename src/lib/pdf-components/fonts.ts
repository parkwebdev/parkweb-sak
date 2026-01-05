/**
 * PDF Font Registration
 * 
 * Registers Helvetica font family for @react-pdf/renderer.
 * Uses built-in PDF fonts for maximum compatibility.
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
