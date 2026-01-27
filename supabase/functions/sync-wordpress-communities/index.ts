/**
 * Sync WordPress Communities Edge Function
 * 
 * Fetches communities from a WordPress REST API and upserts them as locations.
 * Supports both testing connection and full sync operations.
 * 
 * Optimizations:
 * - Content hashing to skip unchanged records
 * - Batch database queries to reduce N+1 patterns
 * - Incremental sync using modified_after parameter
 * 
 * @module functions/sync-wordpress-communities
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { extractCommunityData, type ExtractedCommunityData } from '../_shared/ai/wordpress-extraction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressConfig {
  site_url: string;
  community_endpoint?: string;
  home_endpoint?: string;
  last_community_sync?: string;
  community_count?: number;
  community_sync_interval?: string;
  home_sync_interval?: string;
  /** Field mappings: target field → source field path */
  community_field_mappings?: Record<string, string>;
  /** Field mappings: target field → source field path */
  property_field_mappings?: Record<string, string>;
}

interface WordPressCommunity {
  id: number;
  slug: string;
  title: { rendered: string };
  acf?: Record<string, unknown>;
}

interface DiscoveredEndpoint {
  slug: string;
  name: string;
  rest_base: string;
  classification?: 'community' | 'home' | 'unknown';
  confidence?: number;
  signals?: string[];
  postCount?: number;
}

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  errors: string[];
  sync_type: 'full' | 'incremental';
}

/**
 * Generate a content hash for change detection
 * Uses a simple but effective string-based hash
 */
function generateContentHash(data: Record<string, unknown>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Intelligently extract a field from ACF data by searching for keywords
 * Handles prefixed fields like "community_city" when looking for "city"
 */
function extractAcfField(acf: Record<string, unknown> | undefined, ...keywords: string[]): string | null {
  if (!acf) return null;
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Priority 1: Exact match
    const exactMatch = keys.find(k => k.toLowerCase() === lowerKeyword);
    if (exactMatch && acf[exactMatch] != null && acf[exactMatch] !== '') {
      return String(acf[exactMatch]);
    }
    
    // Priority 2: Ends with keyword (e.g., "community_city" ends with "city")
    const suffixMatch = keys.find(k => k.toLowerCase().endsWith(`_${lowerKeyword}`) || k.toLowerCase().endsWith(lowerKeyword));
    if (suffixMatch && acf[suffixMatch] != null && acf[suffixMatch] !== '') {
      return String(acf[suffixMatch]);
    }
    
    // Priority 3: Contains keyword (e.g., "phone_number" contains "phone")
    const containsMatch = keys.find(k => k.toLowerCase().includes(lowerKeyword));
    if (containsMatch && acf[containsMatch] != null && acf[containsMatch] !== '') {
      return String(acf[containsMatch]);
    }
  }
  
  return null;
}

/**
 * Get a value from an object using dot-notation path
 * e.g., getValueByPath(obj, 'acf.phone') returns obj.acf.phone
 */
function getValueByPath(obj: Record<string, unknown>, path: string | undefined): unknown {
  if (!path) return null;
  
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    if (typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[part];
  }
  
  // Convert value to string if it exists and isn't already
  if (current === null || current === undefined) return null;
  if (typeof current === 'object') {
    // For objects like {rendered: "text"}, try to get rendered value
    const asObj = current as Record<string, unknown>;
    if ('rendered' in asObj) return asObj.rendered;
    return null;
  }
  return current;
}

/**
 * Extract numeric field from ACF data
 */
