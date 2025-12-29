/**
 * PDF Font Registration
 * 
 * Registers Inter font family for @react-pdf/renderer.
 * Uses TTF format from Google Fonts for maximum compatibility.
 */

import { Font } from '@react-pdf/renderer';

// Inter font URLs (TTF format from Google Fonts API)
const INTER_FONTS = {
  regular: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTcvvYwYZ8UA3.ttf',
  medium: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTcvsYQYZ8UA3.ttf',
  semibold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTcvnYwYZ8UA3.ttf',
  bold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTcvuYgYZ8UA3.ttf',
};

/**
 * Register Inter font family with all weights.
 * Call this once at app initialization.
 */
export function registerFonts(): void {
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
}

// Register fonts immediately on import
registerFonts();
