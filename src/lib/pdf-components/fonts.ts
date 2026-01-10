/**
 * PDF Font Configuration
 * 
 * Registers Inter font family with multiple weights for @react-pdf/renderer.
 * Using Google Fonts CDN for reliable font loading.
 */

import { Font } from '@react-pdf/renderer';

// Fontsource CDN URLs for Inter (static, non-variable fonts)
// Using jsdelivr CDN which is already in CSP connect-src
const INTER_FONTS = {
  regular: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2',
  medium: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff2',
  semibold: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2',
  bold: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2',
};

let fontsRegistered = false;

/**
 * Register Inter font family with multiple weights for PDF generation.
 * Safe to call multiple times - will only register once.
 */
export function registerFonts(): void {
  if (fontsRegistered) return;
  
  // Register Inter font family with multiple weights
  Font.register({
    family: 'Inter',
    fonts: [
      { src: INTER_FONTS.regular, fontWeight: 400 },
      { src: INTER_FONTS.medium, fontWeight: 500 },
      { src: INTER_FONTS.semibold, fontWeight: 600 },
      { src: INTER_FONTS.bold, fontWeight: 700 },
    ],
  });
  
  // Enable hyphenation for better text flow
  Font.registerHyphenationCallback(word => [word]);
  
  fontsRegistered = true;
}

// Register fonts immediately on import
registerFonts();
