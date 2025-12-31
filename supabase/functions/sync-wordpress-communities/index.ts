/**
 * Sync WordPress Communities Edge Function
 * 
 * Fetches communities from a WordPress REST API and upserts them as locations.
 * Supports both testing connection and full sync operations.
 * 
 * @module functions/sync-wordpress-communities
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
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
 * Auto-detect available custom post types from WordPress REST API root
 */
async function discoverEndpoints(siteUrl: string): Promise<{
  communityEndpoints: DiscoveredEndpoint[];
  homeEndpoints: DiscoveredEndpoint[];
}> {
  const normalizedUrl = normalizeSiteUrl(siteUrl);
  const communityEndpoints: DiscoveredEndpoint[] = [];
  const homeEndpoints: DiscoveredEndpoint[] = [];
  
  try {
    // Fetch WordPress REST API root to discover available endpoints
    const response = await fetch(`${normalizedUrl}/wp-json/wp/v2`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });
    
    if (!response.ok) {
      console.log(`Could not fetch /wp-json/wp/v2: ${response.status}`);
      return { communityEndpoints, homeEndpoints };
    }
    
    const data = await response.json();
    
    // WordPress REST API v2 returns available routes
    // We need to check /wp-json to get post types
    const rootResponse = await fetch(`${normalizedUrl}/wp-json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pilot/1.0',
      },
    });
    
    if (!rootResponse.ok) {
      return { communityEndpoints, homeEndpoints };
    }
    
    const rootData = await rootResponse.json();
    const routes = rootData.routes || {};
    
    // Community-related keywords
    const communityKeywords = ['community', 'communities', 'location', 'locations', 'site', 'sites', 'park', 'parks'];
    // Home/property-related keywords
    const homeKeywords = ['home', 'homes', 'property', 'properties', 'listing', 'listings', 'house', 'houses', 'unit', 'units'];
    
    // Check each route for custom post types
    for (const [route, info] of Object.entries(routes)) {
      // Routes look like /wp/v2/community
      const match = route.match(/^\/wp\/v2\/([a-z0-9_-]+)$/i);
      if (!match) continue;
      
      const slug = match[1];
      const routeInfo = info as { namespace?: string; methods?: string[] };
      
      // Skip WordPress core types
      const coreTypes = ['posts', 'pages', 'media', 'blocks', 'templates', 'template-parts', 'navigation', 'comments', 'search', 'categories', 'tags', 'users', 'settings', 'themes', 'plugins', 'block-types', 'block-patterns', 'block-directory'];
      if (coreTypes.includes(slug)) continue;
      
      const endpoint: DiscoveredEndpoint = {
        slug,
        name: slug.replace(/-/g, ' ').replace(/_/g, ' '),
        rest_base: slug,
      };
      
      // Categorize the endpoint
      const lowerSlug = slug.toLowerCase();
      if (communityKeywords.some(k => lowerSlug.includes(k))) {
        communityEndpoints.push(endpoint);
      } else if (homeKeywords.some(k => lowerSlug.includes(k))) {
        homeEndpoints.push(endpoint);
      }
    }
    
    console.log(`Discovered ${communityEndpoints.length} community endpoints, ${homeEndpoints.length} home endpoints`);
  } catch (error) {
    console.error('Error discovering endpoints:', error);
  }
  
  return { communityEndpoints, homeEndpoints };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const isScheduledSync = req.headers.get('x-scheduled-sync') === 'true';
    let userId: string | null = null;
    
    if (!isScheduledSync) {
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
      
      userId = user.id;
    }

    const { action, agentId, siteUrl, communityEndpoint, homeEndpoint, communitySyncInterval, homeSyncInterval, deleteLocations } = await req.json();

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

    if (!isScheduledSync && userId) {
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
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const urlToSync = normalizeSiteUrl(siteUrl || wpConfig?.site_url || '');
      // Use provided endpoint, or stored config, or default to 'community'
      const endpoint = communityEndpoint || wpConfig?.community_endpoint || 'community';
      
      if (!urlToSync) {
        return new Response(
          JSON.stringify({ error: 'No WordPress site URL configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Starting WordPress community sync for agent ${agentId} from ${urlToSync} using endpoint /${endpoint}`);

      // Fetch communities from WordPress using the configured endpoint
      const communities = await fetchWordPressCommunities(urlToSync, endpoint);
      console.log(`Fetched ${communities.length} communities from WordPress`);

      // Fetch taxonomy terms (try endpoint-based name first, then common names)
      const taxonomyTerms = await fetchTaxonomyTerms(urlToSync, endpoint);
      console.log(`Fetched ${taxonomyTerms.size} taxonomy terms`);

      // Sync communities to locations (hard delete approach)
      const result = await syncCommunitiesToLocations(
        supabase,
        agentId,
        agent.user_id,
        communities,
        taxonomyTerms
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

      console.log(`Sync complete: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`);

      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          total: communities.length,
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
      JSON.stringify({ error: 'Invalid action. Use "test", "sync", "save", "discover", or "disconnect"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-wordpress-communities:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testWordPressConnection(
  siteUrl: string, 
  endpoint: string
): Promise<{ success: boolean; message: string; communityCount?: number }> {
  try {
    const normalizedUrl = siteUrl.replace(/\/$/, '');
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
          message: `Endpoint "/${endpoint}" not found. Try a different custom post type slug or use auto-detect.` 
        };
      }
      return { success: false, message: `WordPress API returned status ${response.status}` };
    }

    const totalCount = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { success: false, message: 'Invalid response format from WordPress API' };
    }

    return { 
      success: true, 
      message: `Found ${totalCount} items at /${endpoint}`,
      communityCount: totalCount,
    };
  } catch (error) {
    console.error('WordPress connection test error:', error);
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}

