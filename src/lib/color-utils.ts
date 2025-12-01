/**
 * Convert hex color to RGB string format for BubbleBackground
 * @param hex - Hex color string (e.g., "#1e40af" or "1e40af")
 * @returns RGB string (e.g., "30,64,175") or default if invalid
 */
export function hexToRgb(hex: string, fallback: string = "0,0,0"): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return fallback;
  }
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `${r},${g},${b}`;
}

/**
 * Parse hex color to RGB object
 */
export function hexToRgbObject(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return null;
  
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/**
 * Convert RGB object to comma-separated string for BubbleBackground
 */
export function rgbObjectToString(rgb: { r: number; g: number; b: number }): string {
  return `${rgb.r},${rgb.g},${rgb.b}`;
}

/**
 * Lighten a color by a percentage (0-100)
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgbObject(hex);
  if (!rgb) return "255,255,255";
  
  const factor = percent / 100;
  return rgbObjectToString({
    r: Math.round(rgb.r + (255 - rgb.r) * factor),
    g: Math.round(rgb.g + (255 - rgb.g) * factor),
    b: Math.round(rgb.b + (255 - rgb.b) * factor),
  });
}

/**
 * Darken a color by a percentage (0-100)
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgbObject(hex);
  if (!rgb) return "0,0,0";
  
  const factor = 1 - (percent / 100);
  return rgbObjectToString({
    r: Math.round(rgb.r * factor),
    g: Math.round(rgb.g * factor),
    b: Math.round(rgb.b * factor),
  });
}

/**
 * Blend two colors together (ratio: 0 = first color, 1 = second color)
 */
export function blendColors(hex1: string, hex2: string, ratio: number): string {
  const rgb1 = hexToRgbObject(hex1);
  const rgb2 = hexToRgbObject(hex2);
  if (!rgb1 || !rgb2) return "128,128,128";
  
  return rgbObjectToString({
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio),
  });
}

/**
 * Generate a 6-color animated gradient palette from brand colors
 * Creates visually harmonious variations for the BubbleBackground
 */
export function generateGradientPalette(
  primaryColor: string, 
  secondaryColor: string
): {
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  sixth: string;
} {
  return {
    first: hexToRgb(primaryColor),           // Primary (brand dominant)
    second: hexToRgb(secondaryColor),        // Secondary (brand accent)
    third: lightenColor(primaryColor, 20),   // Lightened primary (20% lighter)
    fourth: darkenColor(secondaryColor, 15), // Darkened secondary (15% darker)
    fifth: blendColors(primaryColor, secondaryColor, 0.5),  // 50/50 blend
    sixth: lightenColor(secondaryColor, 25), // Lightened secondary (25% lighter)
  };
}
