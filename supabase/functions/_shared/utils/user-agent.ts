/**
 * User Agent Parsing Utilities
 * Parse browser/device information from user agent strings.
 * 
 * @module _shared/utils/user-agent
 * @description Extracts device type, browser, and OS from user agent strings.
 * 
 * @example
 * ```typescript
 * import { parseUserAgent, isWidgetRequest, type DeviceInfo } from "../_shared/utils/user-agent.ts";
 * 
 * const deviceInfo = parseUserAgent(req.headers.get('user-agent'));
 * console.log(deviceInfo.device, deviceInfo.browser, deviceInfo.os);
 * 
 * if (isWidgetRequest(req)) {
 *   // Handle widget-specific logic
 * }
 * ```
 */

// ============================================
// TYPES
// ============================================

export interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
}

// ============================================
// USER AGENT PARSING
// ============================================

/**
 * Parse user agent string for device info
 * 
 * @param userAgent - User agent string from request headers
 * @returns Parsed device information
 */
export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  
  let device = 'desktop';
  if (/mobile/i.test(userAgent)) device = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';
  
  let browser = 'unknown';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
  
  return { device, browser, os };
}

/**
 * Check if request is from widget (has valid widget origin)
 * 
 * @param req - Incoming request
 * @returns True if request appears to be from widget
 */
export function isWidgetRequest(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  return !!(origin || referer);
}
