/**
 * Sync WordPress Homes Edge Function
 * 
 * Fetches homes from a WordPress REST API and upserts them as properties.
 * Supports AI extraction fallback for non-ACF WordPress sites.
 * 
 * @module functions/sync-wordpress-homes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressConfig {
  site_url: string;
  last_home_sync?: string;
  home_count?: number;
  last_community_sync?: string;
  community_count?: number;
}

interface WordPressHome {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content?: { rendered: string };
  excerpt?: { rendered: string };
  home_community?: number[]; // Taxonomy relation
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
  };
  acf?: Record<string, unknown>;
}

/**
 * Intelligently extract a field from ACF data by searching for keywords
 * Handles prefixed fields like "home_address" when looking for "address"
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
    
    // Priority 2: Ends with keyword (e.g., "home_address" ends with "address")
    const suffixMatch = keys.find(k => k.toLowerCase().endsWith(`_${lowerKeyword}`) || k.toLowerCase().endsWith(lowerKeyword));
    if (suffixMatch && acf[suffixMatch] != null && acf[suffixMatch] !== '') {
      return String(acf[suffixMatch]);
    }
    
    // Priority 3: Contains keyword (e.g., "square_feet" contains "sqft" via alt keywords)
    const containsMatch = keys.find(k => k.toLowerCase().includes(lowerKeyword));
    if (containsMatch && acf[containsMatch] != null && acf[containsMatch] !== '') {
      return String(acf[containsMatch]);
    }
  }
  
  return null;
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
 * Extract array field from ACF data
 */
function extractAcfArray(acf: Record<string, unknown> | undefined, ...keywords: string[]): string[] {
  if (!acf) return [];
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Try to find matching array field
    const match = keys.find(k => {
      const lowerK = k.toLowerCase();
      return lowerK === lowerKeyword || 
             lowerK.endsWith(`_${lowerKeyword}`) || 
             lowerK.includes(lowerKeyword);
    });
    
    if (match && Array.isArray(acf[match])) {
      return acf[match] as string[];
    }
  }
  
  return [];
}

/**
 * Infer timezone from state - supports abbreviations and full names
 * Uses latitude/longitude if available for more accuracy
 */
