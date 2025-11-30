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
