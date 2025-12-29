/**
 * PDF Font Loader
 * 
 * Fetches and embeds Inter font for jsPDF.
 * Uses woff2 format converted to base64.
 */

import type jsPDF from 'jspdf';

// Inter font URLs from Google Fonts CDN (Latin subset, woff2)
const INTER_URLS = {
  regular: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
  medium: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2',
  semibold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2',
  bold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2',
} as const;

// Cache for loaded font data
let fontCache: Map<string, string> | null = null;

/**
 * Fetches a font file and converts to base64.
 */
async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${url}`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Pre-loads all Inter font weights into cache.
 * Call this early to avoid delay during PDF generation.
 */
export async function preloadInterFonts(): Promise<void> {
  if (fontCache) return;
  
  fontCache = new Map();
  
  const entries = Object.entries(INTER_URLS);
  const results = await Promise.all(
    entries.map(async ([weight, url]) => {
      try {
        const base64 = await fetchFontAsBase64(url);
        return [weight, base64] as const;
      } catch (err) {
        console.warn(`Failed to load Inter ${weight}:`, err);
        return null;
      }
    })
  );
  
  for (const result of results) {
    if (result) {
      fontCache.set(result[0], result[1]);
    }
  }
}

/**
 * Registers Inter font with jsPDF instance.
 * Must be called before using Inter in the PDF.
 */
export async function registerInterFont(pdf: jsPDF): Promise<boolean> {
  // Ensure fonts are loaded
  if (!fontCache) {
    await preloadInterFonts();
  }
  
  if (!fontCache || fontCache.size === 0) {
    console.warn('Inter fonts not available, falling back to Helvetica');
    return false;
  }
  
  // Register each weight
  const weights = [
    { key: 'regular', style: 'normal' },
    { key: 'medium', style: 'normal' },
    { key: 'semibold', style: 'normal' },
    { key: 'bold', style: 'bold' },
  ];
  
  for (const { key, style } of weights) {
    const base64 = fontCache.get(key);
    if (base64) {
      const fileName = `Inter-${key}.woff2`;
      pdf.addFileToVFS(fileName, base64);
      pdf.addFont(fileName, 'Inter', style, key === 'bold' ? 700 : key === 'semibold' ? 600 : key === 'medium' ? 500 : 400);
    }
  }
  
  return true;
}

/**
 * Gets the font name to use (Inter if available, otherwise Helvetica).
 */
export function getFontFamily(): string {
  return fontCache && fontCache.size > 0 ? 'Inter' : 'helvetica';
}
