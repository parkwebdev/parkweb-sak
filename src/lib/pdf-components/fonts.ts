/**
 * PDF Font Registration
 * 
 * Registers Inter font family for @react-pdf/renderer.
 * Uses TTF format from Google Fonts for maximum compatibility.
 */

import { Font } from '@react-pdf/renderer';

// Inter font URLs (TTF format from jsDelivr CDN - more reliable than Google Fonts direct)
const INTER_FONTS = {
  regular: 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/ttf/Inter-Regular.ttf',
  medium: 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/ttf/Inter-Medium.ttf',
  semibold: 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/ttf/Inter-SemiBold.ttf',
  bold: 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/ttf/Inter-Bold.ttf',
};

/**
 * Register Inter font family with all weights.
 * Call this once at app initialization.
 */
export function registerFonts(): void {
  try {
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
  } catch (error) {
    console.error('Failed to register PDF fonts:', error);
  }
}

// Register fonts immediately on import
registerFonts();
