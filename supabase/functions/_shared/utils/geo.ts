/**
 * Geo-IP Lookup Utilities
 * IP-based geolocation for visitor tracking.
 * 
 * @module _shared/utils/geo
 * @description Uses ip-api.com for free geo-IP lookups.
 * 
 * @example
 * ```typescript
 * import { getLocationFromIP, type GeoLocation } from "../_shared/utils/geo.ts";
 * 
 * const location = await getLocationFromIP("203.0.113.1");
 * console.log(location.city, location.country);
 * ```
 */

// ============================================
// TYPES
// ============================================

export interface GeoLocation {
  country: string;
  city: string;
  countryCode: string;
  region: string;
}

// ============================================
// GEO-IP LOOKUP
// ============================================

/**
 * Look up geographic location from IP address using ip-api.com (free, no API key needed)
 * 
 * @param ip - IP address to look up
 * @returns Geographic location data
 */
export async function getLocationFromIP(ip: string): Promise<GeoLocation> {
  if (!ip || ip === 'unknown') {
    return { country: 'Unknown', city: '', countryCode: '', region: '' };
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,regionName,status`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    const data = await response.json();
    if (data.status === 'success') {
      console.log(`Geo-IP lookup for ${ip}: ${data.city}, ${data.regionName}, ${data.country} (${data.countryCode})`);
      return { 
        country: data.country || 'Unknown', 
        city: data.city || '',
        countryCode: data.countryCode || '',
        region: data.regionName || '',
      };
    }
  } catch (error) {
    console.error('Geo-IP lookup failed:', error);
  }
  return { country: 'Unknown', city: '', countryCode: '', region: '' };
}
