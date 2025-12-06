/**
 * Referrer & UTM Utilities
 * 
 * Functions for detecting traffic sources and parsing UTM parameters.
 */

import type { ReferrerJourney } from '../api';

/**
 * Detect traffic source type from referrer URL
 */
export function detectEntryType(referrer: string | null): ReferrerJourney['entry_type'] {
  if (!referrer) return 'direct';
  
  const lowerRef = referrer.toLowerCase();
  
  // Search engines
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\./i.test(lowerRef)) {
    return 'organic';
  }
  
  // Social platforms
  if (/facebook\.|instagram\.|twitter\.|x\.com|linkedin\.|tiktok\.|pinterest\.|reddit\.|youtube\./i.test(lowerRef)) {
    return 'social';
  }
  
  // Email providers (common webmail)
  if (/mail\.|gmail\.|outlook\.|yahoo\.com\/mail|webmail\./i.test(lowerRef)) {
    return 'email';
  }
  
  // If there's a referrer but doesn't match above, it's a referral
  return 'referral';
}

/**
 * Parse UTM parameters from URL
 */
export function parseUtmParams(url: string): Partial<ReferrerJourney> {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Check if any utm params exist - if utm_source is present, likely paid
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    
    // Detect paid traffic from utm parameters
    let entryType: ReferrerJourney['entry_type'] | undefined;
    if (utmMedium && ['cpc', 'ppc', 'paid', 'cpm', 'display', 'retargeting'].includes(utmMedium.toLowerCase())) {
      entryType = 'paid';
    }
    
    return {
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
      ...(entryType ? { entry_type: entryType } : {}),
    };
  } catch {
    return {};
  }
}
