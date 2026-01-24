/**
 * Map Utility Functions
 * 
 * Extracted utilities for map components to reduce bundle size.
 * @module lib/map-utils
 */

/**
 * Compute bounding box from array of coordinates.
 * Used for fitBounds on MapLibre maps.
 */
export function computeBounds(
  coordinates: Array<{ lng: number; lat: number }>
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;

  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
  }

  if (minLng === maxLng && minLat === maxLat) {
    return [
      [minLng - 10, minLat - 10],
      [maxLng + 10, maxLat + 10],
    ];
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Convert ISO 3166-1 alpha-2 country code to emoji flag.
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

/**
 * Calculate marker size based on visitor count and zoom level.
 */
export function getMarkerSize(count: number, maxCount: number, zoom: number = 2): number {
  const ratio = count / maxCount;
  
  // Base size from visitor count
  let baseSize = 20;
  if (ratio >= 0.6) baseSize = 32;
  else if (ratio >= 0.3) baseSize = 26;
  
  // Scale up based on zoom (zoom 1-22)
  const zoomScale = zoom < 4 ? 1 : zoom < 8 ? 1 + (zoom - 4) * 0.15 : 1.6 + (zoom - 8) * 0.1;
  
  return Math.round(baseSize * Math.min(zoomScale, 2.5));
}

/**
 * Get marker fill color based on visitor count ratio.
 */
export function getMarkerFillColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return "#ef4444";
  if (ratio >= 0.3) return "#f59e0b";
  return "#22c55e";
}
