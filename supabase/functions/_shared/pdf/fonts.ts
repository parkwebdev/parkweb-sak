/**
 * PDF Font Configuration for Edge Functions
 * 
 * Registers Inter font family with multiple weights for @react-pdf/renderer.
 * Using Google Fonts CDN for reliable font loading.
 */

// @ts-ignore - npm import for Deno
import { Font } from 'npm:@react-pdf/renderer@4.3.0';

// Google Fonts CDN URLs for Inter
const INTER_FONTS = {
  regular: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
  medium: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2',
  semibold: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2',
  bold: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2',
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
  Font.registerHyphenationCallback((word: string) => [word]);
  
  fontsRegistered = true;
  console.log('[PDF Fonts] Inter font family registered with 4 weights');
}

// Register fonts immediately on import
registerFonts();
