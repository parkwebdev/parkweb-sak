/**
 * Client-side browser and OS detection utilities.
 * Used for notification compatibility messaging and feature detection.
 * 
 * @module lib/browser-detection
 */

export interface BrowserInfo {
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';
  os: 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown';
  isMobile: boolean;
}

/**
 * Detect browser and OS from user agent.
 * Returns structured info for feature detection and messaging.
 */
export function getBrowserInfo(): BrowserInfo {
  if (typeof navigator === 'undefined') {
    return { browser: 'unknown', os: 'unknown', isMobile: false };
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // Detect browser (order matters - more specific first)
  let browser: BrowserInfo['browser'] = 'unknown';
  if (ua.includes('edg/')) {
    browser = 'edge';
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'safari';
  } else if (ua.includes('firefox')) {
    browser = 'firefox';
  }

  // Detect OS (order matters - mobile before desktop)
  let os: BrowserInfo['os'] = 'unknown';
  if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'ios';
  } else if (ua.includes('android')) {
    os = 'android';
  } else if (ua.includes('mac')) {
    os = 'macos';
  } else if (ua.includes('win')) {
    os = 'windows';
  } else if (ua.includes('linux')) {
    os = 'linux';
  }

  const isMobile = /iphone|ipad|android|mobile/.test(ua);

  return { browser, os, isMobile };
}

/**
 * Check if current browser is Safari.
 */
export function isSafari(): boolean {
  return getBrowserInfo().browser === 'safari';
}

/**
 * Check if current browser is Firefox.
 */
export function isFirefox(): boolean {
  return getBrowserInfo().browser === 'firefox';
}

/**
 * Check if current device is iOS.
 */
export function isIOS(): boolean {
  return getBrowserInfo().os === 'ios';
}

/**
 * Get browser-specific notification limitations message.
 * Returns null if no significant limitations.
 */
export function getNotificationLimitations(): string | null {
  const { browser, os } = getBrowserInfo();
  
  if (os === 'ios') {
    return 'iOS requires adding this app to your home screen for full notification support.';
  }
  
  if (browser === 'safari') {
    return 'Safari may display notifications with the site icon instead of custom icons.';
  }
  
  if (browser === 'firefox') {
    return 'Firefox does not support notification badges.';
  }
  
  return null;
}

/**
 * Get a friendly browser name for display.
 */
export function getBrowserDisplayName(): string {
  const { browser } = getBrowserInfo();
  
  const names: Record<BrowserInfo['browser'], string> = {
    chrome: 'Chrome',
    safari: 'Safari',
    firefox: 'Firefox',
    edge: 'Edge',
    unknown: 'your browser',
  };
  
  return names[browser];
}

/**
 * Get a friendly OS name for display.
 */
export function getOSDisplayName(): string {
  const { os } = getBrowserInfo();
  
  const names: Record<BrowserInfo['os'], string> = {
    macos: 'macOS',
    windows: 'Windows',
    linux: 'Linux',
    ios: 'iOS',
    android: 'Android',
    unknown: 'your device',
  };
  
  return names[os];
}
