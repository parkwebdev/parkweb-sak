/**
 * useLocationDetection Hook
 * 
 * Smart location detection for multi-location businesses.
 * Detects user's location context from:
 * 1. Explicit data-location attribute (highest priority)
 * 2. URL path pattern matching (e.g., /community/forge-lake/)
 * 3. WordPress API lookup (home → community resolution)
 * 4. User selection via AI tool
 * 
 * @module widget/hooks/useLocationDetection
 */

import { useState, useEffect, useCallback } from 'react';
import { widgetSupabase } from '../api';
import { widgetLogger } from '../utils';

/** Location data from database */
export interface DetectedLocation {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
}

/** Return type for useLocationDetection hook */
export interface UseLocationDetectionResult {
  /** Detected location or null */
  location: DetectedLocation | null;
  /** Method used to detect location */
  detectionMethod: 'explicit' | 'url_pattern' | 'wordpress_api' | 'user_selected' | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Available locations for picker */
  availableLocations: DetectedLocation[];
  /** Whether location picker should be shown */
  showLocationPicker: boolean;
  /** Set location picker visibility */
  setShowLocationPicker: (show: boolean) => void;
  /** Manually select a location */
  selectLocation: (locationId: string) => void;
}

interface UseLocationDetectionOptions {
  agentId: string;
  /** WordPress site URL for API lookups */
  wordpressSiteUrl?: string;
  /** Explicit location slug from embed attribute */
  explicitLocationSlug?: string;
  /** Current parent page URL */
  parentPageUrl?: string;
  /** Enable auto-detection (default: true) */
  enableAutoDetection?: boolean;
}

/**
 * Common URL patterns for location detection
 * These patterns are matched against the URL path
 */
const URL_PATTERNS = [
  /\/community\/([^\/]+)\/?/i,           // /community/forge-lake/
  /\/communities\/([^\/]+)\/?/i,         // /communities/forge-lake/
  /\/location\/([^\/]+)\/?/i,            // /location/forge-lake/
  /\/locations\/([^\/]+)\/?/i,           // /locations/forge-lake/
  /\/property\/([^\/]+)\/?/i,            // /property/forge-lake/
  /\/properties\/([^\/]+)\/?/i,          // /properties/forge-lake/
  /\/homes\/([^\/]+)\/?/i,               // /homes/forge-lake/
  /\/home\/([^\/]+)\/?/i,                // /home/forge-lake/
  /\/([^\/]+)\/homes\/?/i,               // /forge-lake/homes/
  /\/([^\/]+)\/available-homes\/?/i,     // /forge-lake/available-homes/
];

/**
 * Extract slug from URL using common patterns
 */