async function fetchWordPressCommunities(
  siteUrl: string, 
  endpoint: string
): Promise<WordPressCommunity[]> {
  const normalizedUrl = siteUrl.replace(/\/$/, '');
  const communities: WordPressCommunity[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const apiUrl = `${normalizedUrl}/wp-json/wp/v2/${endpoint}?per_page=${perPage}&page=${page}&_embed`;
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

async function syncCommunitiesToLocations(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  userId: string,
  communities: WordPressCommunity[],
  taxonomyTerms: Map<string, number>
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] };
  
  // Get IDs of communities from WordPress
  const wpCommunityIds = new Set(communities.map(c => c.id));
  
  // Get existing WordPress locations for this agent
  const { data: existingLocations } = await supabase
    .from('locations')
    .select('id, wordpress_community_id')
    .eq('agent_id', agentId)
    .not('wordpress_community_id', 'is', null);
  
  // Delete locations that no longer exist in WordPress (hard delete)
  for (const loc of existingLocations || []) {
    if (!wpCommunityIds.has(loc.wordpress_community_id)) {
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

  // Create/update locations from WordPress
  for (const community of communities) {
    try {
      const acf = community.acf;
      const address = extractAcfField(acf, 'full_address', 'address', 'street');
      const city = extractAcfField(acf, 'city');
      const state = extractAcfField(acf, 'state');
      const zip = extractAcfField(acf, 'zip', 'zipcode', 'postal', 'postal_code') || extractZipFromAddress(address);
      const phone = extractAcfField(acf, 'phone', 'telephone', 'tel', 'phone_number');
      const email = extractAcfField(acf, 'email', 'mail', 'email_address', 'contact_email', 'e_mail');
      const latitude = extractAcfNumber(acf, 'latitude', 'lat');
      const longitude = extractAcfNumber(acf, 'longitude', 'lng', 'long');
      
      const timezone = inferTimezone(state, latitude, longitude);
      
      const metadata: Record<string, unknown> = {};
      if (latitude != null) metadata.latitude = latitude;
      if (longitude != null) metadata.longitude = longitude;
      const ageCategory = extractAcfField(acf, 'age', 'age_category', 'age_restriction');
      if (ageCategory) metadata.age_category = ageCategory;
      const communityType = extractAcfField(acf, 'type', 'community_type');
      if (communityType) metadata.community_type = communityType;

      const termId = findMatchingTermId(taxonomyTerms, community.slug);

      const locationData = {
        agent_id: agentId,
        user_id: userId,
        name: decodeHtmlEntities(community.title.rendered),
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
        updated_at: new Date().toISOString(),
      };

      // Check if location already exists
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('agent_id', agentId)
        .eq('wordpress_community_id', community.id)
        .maybeSingle();

      if (existing) {
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
    } catch (error) {
      result.errors.push(`Error processing ${community.slug}: ${error.message}`);
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