function inferTimezone(
  state: string | null, 
  latitude?: number | null, 
  longitude?: number | null
): string {
  // If we have coordinates, use longitude-based detection (more accurate)
  if (longitude != null) {
    // Rough US timezone boundaries by longitude
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
  
  // Eastern Time
  const eastern = ['ct', 'connecticut', 'de', 'delaware', 'fl', 'florida', 'ga', 'georgia', 
    'me', 'maine', 'md', 'maryland', 'ma', 'massachusetts', 'mi', 'michigan', 
    'nh', 'new hampshire', 'nj', 'new jersey', 'ny', 'new york', 'nc', 'north carolina',
    'oh', 'ohio', 'pa', 'pennsylvania', 'ri', 'rhode island', 'sc', 'south carolina',
    'vt', 'vermont', 'va', 'virginia', 'wv', 'west virginia', 'dc', 'district of columbia'];
  
  // Central Time
  const central = ['al', 'alabama', 'ar', 'arkansas', 'il', 'illinois', 'ia', 'iowa',
    'ks', 'kansas', 'ky', 'kentucky', 'la', 'louisiana', 'mn', 'minnesota', 
    'ms', 'mississippi', 'mo', 'missouri', 'ne', 'nebraska', 'nd', 'north dakota',
    'ok', 'oklahoma', 'sd', 'south dakota', 'tn', 'tennessee', 'tx', 'texas', 'wi', 'wisconsin'];
  
  // Mountain Time
  const mountain = ['co', 'colorado', 'id', 'idaho', 'mt', 'montana', 'nm', 'new mexico',
    'ut', 'utah', 'wy', 'wyoming'];
  
  // Pacific Time
  const pacific = ['ca', 'california', 'nv', 'nevada', 'or', 'oregon', 'wa', 'washington'];
  
  // Special cases
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
 * Extract ZIP code from full address if not provided separately
 */
function extractZipFromAddress(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(-\d{4})?\b/);
  return match ? match[1] : null;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ExtractedProperty {
  external_id: string;
  address?: string;
  lot_number?: string;
  city?: string;
  state?: string;
  zip?: string;
  status?: string;
  price?: number;
  price_type?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  description?: string;
  features?: string[];
  images?: Array<{ url: string; alt?: string }>;
  listing_url?: string;
}

/**
 * Normalize WordPress site URL by stripping API paths if user entered full endpoint
 */
function normalizeSiteUrl(url: string): string {
  let normalized = url.trim();
  
  // Add https if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  // Strip common WordPress REST API paths if user entered full endpoint
  const pathsToStrip = [
    '/wp-json/wp/v2/home',
    '/wp-json/wp/v2/homes',
    '/wp-json/wp/v2/property',
    '/wp-json/wp/v2/properties',
    '/wp-json/wp/v2/listing',
    '/wp-json/wp/v2/listings',
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, agentId, siteUrl, useAiExtraction } = await req.json();

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

    // Check account access (owner or team member) - direct check since RPC uses auth.uid() which isn't set with service role
    let hasAccess = user.id === agent.user_id;
    
    if (!hasAccess) {
      // Check if user is a team member
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('owner_id', agent.user_id)
        .eq('member_id', user.id)
        .maybeSingle();
      
      hasAccess = !!teamMember;
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle test action
    if (action === 'test') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      const testResult = await testWordPressHomesEndpoint(normalizedUrl);
      return new Response(
        JSON.stringify(testResult),
        { status: testResult.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle sync action
    if (action === 'sync') {
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const urlToSync = normalizeSiteUrl(siteUrl || wpConfig?.site_url || '');
      
      if (!urlToSync) {
        return new Response(
          JSON.stringify({ error: 'No WordPress site URL configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Starting WordPress homes sync for agent ${agentId} from ${urlToSync}`);

      // Get or create WordPress knowledge source
      const knowledgeSourceId = await getOrCreateWordPressSource(
        supabase,
        agentId,
        agent.user_id,
        urlToSync
      );

      // Get ALL locations for mapping (by WordPress community ID, city/state, or name)
      const { data: locations } = await supabase
        .from('locations')
        .select('id, wordpress_community_id, city, state, name')
        .eq('agent_id', agentId);

      // Build WordPress community ID -> location ID map
      const communityIdMap = new Map<number, string>();
      // Build city+state -> location ID map for fallback matching
      const cityStateMap = new Map<string, string>();
      // Build location name -> location ID map for community name matching
      const nameMap = new Map<string, string>();
      
      for (const loc of locations || []) {
        if (loc.wordpress_community_id) {
          communityIdMap.set(loc.wordpress_community_id, loc.id);
        }
        if (loc.city && loc.state) {
          const key = `${loc.city.toLowerCase().trim()}|${loc.state.toLowerCase().trim()}`;
          cityStateMap.set(key, loc.id);
        }
        if (loc.name) {
          nameMap.set(loc.name.toLowerCase().trim(), loc.id);
        }
      }

      // Fetch homes from WordPress
      const homes = await fetchWordPressHomes(urlToSync);
      console.log(`Fetched ${homes.length} homes from WordPress`);

      let result: SyncResult;
      
      if (useAiExtraction) {
        // Use AI extraction for non-ACF sites
        const extractedProperties = await extractPropertiesWithAI(homes, urlToSync);
        result = await syncPropertiesToDatabase(
          supabase,
          agentId,
          knowledgeSourceId,
          { communityIdMap, cityStateMap, nameMap },
          extractedProperties,
          homes
        );
      } else {
        // Use direct ACF field mapping
        result = await syncHomesToProperties(
          supabase,
          agentId,
          knowledgeSourceId,
          { communityIdMap, cityStateMap, nameMap },
          homes
        );
      }

      // Update agent's deployment_config with sync info
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          site_url: urlToSync,
          last_home_sync: new Date().toISOString(),
          home_count: homes.length,
        },
      };

      await supabase
        .from('agents')
        .update({ deployment_config: updatedConfig })
        .eq('id', agentId);

      console.log(`WordPress homes sync completed: ${JSON.stringify(result)}`);

      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          total: homes.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "test" or "sync"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-wordpress-homes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Test if WordPress has a homes endpoint
 */
async function testWordPressHomesEndpoint(siteUrl: string): Promise<{ success: boolean; message: string; homeCount?: number }> {
  try {
    let formattedUrl = siteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    formattedUrl = formattedUrl.replace(/\/$/, '');

    // Try different home/property endpoints
    const endpoints = [
      '/wp-json/wp/v2/home',
      '/wp-json/wp/v2/homes',
      '/wp-json/wp/v2/property',
      '/wp-json/wp/v2/properties',
      '/wp-json/wp/v2/listing',
      '/wp-json/wp/v2/listings',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${formattedUrl}${endpoint}?per_page=1`, {
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          const total = response.headers.get('X-WP-Total');
          
          return {
            success: true,
            message: `Found homes endpoint at ${endpoint}`,
            homeCount: total ? parseInt(total, 10) : (Array.isArray(data) ? data.length : 0),
          };
        }
      } catch {
        continue;
      }
    }

    return {
      success: false,
      message: 'No homes/properties endpoint found. WordPress may not have property listings configured.',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to test connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Fetch all homes from WordPress REST API with pagination
 */
async function fetchWordPressHomes(siteUrl: string): Promise<WordPressHome[]> {
  let formattedUrl = siteUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  formattedUrl = formattedUrl.replace(/\/$/, '');

  const allHomes: WordPressHome[] = [];
  
  // Try different endpoints
  const endpoints = [
    '/wp-json/wp/v2/home',
    '/wp-json/wp/v2/homes',
    '/wp-json/wp/v2/property',
    '/wp-json/wp/v2/properties',
  ];

  let successfulEndpoint = '';
  
  for (const endpoint of endpoints) {
    try {
      const testResponse = await fetch(`${formattedUrl}${endpoint}?per_page=1`, {
        headers: { 'Accept': 'application/json' },
      });
      if (testResponse.ok) {
        successfulEndpoint = endpoint;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!successfulEndpoint) {
    console.log('No homes endpoint found');
    return [];
  }

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(
        `${formattedUrl}${successfulEndpoint}?per_page=100&page=${page}&_embed`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        hasMore = false;
        break;
      }

      const homes: WordPressHome[] = await response.json();
      
      if (homes.length === 0) {
        hasMore = false;
      } else {
        allHomes.push(...homes);
        page++;
        
        const totalPages = response.headers.get('X-WP-TotalPages');
        if (totalPages && page > parseInt(totalPages, 10)) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }

  return allHomes;
}

/**
 * Get or create a WordPress knowledge source for tracking
 */
async function getOrCreateWordPressSource(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  userId: string,
  siteUrl: string
): Promise<string> {
  // Check for existing WordPress source
  const { data: existing } = await supabase
    .from('knowledge_sources')
    .select('id')
    .eq('agent_id', agentId)
    .eq('source_type', 'wordpress_home')
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new knowledge source
  const { data: newSource, error } = await supabase
    .from('knowledge_sources')
    .insert({
      agent_id: agentId,
      user_id: userId,
      type: 'url',
      source_type: 'wordpress_home',
      source: siteUrl,
      status: 'ready',
      refresh_strategy: 'daily',
      metadata: {
        wordpress_homes: true,
        auto_created: true,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating WordPress knowledge source:', error);
    throw error;
  }

  return newSource.id;
}

/**
 * Map WordPress home status to our status enum
 */
function mapStatus(wpStatus?: string): string {
  if (!wpStatus) return 'available';
  
  const statusLower = wpStatus.toLowerCase();
  
  if (statusLower.includes('sold')) return 'sold';
  if (statusLower.includes('pending') || statusLower.includes('under contract')) return 'pending';
  if (statusLower.includes('rent')) return 'rented';
  if (statusLower.includes('coming') || statusLower.includes('soon')) return 'coming_soon';
  
  return 'available';
}

/**
 * Parse price from various formats
 */
function parsePrice(value?: number | string): number | null {
  if (value === undefined || value === null) return null;
  
  if (typeof value === 'number') {
    return Math.round(value * 100); // Convert to cents
  }
  
  // Remove currency symbols and commas
  const cleaned = value.toString().replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : Math.round(parsed * 100);
}

/**
 * Parse number fields
 */
function parseNumber(value?: number | string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extract images from WordPress home
 */
function extractImages(home: WordPressHome): Array<{ url: string; alt?: string }> {
  const images: Array<{ url: string; alt?: string }> = [];
  
  // Featured image from _embedded
  if (home._embedded?.['wp:featuredmedia']?.[0]) {
    const featured = home._embedded['wp:featuredmedia'][0];
    images.push({
      url: featured.source_url,
      alt: featured.alt_text,
    });
  }
  
  // ACF images/gallery
  if (home.acf?.images) {
    images.push(...home.acf.images);
  }
  if (home.acf?.gallery) {
    images.push(...home.acf.gallery);
  }
  
  return images;
}

interface LocationMaps {
  communityIdMap: Map<number, string>;
  cityStateMap: Map<string, string>;
  nameMap: Map<string, string>;
}

/**
 * Auto-match a property to a location using multiple strategies:
 * 1. WordPress community taxonomy ID (exact match)
 * 2. City + State (case-insensitive match)
 * 3. Community/location name (fuzzy match)
 */
function autoMatchLocation(
  locationMaps: LocationMaps,
  communityId: number | undefined,
  city: string | null,
  state: string | null,
  communityName?: string | null
): string | null {
  // Strategy 1: WordPress community ID (most reliable)
  if (communityId && locationMaps.communityIdMap.has(communityId)) {
    return locationMaps.communityIdMap.get(communityId)!;
  }
  
  // Strategy 2: City + State match
  if (city && state) {
    const key = `${city.toLowerCase().trim()}|${state.toLowerCase().trim()}`;
    if (locationMaps.cityStateMap.has(key)) {
      return locationMaps.cityStateMap.get(key)!;
    }
  }
  
  // Strategy 3: Community/location name match
  if (communityName) {
    const normalizedName = communityName.toLowerCase().trim();
    if (locationMaps.nameMap.has(normalizedName)) {
      return locationMaps.nameMap.get(normalizedName)!;
    }
    // Try partial match (community name contains location name or vice versa)
    for (const [locName, locId] of locationMaps.nameMap) {
      if (normalizedName.includes(locName) || locName.includes(normalizedName)) {
        return locId;
      }
    }
  }
  
  return null;
}

/**
 * Sync homes to properties table using ACF field mapping
 */
async function syncHomesToProperties(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  knowledgeSourceId: string,
  locationMaps: LocationMaps,
  homes: WordPressHome[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const home of homes) {
    try {
      const externalId = `wp_home_${home.id}`;
      
      const acf = home.acf;
      
      // Intelligently extract fields from ACF data
      const address = extractAcfField(acf, 'address', 'full_address', 'street') || decodeHtmlEntities(home.title.rendered);
      const city = extractAcfField(acf, 'city');
      const state = extractAcfField(acf, 'state');
      const zip = extractAcfField(acf, 'zip', 'zipcode', 'postal', 'postal_code') || extractZipFromAddress(address);
      const communityName = extractAcfField(acf, 'community', 'community_name', 'park', 'park_name');
      
      // Auto-match to location using multiple strategies
      const communityId = home.home_community?.[0];
      const locationId = autoMatchLocation(locationMaps, communityId, city, state, communityName);
      
      if (locationId) {
        console.log(`Matched property "${address}" to location ${locationId}`);
      }
      
      // Determine price type based on field names
      const rentPrice = extractAcfNumber(acf, 'rent', 'monthly_rent', 'rental');
      const salePrice = extractAcfNumber(acf, 'price', 'sale_price', 'asking_price');
      const price = rentPrice || salePrice;
      const priceType = rentPrice ? 'rent_monthly' : 'sale';
      
      const propertyData = {
        agent_id: agentId,
        knowledge_source_id: knowledgeSourceId,
        location_id: locationId,
        external_id: externalId,
        address,
        lot_number: extractAcfField(acf, 'lot', 'lot_number'),
        city,
        state,
        zip,
        status: mapStatus(extractAcfField(acf, 'status')),
        price: price ? Math.round(price * 100) : null, // Convert to cents
        price_type: priceType,
        beds: extractAcfNumber(acf, 'beds', 'bedrooms', 'bedroom'),
        baths: extractAcfNumber(acf, 'baths', 'bathrooms', 'bathroom'),
        sqft: extractAcfNumber(acf, 'sqft', 'square_feet', 'sq_ft', 'size'),
        year_built: extractAcfNumber(acf, 'year_built', 'year', 'built'),
        description: extractAcfField(acf, 'description') || stripHtml(home.content?.rendered || home.excerpt?.rendered || ''),
        features: extractAcfArray(acf, 'features', 'amenities'),
        images: extractImages(home),
        listing_url: home.link,
        last_seen_at: new Date().toISOString(),
      };

      // Check if property exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('knowledge_source_id', knowledgeSourceId)
        .eq('external_id', externalId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', existing.id);

        if (error) {
          result.errors.push(`Failed to update ${externalId}: ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            first_seen_at: new Date().toISOString(),
          });

        if (error) {
          result.errors.push(`Failed to create ${externalId}: ${error.message}`);
        } else {
          result.created++;
        }
      }
    } catch (error) {
      result.errors.push(`Error processing home ${home.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return result;
}

/**
 * Use AI to extract property data from WordPress homes
 */
async function extractPropertiesWithAI(
  homes: WordPressHome[],
  siteUrl: string
): Promise<ExtractedProperty[]> {
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openrouterKey) {
    console.warn('OPENROUTER_API_KEY not set, falling back to direct mapping');
    return homes.map(home => ({
      external_id: `wp_home_${home.id}`,
      address: decodeHtmlEntities(home.title.rendered),
      listing_url: home.link,
      description: stripHtml(home.content?.rendered || home.excerpt?.rendered || ''),
      images: extractImages(home),
    }));
  }

  // Batch homes for efficiency (max 10 per request)
  const batches: WordPressHome[][] = [];
  for (let i = 0; i < homes.length; i += 10) {
    batches.push(homes.slice(i, i + 10));
  }

  const allProperties: ExtractedProperty[] = [];

  for (const batch of batches) {
    try {
      const homesData = batch.map(home => ({
        id: home.id,
        title: decodeHtmlEntities(home.title.rendered),
        content: stripHtml(home.content?.rendered || ''),
        excerpt: stripHtml(home.excerpt?.rendered || ''),
        link: home.link,
        acf: home.acf,
      }));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a property listing data extractor. Extract structured property data from WordPress home listings.
              
For each home, extract:
- address: Full street address
- lot_number: Lot or unit number if mentioned
- city, state, zip: Location details
- status: One of: available, pending, sold, rented, coming_soon
- price: Numeric price in dollars (no commas/symbols)
- price_type: sale, rent_monthly, or rent_weekly
- beds: Number of bedrooms
- baths: Number of bathrooms (can be decimal like 1.5)
- sqft: Square footage
- year_built: Year the home was built
- description: Brief property description
- features: Array of features/amenities

Return a JSON array of extracted properties.`,
            },
            {
              role: 'user',
              content: `Extract property data from these homes:\n\n${JSON.stringify(homesData, null, 2)}`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 4000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        console.error('AI extraction failed:', await response.text());
        // Fall back to basic extraction for this batch
        allProperties.push(...batch.map(home => ({
          external_id: `wp_home_${home.id}`,
          address: decodeHtmlEntities(home.title.rendered),
          listing_url: home.link,
          images: extractImages(home),
        })));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsed = JSON.parse(content);
          const properties = parsed.properties || parsed;
          
          if (Array.isArray(properties)) {
            for (let i = 0; i < properties.length && i < batch.length; i++) {
              const prop = properties[i];
              const home = batch[i];
              
              allProperties.push({
                external_id: `wp_home_${home.id}`,
                address: prop.address || decodeHtmlEntities(home.title.rendered),
                lot_number: prop.lot_number,
                city: prop.city,
                state: prop.state,
                zip: prop.zip,
                status: prop.status,
                price: prop.price ? Math.round(prop.price * 100) : undefined,
                price_type: prop.price_type,
                beds: prop.beds,
                baths: prop.baths,
                sqft: prop.sqft,
                year_built: prop.year_built,
                description: prop.description,
                features: prop.features,
                images: extractImages(home),
                listing_url: home.link,
              });
            }
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          // Fall back to basic extraction
          allProperties.push(...batch.map(home => ({
            external_id: `wp_home_${home.id}`,
            address: decodeHtmlEntities(home.title.rendered),
            listing_url: home.link,
            images: extractImages(home),
          })));
        }
      }
    } catch (error) {
      console.error('AI extraction batch error:', error);
      // Fall back to basic extraction for this batch
      allProperties.push(...batch.map(home => ({
        external_id: `wp_home_${home.id}`,
        address: decodeHtmlEntities(home.title.rendered),
        listing_url: home.link,
        images: extractImages(home),
      })));
    }
  }

  return allProperties;
}

/**
 * Sync AI-extracted properties to database
 */
async function syncPropertiesToDatabase(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  knowledgeSourceId: string,
  locationMaps: LocationMaps,
  properties: ExtractedProperty[],
  homes: WordPressHome[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // Create a map of external_id to home for location lookup
  const homeMap = new Map<string, WordPressHome>();
  for (const home of homes) {
    homeMap.set(`wp_home_${home.id}`, home);
  }

  for (const prop of properties) {
    try {
      const home = homeMap.get(prop.external_id);
      const communityId = home?.home_community?.[0];
      
      // Auto-match to location using multiple strategies
      const locationId = autoMatchLocation(
        locationMaps, 
        communityId, 
        prop.city || null, 
        prop.state || null,
        null // AI extraction doesn't have community name
      );
      
      if (locationId) {
        console.log(`Matched AI-extracted property "${prop.address}" to location ${locationId}`);
      }

      const propertyData = {
        agent_id: agentId,
        knowledge_source_id: knowledgeSourceId,
        location_id: locationId,
        external_id: prop.external_id,
        address: prop.address,
        lot_number: prop.lot_number,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        status: prop.status || 'available',
        price: prop.price,
        price_type: prop.price_type || 'sale',
        beds: prop.beds,
        baths: prop.baths,
        sqft: prop.sqft,
        year_built: prop.year_built,
        description: prop.description,
        features: prop.features || [],
        images: prop.images || [],
        listing_url: prop.listing_url,
        last_seen_at: new Date().toISOString(),
      };

      // Check if property exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('knowledge_source_id', knowledgeSourceId)
        .eq('external_id', prop.external_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', existing.id);

        if (error) {
          result.errors.push(`Failed to update ${prop.external_id}: ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        const { error } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            first_seen_at: new Date().toISOString(),
          });

        if (error) {
          result.errors.push(`Failed to create ${prop.external_id}: ${error.message}`);
        } else {
          result.created++;
        }
      }
    } catch (error) {
      result.errors.push(`Error processing ${prop.external_id}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return result;
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Decode HTML entities
 */
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