function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    for (const pattern of URL_PATTERNS) {
      const match = path.match(pattern);
      if (match?.[1]) {
        return match[1].toLowerCase();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hook for detecting user's location context
 */
export function useLocationDetection({
  agentId,
  wordpressSiteUrl,
  explicitLocationSlug,
  parentPageUrl,
  enableAutoDetection = true,
}: UseLocationDetectionOptions): UseLocationDetectionResult {
  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<UseLocationDetectionResult['detectionMethod']>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<DetectedLocation[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  /**
   * Fetch available locations for this agent
   */
  const fetchAvailableLocations = useCallback(async () => {
    if (!agentId) return;
    
    try {
      const { data, error } = await widgetSupabase
        .from('locations')
        .select('id, name, wordpress_slug, city, state')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setAvailableLocations(data.map(loc => ({
          id: loc.id,
          name: loc.name,
          slug: loc.wordpress_slug || undefined,
          city: loc.city || undefined,
          state: loc.state || undefined,
        })));
      }
    } catch (error) {
      widgetLogger.error('Error fetching locations:', error);
    }
  }, [agentId]);

  /**
   * Look up location by slug
   */
  const lookupLocationBySlug = useCallback(async (slug: string): Promise<DetectedLocation | null> => {
    if (!agentId || !slug) return null;
    
    try {
      const { data, error } = await widgetSupabase
        .from('locations')
        .select('id, name, wordpress_slug, city, state')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .eq('wordpress_slug', slug.toLowerCase())
        .single();
      
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.wordpress_slug || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
        };
      }
      return null;
    } catch (error) {
      widgetLogger.error('Error looking up location by slug:', error);
      return null;
    }
  }, [agentId]);

  /**
   * Look up community from WordPress home page
   */
  const lookupWordPressCommunity = useCallback(async (homeSlug: string): Promise<string | null> => {
    if (!wordpressSiteUrl || !homeSlug) return null;
    
    try {
      // Try WordPress REST API to get home's community
      const response = await fetch(
        `${wordpressSiteUrl}/wp-json/wp/v2/homes?slug=${homeSlug}&_fields=acf`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (!response.ok) return null;
      
      const homes = await response.json();
      if (homes[0]?.acf?.community_slug) {
        return homes[0].acf.community_slug;
      }
      return null;
    } catch (error) {
      widgetLogger.error('WordPress API lookup failed:', error);
      return null;
    }
  }, [wordpressSiteUrl]);

  /**
   * Manually select a location
   */
  const selectLocation = useCallback((locationId: string) => {
    const selected = availableLocations.find(loc => loc.id === locationId);
    if (selected) {
      setLocation(selected);
      setDetectionMethod('user_selected');
      setShowLocationPicker(false);
      
      // Persist selection for this session
      try {
        localStorage.setItem(`chatpad_location_${agentId}`, JSON.stringify({
          id: selected.id,
          name: selected.name,
        }));
      } catch {
        // localStorage not available
      }
    }
  }, [availableLocations, agentId]);

  /**
   * Run location detection on mount and when parent URL changes
   */
  useEffect(() => {
    const detectLocation = async () => {
      if (!agentId) return;
      
      setIsDetecting(true);
      
      try {
        // Check for previously selected location in localStorage
        try {
          const stored = localStorage.getItem(`chatpad_location_${agentId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.id && parsed?.name) {
              setLocation(parsed);
              setDetectionMethod('user_selected');
              setIsDetecting(false);
              return;
            }
          }
        } catch {
          // localStorage not available or invalid data
        }
        
        // Priority 1: Explicit location slug from embed attribute
        if (explicitLocationSlug) {
          const loc = await lookupLocationBySlug(explicitLocationSlug);
          if (loc) {
            setLocation(loc);
            setDetectionMethod('explicit');
            setIsDetecting(false);
            return;
          }
        }
        
        // Priority 2: URL pattern matching
        if (enableAutoDetection && parentPageUrl) {
          const urlSlug = extractSlugFromUrl(parentPageUrl);
          if (urlSlug) {
            // First try direct location match
            const loc = await lookupLocationBySlug(urlSlug);
            if (loc) {
              setLocation(loc);
              setDetectionMethod('url_pattern');
              setIsDetecting(false);
              return;
            }
            
            // If no direct match, try WordPress home → community lookup
            if (wordpressSiteUrl) {
              const communitySlug = await lookupWordPressCommunity(urlSlug);
              if (communitySlug) {
                const communityLoc = await lookupLocationBySlug(communitySlug);
                if (communityLoc) {
                  setLocation(communityLoc);
                  setDetectionMethod('wordpress_api');
                  setIsDetecting(false);
                  return;
                }
              }
            }
          }
        }
        
        // No location detected - location will be null until user selects or AI prompts
      } catch (error) {
        widgetLogger.error('Detection error:', error);
      } finally {
        setIsDetecting(false);
      }
    };
    
    detectLocation();
    fetchAvailableLocations();
  }, [
    agentId,
    explicitLocationSlug,
    parentPageUrl,
    wordpressSiteUrl,
    enableAutoDetection,
    lookupLocationBySlug,
    lookupWordPressCommunity,
    fetchAvailableLocations,
  ]);

  return {
    location,
    detectionMethod,
    isDetecting,
    availableLocations,
    showLocationPicker,
    setShowLocationPicker,
    selectLocation,
  };
}
