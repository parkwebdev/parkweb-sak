/**
 * PDF Font Registration
 * 
 * Registers Inter font family for @react-pdf/renderer.
 * Uses stable jsDelivr CDN for Inter TTF files.
 */

import { Font } from '@react-pdf/renderer';
import { logger } from '@/utils/logger';

// Inter font URLs from jsDelivr (stable CDN, versioned)
const INTER_FONTS = {
  regular: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff',
  medium: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-500-normal.woff',
  semibold: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-600-normal.woff',
  bold: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff',
};

let fontsRegistered = false;

/**
 * Register Inter font family with all weights.
 * Safe to call multiple times - will only register once.
 */
export function registerFonts(): void {
  if (fontsRegistered) return;
  
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
    
    fontsRegistered = true;
  } catch (error) {
    logger.error('[PDF Fonts] Failed to register Inter fonts, falling back to Helvetica:', error);
    
    // Fallback to system font if CDN fails
    try {
      Font.register({
        family: 'Inter',
        fonts: [
          { src: 'Helvetica', fontWeight: 400 },
          { src: 'Helvetica-Bold', fontWeight: 700 },
        ],
      });
      fontsRegistered = true;
    } catch (fallbackError) {
      logger.error('[PDF Fonts] Fallback font registration also failed:', fallbackError);
    }
  }
}

// Register fonts immediately on import
registerFonts();