function extractAcfNumber(acf: Record<string, unknown> | undefined, ...keywords: string[]): number | null {
  const value = extractAcfField(acf, ...keywords);
  if (!value) return null;
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Find matching taxonomy term ID with fuzzy slug matching.
 */
function findMatchingTermId(
  taxonomyTerms: Map<string, number>,
  communitySlug: string
): number | null {
  // 1. Exact match
  if (taxonomyTerms.has(communitySlug)) {
    return taxonomyTerms.get(communitySlug)!;
  }
  
  // 2. Check if community slug is contained in any term slug or vice versa
  for (const [termSlug, termId] of taxonomyTerms.entries()) {
    if (termSlug.includes(communitySlug) || communitySlug.includes(termSlug)) {
      console.log(`🔍 Fuzzy matched: community "${communitySlug}" → term "${termSlug}" (term ID ${termId})`);
      return termId;
    }
  }
  
  // 3. Normalize both slugs by removing common prefixes and compare
  const commonPrefixes = /^(the-|lake-|park-|community-|village-|estates-|manor-)/;
  const normalizedCommunity = communitySlug.replace(commonPrefixes, '');
  for (const [termSlug, termId] of taxonomyTerms.entries()) {
    const normalizedTerm = termSlug.replace(commonPrefixes, '');
    if (normalizedCommunity === normalizedTerm) {
      console.log(`🔍 Normalized match: community "${communitySlug}" → term "${termSlug}" (term ID ${termId})`);
      return termId;
    }
  }
  
  return null;
}

/**
 * Infer timezone from state
 */
function inferTimezone(
  state: string | null, 
  latitude?: number | null, 
  longitude?: number | null
): string {
  if (longitude != null) {
    if (longitude >= -67 && longitude < -71) return 'America/New_York';
    if (longitude >= -71 && longitude < -85) return 'America/New_York';
    if (longitude >= -85 && longitude < -100) return 'America/Chicago';
    if (longitude >= -100 && longitude < -115) return 'America/Denver';
    if (longitude >= -115 && longitude < -125) return 'America/Los_Angeles';
    if (longitude >= -125 && longitude < -140) return 'America/Anchorage';
    if (longitude >= -155 && longitude < -162) return 'Pacific/Honolulu';
  }
  
  if (!state) return 'America/New_York';
  
  const normalized = state.toLowerCase().trim();
  
  const eastern = ['ct', 'connecticut', 'de', 'delaware', 'fl', 'florida', 'ga', 'georgia', 
    'me', 'maine', 'md', 'maryland', 'ma', 'massachusetts', 'mi', 'michigan', 
    'nh', 'new hampshire', 'nj', 'new jersey', 'ny', 'new york', 'nc', 'north carolina',
    'oh', 'ohio', 'pa', 'pennsylvania', 'ri', 'rhode island', 'sc', 'south carolina',
    'vt', 'vermont', 'va', 'virginia', 'wv', 'west virginia', 'dc', 'district of columbia'];
  
  const central = ['al', 'alabama', 'ar', 'arkansas', 'il', 'illinois', 'ia', 'iowa',
    'ks', 'kansas', 'ky', 'kentucky', 'la', 'louisiana', 'mn', 'minnesota', 
    'ms', 'mississippi', 'mo', 'missouri', 'ne', 'nebraska', 'nd', 'north dakota',
    'ok', 'oklahoma', 'sd', 'south dakota', 'tn', 'tennessee', 'tx', 'texas', 'wi', 'wisconsin'];
  
  const mountain = ['co', 'colorado', 'id', 'idaho', 'mt', 'montana', 'nm', 'new mexico',
    'ut', 'utah', 'wy', 'wyoming'];
  
  const pacific = ['ca', 'california', 'nv', 'nevada', 'or', 'oregon', 'wa', 'washington'];
  
  if (normalized === 'az' || normalized === 'arizona') return 'America/Phoenix';
  if (normalized === 'hi' || normalized === 'hawaii') return 'Pacific/Honolulu';
  if (normalized === 'ak' || normalized === 'alaska') return 'America/Anchorage';
  if (normalized === 'in' || normalized === 'indiana') return 'America/Indiana/Indianapolis';
  
  if (eastern.includes(normalized)) return 'America/New_York';
  if (central.includes(normalized)) return 'America/Chicago';
  if (mountain.includes(normalized)) return 'America/Denver';
  if (pacific.includes(normalized)) return 'America/Los_Angeles';
  
  return 'America/New_York';
}

/**
 * Extract ZIP code from full address
 */
function extractZipFromAddress(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(-\d{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Normalize WordPress site URL
 */
function normalizeSiteUrl(url: string): string {
  let normalized = url.trim();
  
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  
  normalized = normalized.replace(/\/$/, '');
  
  const pathsToStrip = [
    '/wp-json/wp/v2/community',
    '/wp-json/wp/v2/communities',
    '/wp-json/wp/v2',
    '/wp-json'
  ];
  
  for (const path of pathsToStrip) {
    if (normalized.endsWith(path)) {
      normalized = normalized.slice(0, -path.length);
      break;
    }
  }
  
  return normalized;
}

/**
 * Classify an endpoint by analyzing sample post ACF fields
 * Returns classification type, confidence score, and signals used for classification
 */
async function classifyEndpoint(
  siteUrl: string, 
  slug: string
): Promise<{
  type: 'community' | 'home' | 'unknown';
  confidence: number;
  signals: string[];
  postCount: number;
}> {
  const signals: string[] = [];
  let communityScore = 0;
  let homeScore = 0;
  let postCount = 0;

  try {
    // Fetch 1 sample post with ACF data
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/${slug}?per_page=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });

    if (!response.ok) {
      return { type: 'unknown', confidence: 0, signals: ['Endpoint not accessible'], postCount: 0 };
    }

    // Get total post count from headers
    postCount = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    const posts = await response.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      return { type: 'unknown', confidence: 0, signals: ['No posts found'], postCount };
    }

    const sample = posts[0];
    const acfKeys = Object.keys(sample.acf || {}).map(k => k.toLowerCase());
    const allKeys = [...acfKeys, ...Object.keys(sample).map(k => k.toLowerCase())];

    // Community signals - things communities typically have
    const communityFields = [
      'amenities', 'amenity', 'pet_policy', 'pets', 'office_hours', 'office', 
      'manager', 'staff', 'entrance', 'gate', 'clubhouse', 'pool', 'gym',
      'lot_count', 'lots', 'spaces', 'sites', 'neighborhood', 'community_info'
    ];
    const communityMatches = communityFields.filter(f => 
      acfKeys.some(k => k.includes(f))
    );
    if (communityMatches.length > 0) {
      communityScore += Math.min(communityMatches.length * 1.5, 5);
      signals.push(`Has community fields: ${communityMatches.slice(0, 3).join(', ')}`);
    }

    // Home/Property signals - things homes typically have
    const homeFields = [
      'price', 'bedrooms', 'beds', 'bed', 'bathrooms', 'baths', 'bath',
      'sqft', 'square_feet', 'sq_ft', 'lot_rent', 'rent', 'status',
      'year_built', 'year', 'model', 'manufacturer', 'serial', 'vin',
      'lot_number', 'lot', 'home_type', 'property_type', 'mls', 'listing'
    ];
    const homeMatches = homeFields.filter(f => 
      acfKeys.some(k => k.includes(f))
    );
    if (homeMatches.length > 0) {
      homeScore += Math.min(homeMatches.length * 1.5, 5);
      signals.push(`Has property fields: ${homeMatches.slice(0, 3).join(', ')}`);
    }

    // Relationship signals - homes often reference communities
    if (sample.home_community || sample.community || acfKeys.some(k => k.includes('home_community'))) {
      homeScore += 2;
      signals.push('Has community relationship field');
    }

    // Taxonomy signals - check for taxonomy terms that indicate type
    if (sample.community || sample.communities) {
      homeScore += 1;
      signals.push('Has community taxonomy');
    }

    // Featured image presence (both can have, but communities more likely to have galleries)
    if (sample.featured_media || sample._embedded?.['wp:featuredmedia']) {
      // Neutral signal
    }

    // Slug keyword bonus (existing logic, lower weight)
    const communityKeywords = ['community', 'communities', 'location', 'site', 'park', 'neighborhood', 'village', 'estate'];
    const homeKeywords = ['home', 'homes', 'property', 'properties', 'listing', 'house', 'unit', 'apartment', 'mhc', 'mh'];

    if (communityKeywords.some(k => slug.toLowerCase().includes(k))) {
      communityScore += 1;
      if (!signals.some(s => s.includes('slug'))) {
        signals.push(`Slug contains community keyword`);
      }
    }
    if (homeKeywords.some(k => slug.toLowerCase().includes(k))) {
      homeScore += 1;
      if (!signals.some(s => s.includes('slug'))) {
        signals.push(`Slug contains property keyword`);
      }
    }

    // Determine classification
    const totalScore = communityScore + homeScore;
    
    if (totalScore === 0) {
      return { type: 'unknown', confidence: 0, signals: ['No classifiable fields found'], postCount };
    }

    if (communityScore > homeScore && communityScore >= 2) {
      const confidence = Math.min(communityScore / (totalScore + 2), 0.95);
      return { type: 'community', confidence, signals, postCount };
    }
    
    if (homeScore > communityScore && homeScore >= 2) {
      const confidence = Math.min(homeScore / (totalScore + 2), 0.95);
      return { type: 'home', confidence, signals, postCount };
    }

    // Tie or low scores
    if (communityScore > homeScore) {
      return { type: 'community', confidence: 0.3, signals: [...signals, 'Low confidence - similar to both types'], postCount };
    }
    if (homeScore > communityScore) {
      return { type: 'home', confidence: 0.3, signals: [...signals, 'Low confidence - similar to both types'], postCount };
    }

    return { type: 'unknown', confidence: 0, signals: ['Could not determine type'], postCount };
  } catch (error: unknown) {
    console.error(`Error classifying endpoint ${slug}:`, error);
    return { type: 'unknown', confidence: 0, signals: ['Classification failed'], postCount };
  }
}

/**
 * Auto-detect available custom post types from WordPress REST API root
 * Uses schema analysis to classify endpoints by their content
 */
async function discoverEndpoints(siteUrl: string): Promise<{
  communityEndpoints: DiscoveredEndpoint[];
  homeEndpoints: DiscoveredEndpoint[];
  unclassifiedEndpoints: DiscoveredEndpoint[];
}> {
  const normalizedUrl = normalizeSiteUrl(siteUrl);
  const communityEndpoints: DiscoveredEndpoint[] = [];
  const homeEndpoints: DiscoveredEndpoint[] = [];
  const unclassifiedEndpoints: DiscoveredEndpoint[] = [];
  
  try {
    // Fetch WordPress REST API root to discover available endpoints
    const rootResponse = await fetch(`${normalizedUrl}/wp-json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });
    
    if (!rootResponse.ok) {
      console.log(`Could not fetch /wp-json: ${rootResponse.status}`);
      return { communityEndpoints, homeEndpoints, unclassifiedEndpoints };
    }
    
    const rootData = await rootResponse.json();
    const routes = rootData.routes || {};
    
    // Skip WordPress core types
    const coreTypes = ['posts', 'pages', 'media', 'blocks', 'templates', 'template-parts', 'navigation', 'comments', 'search', 'categories', 'tags', 'users', 'settings', 'themes', 'plugins', 'block-types', 'block-patterns', 'block-directory', 'menu-items', 'menus', 'sidebars', 'widget-types', 'widgets', 'types', 'statuses', 'taxonomies', 'global-styles'];
    
    // Collect all custom post type slugs
    const customPostTypes: string[] = [];
    
    for (const [route] of Object.entries(routes)) {
      const match = route.match(/^\/wp\/v2\/([a-z0-9_-]+)$/i);
      if (!match) continue;
      
      const slug = match[1];
      if (coreTypes.includes(slug)) continue;
      
      customPostTypes.push(slug);
    }
    
    console.log(`Found ${customPostTypes.length} custom post types to classify`);
    
    // Classify each endpoint in parallel
    const classificationPromises = customPostTypes.map(async (slug) => {
      const classification = await classifyEndpoint(normalizedUrl, slug);
      
      const endpoint: DiscoveredEndpoint = {
        slug,
        name: slug.replace(/-/g, ' ').replace(/_/g, ' '),
        rest_base: slug,
        classification: classification.type,
        confidence: classification.confidence,
        signals: classification.signals,
        postCount: classification.postCount,
      };
      
      return endpoint;
    });
    
    const classifiedEndpoints = await Promise.all(classificationPromises);
    
    // Sort into buckets based on classification
    for (const endpoint of classifiedEndpoints) {
      if (endpoint.classification === 'community') {
        communityEndpoints.push(endpoint);
      } else if (endpoint.classification === 'home') {
        homeEndpoints.push(endpoint);
      } else {
        unclassifiedEndpoints.push(endpoint);
      }
    }
    
    // Sort by confidence (highest first)
    communityEndpoints.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    homeEndpoints.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    
    console.log(`Classified: ${communityEndpoints.length} community, ${homeEndpoints.length} home, ${unclassifiedEndpoints.length} unknown`);
  } catch (error: unknown) {
    console.error('Error discovering endpoints:', error);
  }
  
  return { communityEndpoints, homeEndpoints, unclassifiedEndpoints };
}

/**
 * Decode JWT payload (base64url) - safe after gateway verification
 */
function decodeJwtPayload(token: string): { sub?: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Base64url decode the payload
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const isScheduledSync = req.headers.get('x-scheduled-sync') === 'true';
    let userId: string | null = null;
    let isServiceRole = false;
    
    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Gateway has already verified the JWT (verify_jwt = true in config)
    // We just need to extract the user ID from the payload
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = decodeJwtPayload(token);
      
      if (payload) {
        userId = payload.sub || null;
        isServiceRole = payload.role === 'service_role';
        console.log('JWT verified by gateway, extracted:', { 
          userId: userId ? `${userId.slice(0, 8)}...` : null, 
          role: payload.role,
          isScheduledSync 
        });
      }
    }

    // For scheduled syncs with service_role, skip user-level checks
    if (isScheduledSync && isServiceRole) {
      console.log('Scheduled sync with service_role: bypassing user auth');
    } else if (!userId) {
      // This shouldn't happen if gateway is properly configured
      console.log('Auth failed: No user ID extracted from JWT');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, agentId, siteUrl, communityEndpoint, homeEndpoint, communitySyncInterval, homeSyncInterval, deleteLocations, modifiedAfter, useAiExtraction, forceFullSync } = await req.json();

    // Verify user has access to this agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id, deployment_config')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip access check for scheduled syncs with service_role
    if (!(isScheduledSync && isServiceRole) && userId) {
      let hasAccess = userId === agent.user_id;
      
      if (!hasAccess) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('owner_id', agent.user_id)
          .eq('member_id', userId)
          .maybeSingle();
        
        hasAccess = !!teamMember;
      }

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle connect action - combines URL save + endpoint discovery in one step
    if (action === 'connect') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      
      // First, validate the URL is reachable
      try {
        const testResponse = await fetch(`${normalizedUrl}/wp-json`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Pilot/1.0',
          },
        });
        
        if (!testResponse.ok) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `WordPress REST API not accessible (HTTP ${testResponse.status})` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error: unknown) {
        const connError = error instanceof Error ? getConnectionErrorMessage(error) : null;
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: connError || 'Could not connect to WordPress site' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save the URL to agent config
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          site_url: normalizedUrl,
        },
      };

      await supabase
        .from('agents')
        .update({ deployment_config: updatedConfig })
        .eq('id', agentId);

      // Discover endpoints
      const endpoints = await discoverEndpoints(normalizedUrl);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connected successfully',
          normalizedUrl,
          ...endpoints 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle discover action - auto-detect available endpoints
    if (action === 'discover') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      const endpoints = await discoverEndpoints(normalizedUrl);
      
      return new Response(
        JSON.stringify({ success: true, ...endpoints }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle fetch-sample action - get sample post and available fields for mapping
    if (action === 'fetch-sample') {
      const { endpoint: sampleEndpoint, type: mappingType } = await req.clone().json();
      
      if (!siteUrl || !sampleEndpoint) {
        return new Response(
          JSON.stringify({ error: 'Site URL and endpoint are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      const sampleResult = await fetchSamplePostForMapping(normalizedUrl, sampleEndpoint, mappingType || 'community');
      
      return new Response(
        JSON.stringify(sampleResult),
        { status: sampleResult.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle test connection action
    if (action === 'test') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      // Use provided endpoint or fall back to 'community'
      const endpoint = communityEndpoint || 'community';
      const testResult = await testWordPressConnection(normalizedUrl, endpoint);
      return new Response(
        JSON.stringify(testResult),
        { status: testResult.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle sync action
    if (action === 'sync') {
      const startTime = Date.now();
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const urlToSync = normalizeSiteUrl(siteUrl || wpConfig?.site_url || '');
      // Use provided endpoint, or stored config, or default to 'community'
      const endpoint = communityEndpoint || wpConfig?.community_endpoint || 'community';
      
      // Determine if this is an incremental sync
      const lastSync = modifiedAfter || wpConfig?.last_community_sync;
      let isIncremental = !!lastSync && !forceFullSync;
      
      // Smart detection: if local communities count is 0 but we had some before, force full sync
      if (isIncremental) {
        const { count: localCount } = await supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', agentId)
          .not('wordpress_community_id', 'is', null);
        
        if (localCount === 0 && wpConfig?.community_count && wpConfig.community_count > 0) {
          console.log(`Detected missing local communities (0 vs ${wpConfig.community_count} expected). Forcing full sync.`);
          isIncremental = false;
        }
      }
      
      if (!urlToSync) {
        return new Response(
          JSON.stringify({ error: 'No WordPress site URL configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Starting WordPress community sync for agent ${agentId} from ${urlToSync} using endpoint /${endpoint} (${isIncremental ? 'incremental' : 'full'})`);

      // Fetch communities from WordPress using the configured endpoint
      const communities = await fetchWordPressCommunities(urlToSync, endpoint, isIncremental ? lastSync : undefined);
      console.log(`Fetched ${communities.length} communities from WordPress`);

      // Fetch taxonomy terms (try endpoint-based name first, then common names)
      const taxonomyTerms = await fetchTaxonomyTerms(urlToSync, endpoint);
      console.log(`Fetched ${taxonomyTerms.size} taxonomy terms`);

      // Sync communities to locations with optimizations
      const result = await syncCommunitiesToLocations(
        supabase,
        agentId,
        agent.user_id,
        communities,
        taxonomyTerms,
        isIncremental,
        useAiExtraction ?? false,
        wpConfig?.community_field_mappings
      );

      // Update agent's deployment_config with sync info
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          site_url: urlToSync,
          community_endpoint: endpoint,
          last_community_sync: new Date().toISOString(),
          community_count: communities.length,
        },
      };

      await supabase
        .from('agents')
        .update({ deployment_config: updatedConfig })
        .eq('id', agentId);

      const duration = Date.now() - startTime;
      console.log(`Sync complete in ${duration}ms: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged, ${result.deleted} deleted`);

      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          total: communities.length,
          duration_ms: duration,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle save config action
    if (action === 'save') {
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const normalizedUrl = siteUrl ? normalizeSiteUrl(siteUrl) : wpConfig?.site_url;
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          ...(normalizedUrl && { site_url: normalizedUrl }),
          ...(communityEndpoint !== undefined && { community_endpoint: communityEndpoint }),
          ...(homeEndpoint !== undefined && { home_endpoint: homeEndpoint }),
          ...(communitySyncInterval !== undefined && { community_sync_interval: communitySyncInterval }),
          ...(homeSyncInterval !== undefined && { home_sync_interval: homeSyncInterval }),
        },
      };

      await supabase
        .from('agents')
        .update({ deployment_config: updatedConfig })
        .eq('id', agentId);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle disconnect action - HARD DELETE
    if (action === 'disconnect') {
      // Delete synced locations (hard delete)
      if (deleteLocations) {
        const { error: deleteError } = await supabase
          .from('locations')
          .delete()
          .eq('agent_id', agentId)
          .not('wordpress_community_id', 'is', null);
        
        if (deleteError) {
          console.error('Error deleting locations:', deleteError);
        } else {
          console.log(`Hard deleted WordPress locations for agent ${agentId}`);
        }
      }

      // Clear WordPress config from agent
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const { wordpress: _, ...restConfig } = deploymentConfig || {};
      
      await supabase
        .from('agents')
        .update({ deployment_config: restConfig })
        .eq('id', agentId);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "test", "connect", "sync", "save", "discover", "fetch-sample", or "disconnect"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sync-wordpress-communities:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Check if an error is a DNS/connection error and return a user-friendly message
 */
function getConnectionErrorMessage(error: Error): string | null {
  const msg = error.message?.toLowerCase() || '';
  
  if (msg.includes('dns error') || msg.includes('failed to lookup address')) {
    return 'Domain not found. Please verify the URL is correct and the site is accessible.';
  }
  if (msg.includes('client error (connect)') || msg.includes('connection refused')) {
    return 'Could not connect to the server. Please check the URL and try again.';
  }
  if (msg.includes('timed out') || msg.includes('timeout')) {
    return 'Connection timed out. The server may be slow or unreachable.';
  }
  if (msg.includes('ssl') || msg.includes('certificate')) {
    return 'SSL/Certificate error. The site may have an invalid or expired certificate.';
  }
  
  return null;
}

async function testWordPressConnection(
  siteUrl: string, 
  endpoint: string
): Promise<{ success: boolean; message: string; communityCount?: number; normalizedUrl?: string; hint?: string }> {
  const normalizedUrl = siteUrl.replace(/\/$/, '');
  
  try {
    const apiUrl = `${normalizedUrl}/wp-json/wp/v2/${endpoint}?per_page=1`;

    console.log(`Testing WordPress connection: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { 
          success: false, 
          message: `Endpoint "/${endpoint}" not found. Try a different custom post type slug or use auto-detect.`,
          normalizedUrl,
          hint: `Try opening ${normalizedUrl}/wp-json in your browser to verify the REST API is available.`,
        };
      }
      return { 
        success: false, 
        message: `WordPress API returned status ${response.status}`,
        normalizedUrl,
      };
    }

    const totalCount = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { 
        success: false, 
        message: 'Invalid response format from WordPress API',
        normalizedUrl,
      };
    }

    return { 
      success: true, 
      message: `Found ${totalCount} items at /${endpoint}`,
      communityCount: totalCount,
      normalizedUrl,
    };
  } catch (error: unknown) {
    console.error('WordPress connection test error:', error);
    
    // Provide user-friendly error messages for common connection issues
    const friendlyMessage = getConnectionErrorMessage(error);
    if (friendlyMessage) {
      return { 
        success: false, 
        message: friendlyMessage,
        normalizedUrl,
        hint: `Try opening ${normalizedUrl} in your browser to verify the site is accessible.`,
      };
    }
    
    return { 
      success: false, 
      message: `Connection failed: ${error.message}`,
      normalizedUrl,
    };
  }
}

interface AvailableField {
  path: string;
  sampleValue: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
}

interface SamplePostResult {
  success: boolean;
  samplePost?: { id: number; title: string };
  availableFields: AvailableField[];
  suggestedMappings: Record<string, string>;
  error?: string;
}

/**
 * Flatten an object to dot-notation paths
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  result: AvailableField[] = [],
  maxDepth = 3,
  currentDepth = 0
): AvailableField[] {
  if (currentDepth >= maxDepth) return result;

  for (const [key, value] of Object.entries(obj)) {
    // Skip internal WordPress fields
    if (key.startsWith('_') && key !== '_embedded') continue;
    
    const path = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      result.push({ path, sampleValue: null, type: 'null' });
    } else if (Array.isArray(value)) {
      // For arrays, show the first element or the array itself
      if (value.length > 0 && typeof value[0] === 'string') {
        result.push({ path, sampleValue: value.slice(0, 3).join(', '), type: 'array' });
      } else if (value.length > 0 && typeof value[0] === 'object') {
        // Skip complex nested arrays for simplicity
        result.push({ path, sampleValue: `[${value.length} items]`, type: 'array' });
      } else {
        result.push({ path, sampleValue: value.length > 0 ? String(value[0]) : '[]', type: 'array' });
      }
    } else if (typeof value === 'object') {
      // Recurse into objects (like acf, title, etc.)
      flattenObject(value as Record<string, unknown>, path, result, maxDepth, currentDepth + 1);
    } else if (typeof value === 'boolean') {
      result.push({ path, sampleValue: value, type: 'boolean' });
    } else if (typeof value === 'number') {
      result.push({ path, sampleValue: value, type: 'number' });
    } else {
      result.push({ path, sampleValue: String(value), type: 'string' });
    }
  }

  return result;
}

/**
 * Generate suggested field mappings based on field name similarity
 */
function generateSuggestedMappings(
  availableFields: AvailableField[],
  type: 'community' | 'property'
): Record<string, string> {
  const suggestions: Record<string, string> = {};
  const fieldPaths = availableFields.map(f => f.path.toLowerCase());
  const usedPaths = new Set<string>();

  // Define target fields and their keyword patterns
  const communityPatterns: Record<string, string[]> = {
    name: ['title.rendered', 'name', 'community_name', 'park_name'],
    address: ['address', 'full_address', 'street', 'street_address', 'location'],
    city: ['city', 'town'],
    state: ['state', 'province'],
    zip: ['zip', 'zipcode', 'postal', 'postal_code'],
    phone: ['phone', 'telephone', 'tel', 'phone_number', 'contact_phone'],
    email: ['email', 'mail', 'email_address', 'contact_email'],
    latitude: ['latitude', 'lat', 'geo_lat'],
    longitude: ['longitude', 'lng', 'long', 'geo_lng', 'geo_long'],
    description: ['description', 'content.rendered', 'excerpt.rendered', 'summary'],
    age_category: ['age', 'age_category', 'age_restriction', 'age_restricted'],
    community_type: ['type', 'community_type', 'park_type'],
  };

  const propertyPatterns: Record<string, string[]> = {
    name: ['title.rendered', 'name', 'listing_title'],
    address: ['address', 'full_address', 'street', 'street_address'],
    lot_number: ['lot', 'lot_number', 'lot_num', 'site_number', 'unit', 'unit_number'],
    city: ['city', 'town'],
    state: ['state', 'province'],
    zip: ['zip', 'zipcode', 'postal', 'postal_code'],
    price: ['price', 'asking_price', 'list_price', 'sale_price'],
    price_type: ['price_type', 'listing_type', 'sale_type'],
    beds: ['beds', 'bedrooms', 'bed', 'bedroom'],
    baths: ['baths', 'bathrooms', 'bath', 'bathroom'],
    sqft: ['sqft', 'square_feet', 'sq_ft', 'square_footage', 'size'],
    year_built: ['year_built', 'year', 'built'],
    status: ['status', 'listing_status', 'availability'],
    description: ['description', 'content.rendered', 'excerpt.rendered', 'summary', 'details'],
    features: ['features', 'amenities', 'highlights'],
  };

  const patterns = type === 'community' ? communityPatterns : propertyPatterns;

  for (const [targetField, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      // First try exact match
      const exactMatch = availableFields.find(
        f => f.path.toLowerCase() === keyword && !usedPaths.has(f.path)
      );
      if (exactMatch) {
        suggestions[targetField] = exactMatch.path;
        usedPaths.add(exactMatch.path);
        break;
      }

      // Then try ends-with match (for ACF fields like acf.community_city)
      const suffixMatch = availableFields.find(
        f => (f.path.toLowerCase().endsWith(`.${keyword}`) || 
              f.path.toLowerCase().endsWith(`_${keyword}`)) &&
             !usedPaths.has(f.path)
      );
      if (suffixMatch) {
        suggestions[targetField] = suffixMatch.path;
        usedPaths.add(suffixMatch.path);
        break;
      }

      // Finally try contains match
      const containsMatch = availableFields.find(
        f => f.path.toLowerCase().includes(keyword) && !usedPaths.has(f.path)
      );
      if (containsMatch) {
        suggestions[targetField] = containsMatch.path;
        usedPaths.add(containsMatch.path);
        break;
      }
    }
  }

  return suggestions;
}

/**
 * Fetch a sample post from an endpoint and extract available fields for mapping
 */
async function fetchSamplePostForMapping(
  siteUrl: string,
  endpoint: string,
  type: 'community' | 'property'
): Promise<SamplePostResult> {
  const normalizedUrl = siteUrl.replace(/\/$/, '');

  try {
    const apiUrl = `${normalizedUrl}/wp-json/wp/v2/${endpoint}?per_page=1`;
    console.log(`Fetching sample post for field mapping: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        availableFields: [],
        suggestedMappings: {},
        error: `Endpoint /${endpoint} returned status ${response.status}`,
      };
    }

    const posts = await response.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      return {
        success: false,
        availableFields: [],
        suggestedMappings: {},
        error: 'No posts found in this endpoint',
      };
    }

    const sample = posts[0];
    const title = sample.title?.rendered || sample.name || `Post #${sample.id}`;

    // Flatten the post object to get all available fields
    const availableFields = flattenObject(sample);

    // Sort fields: title first, then acf fields, then others
    availableFields.sort((a, b) => {
      const aIsTitle = a.path.startsWith('title');
      const bIsTitle = b.path.startsWith('title');
      const aIsAcf = a.path.startsWith('acf');
      const bIsAcf = b.path.startsWith('acf');

      if (aIsTitle && !bIsTitle) return -1;
      if (!aIsTitle && bIsTitle) return 1;
      if (aIsAcf && !bIsAcf) return -1;
      if (!aIsAcf && bIsAcf) return 1;
      return a.path.localeCompare(b.path);
    });

    // Generate suggested mappings
    const suggestedMappings = generateSuggestedMappings(availableFields, type);

    console.log(`Found ${availableFields.length} fields, suggested ${Object.keys(suggestedMappings).length} mappings`);

    return {
      success: true,
      samplePost: { id: sample.id, title: decodeHtmlEntities(title) },
      availableFields,
      suggestedMappings,
    };
  } catch (error: unknown) {
    console.error('Error fetching sample post:', error);
    return {
      success: false,
      availableFields: [],
      suggestedMappings: {},
      error: error instanceof Error ? error.message : 'Failed to fetch sample post',
    };
  }
}

/**
 * Fetch communities from WordPress with optional incremental sync
 */
async function fetchWordPressCommunities(
  siteUrl: string, 
  endpoint: string,
  modifiedAfter?: string
): Promise<WordPressCommunity[]> {
  const normalizedUrl = siteUrl.replace(/\/$/, '');
  const communities: WordPressCommunity[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    let apiUrl = `${normalizedUrl}/wp-json/wp/v2/${endpoint}?per_page=${perPage}&page=${page}&_embed`;
    
    // Add modified_after for incremental sync
    if (modifiedAfter) {
      apiUrl += `&modified_after=${encodeURIComponent(modifiedAfter)}`;
    }
    
    console.log(`Fetching WordPress communities page ${page}: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 400 && page > 1) {
        break;
      }
      throw new Error(`WordPress API error: ${response.status} for endpoint /${endpoint}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    communities.push(...data);

    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  return communities;
}

/**
 * Fetch taxonomy terms - tries multiple possible taxonomy names
 */
async function fetchTaxonomyTerms(
  siteUrl: string, 
  communityEndpoint: string
): Promise<Map<string, number>> {
  const normalizedUrl = siteUrl.replace(/\/$/, '');
  const slugToTermId = new Map<string, number>();
  
  // Try common taxonomy naming patterns based on the endpoint
  const taxonomiesToTry = [
    `${communityEndpoint}_category`,
    `home_${communityEndpoint}`,
    'home_community',
    communityEndpoint,
  ];
  
  for (const taxonomy of taxonomiesToTry) {
    let page = 1;
    const perPage = 100;
    let foundTerms = false;

    while (true) {
      const apiUrl = `${normalizedUrl}/wp-json/wp/v2/${taxonomy}?per_page=${perPage}&page=${page}`;
      
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Pilot/1.0',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Taxonomy doesn't exist, try next one
            break;
          }
          if (response.status === 400 && page > 1) {
            break;
          }
          break;
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          break;
        }

        foundTerms = true;
        for (const term of data) {
          if (term.slug && term.id) {
            slugToTermId.set(term.slug, term.id);
          }
        }

        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
        if (page >= totalPages) {
          break;
        }

        page++;
      } catch {
        break;
      }
    }
    
    if (foundTerms) {
      console.log(`Found taxonomy terms at /${taxonomy}: ${slugToTermId.size} terms`);
      break;
    }
  }

  return slugToTermId;
}

/**
 * Sync communities to locations with batching and content hashing
 */
async function syncCommunitiesToLocations(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  userId: string,
  communities: WordPressCommunity[],
  taxonomyTerms: Map<string, number>,
  isIncremental: boolean,
  useAiExtraction: boolean = false,
  fieldMappings?: Record<string, string>
): Promise<SyncResult> {
  const result: SyncResult = { 
    created: 0, 
    updated: 0, 
    deleted: 0, 
    unchanged: 0, 
    errors: [],
    sync_type: isIncremental ? 'incremental' : 'full'
  };
  
  // Get IDs of communities from WordPress
  const wpCommunityIds = communities.map(c => c.id);
  
  // OPTIMIZATION: Batch fetch all existing WordPress locations for this agent
  const { data: existingLocations } = await supabase
    .from('locations')
    .select('id, wordpress_community_id, content_hash')
    .eq('agent_id', agentId)
    .not('wordpress_community_id', 'is', null);
  
  // Build lookup map for O(1) access
  const existingMap = new Map(
    (existingLocations || []).map(loc => [loc.wordpress_community_id, loc])
  );
  
  // Delete locations that no longer exist in WordPress (only for full sync)
  if (!isIncremental) {
    const wpCommunityIdSet = new Set(wpCommunityIds);
    for (const loc of existingLocations || []) {
      if (!wpCommunityIdSet.has(loc.wordpress_community_id)) {
        const { error: deleteError } = await supabase
          .from('locations')
          .delete()
          .eq('id', loc.id);
        
        if (deleteError) {
          result.errors.push(`Failed to delete orphan location ${loc.id}: ${deleteError.message}`);
        } else {
          result.deleted++;
          console.log(`🗑️ Deleted orphaned location (WP ID ${loc.wordpress_community_id} no longer exists)`);
        }
      }
    }
  }

  // Log if using field mappings
  if (fieldMappings && Object.keys(fieldMappings).length > 0) {
    console.log(`📋 Using custom field mappings: ${JSON.stringify(fieldMappings)}`);
  }

  // Create/update locations from WordPress
  for (const community of communities) {
    try {
      let name: string | null = null;
      let address: string | null = null;
      let city: string | null = null;
      let state: string | null = null;
      let zip: string | null = null;
      let phone: string | null = null;
      let email: string | null = null;
      let latitude: number | null = null;
      let longitude: number | null = null;
      let description: string | null = null;
      let ageCategory: string | null = null;
      let communityType: string | null = null;
      
      const acf = community.acf;
      
      // PRIORITY 1: Use explicit field mappings if provided
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        name = getValueByPath(community, fieldMappings.name) as string | null;
        address = getValueByPath(community, fieldMappings.address) as string | null;
        city = getValueByPath(community, fieldMappings.city) as string | null;
        state = getValueByPath(community, fieldMappings.state) as string | null;
        zip = getValueByPath(community, fieldMappings.zip) as string | null;
        phone = getValueByPath(community, fieldMappings.phone) as string | null;
        email = getValueByPath(community, fieldMappings.email) as string | null;
        const latValue = getValueByPath(community, fieldMappings.latitude);
        latitude = latValue != null ? parseFloat(String(latValue)) : null;
        if (latitude != null && isNaN(latitude)) latitude = null;
        const lngValue = getValueByPath(community, fieldMappings.longitude);
        longitude = lngValue != null ? parseFloat(String(lngValue)) : null;
        if (longitude != null && isNaN(longitude)) longitude = null;
        description = getValueByPath(community, fieldMappings.description) as string | null;
        ageCategory = getValueByPath(community, fieldMappings.age_category) as string | null;
        communityType = getValueByPath(community, fieldMappings.community_type) as string | null;
      }
      
      // PRIORITY 2: Use AI extraction if enabled and fields not already filled
      if (useAiExtraction) {
        console.log(`🤖 Using AI extraction for community: ${community.slug}`);
        const aiData = await extractCommunityData(community);
        
        if (aiData) {
          if (!address) address = aiData.address || null;
          if (!city) city = aiData.city || null;
          if (!state) state = aiData.state || null;
          if (!zip) zip = aiData.zip || null;
          if (!phone) phone = aiData.phone || null;
          if (!email) email = aiData.email || null;
          if (latitude == null) latitude = aiData.latitude || null;
          if (longitude == null) longitude = aiData.longitude || null;
          if (!description) description = aiData.description || null;
        }
      }
      
      // PRIORITY 3: Fall back to keyword-based ACF extraction
      if (!name) name = decodeHtmlEntities(community.title.rendered);
      if (!address) address = extractAcfField(acf, 'full_address', 'address', 'street');
      if (!city) city = extractAcfField(acf, 'city');
      if (!state) state = extractAcfField(acf, 'state');
      if (!zip) zip = extractAcfField(acf, 'zip', 'zipcode', 'postal', 'postal_code') || extractZipFromAddress(address);
      if (!phone) phone = extractAcfField(acf, 'phone', 'telephone', 'tel', 'phone_number');
      if (!email) email = extractAcfField(acf, 'email', 'mail', 'email_address', 'contact_email', 'e_mail');
      if (latitude == null) latitude = extractAcfNumber(acf, 'latitude', 'lat');
      if (longitude == null) longitude = extractAcfNumber(acf, 'longitude', 'lng', 'long');
      if (!ageCategory) ageCategory = extractAcfField(acf, 'age', 'age_category', 'age_restriction');
      if (!communityType) communityType = extractAcfField(acf, 'type', 'community_type');
      
      const timezone = inferTimezone(state, latitude, longitude);
      
      const metadata: Record<string, unknown> = {};
      if (latitude != null) metadata.latitude = latitude;
      if (longitude != null) metadata.longitude = longitude;
      if (description) metadata.description = description;
      if (ageCategory) metadata.age_category = ageCategory;
      if (communityType) metadata.community_type = communityType;

      const termId = findMatchingTermId(taxonomyTerms, community.slug);
      
      // Use mapped name or default to title
      const finalName = name || decodeHtmlEntities(community.title.rendered);
      
      // Data to be hashed for change detection
      const hashableData = {
        name: finalName,
        address,
        city,
        state,
        zip,
        phone,
        email,
        timezone,
        metadata,
        wordpress_slug: community.slug,
        wordpress_community_term_id: termId,
      };
      
      const contentHash = generateContentHash(hashableData);

      const locationData = {
        agent_id: agentId,
        user_id: userId,
        name: finalName,
        wordpress_community_id: community.id,
        wordpress_community_term_id: termId || null,
        wordpress_slug: community.slug,
        address,
        city,
        state,
        zip,
        phone,
        email,
        timezone,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        content_hash: contentHash,
        updated_at: new Date().toISOString(),
      };

      // Check if location already exists using our lookup map
      const existing = existingMap.get(community.id);

      if (existing) {
        // OPTIMIZATION: Skip update if content hash matches
        if (existing.content_hash === contentHash) {
          result.unchanged++;
          continue;
        }
        
        // Update existing location
        const { error: updateError } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', existing.id);

        if (updateError) {
          result.errors.push(`Failed to update ${community.slug}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      } else {
        // Create new location
        const { error: insertError } = await supabase
          .from('locations')
          .insert(locationData);

        if (insertError) {
          result.errors.push(`Failed to create ${community.slug}: ${insertError.message}`);
        } else {
          result.created++;
        }
      }
    } catch (error: unknown) {
      result.errors.push(`Error processing ${community.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D');
}
