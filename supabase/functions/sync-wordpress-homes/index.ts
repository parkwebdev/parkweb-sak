/**
 * Sync WordPress Homes Edge Function
 * 
 * Fetches homes from a WordPress REST API and upserts them as properties.
 * Supports configurable endpoints and AI extraction fallback.
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
  community_endpoint?: string;
  home_endpoint?: string;
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
  home_community?: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
  };
  acf?: Record<string, unknown>;
}

/**
 * Intelligently extract a field from ACF data
 */
function extractAcfField(acf: Record<string, unknown> | undefined, ...keywords: string[]): string | null {
  if (!acf) return null;
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    const exactMatch = keys.find(k => k.toLowerCase() === lowerKeyword);
    if (exactMatch && acf[exactMatch] != null && acf[exactMatch] !== '') {
      return String(acf[exactMatch]);
    }
    
    const suffixMatch = keys.find(k => k.toLowerCase().endsWith(`_${lowerKeyword}`) || k.toLowerCase().endsWith(lowerKeyword));
    if (suffixMatch && acf[suffixMatch] != null && acf[suffixMatch] !== '') {
      return String(acf[suffixMatch]);
    }
    
    const containsMatch = keys.find(k => k.toLowerCase().includes(lowerKeyword));
    if (containsMatch && acf[containsMatch] != null && acf[containsMatch] !== '') {
      return String(acf[containsMatch]);
    }
  }
  
  return null;
}

function extractAcfNumber(acf: Record<string, unknown> | undefined, ...keywords: string[]): number | null {
  const value = extractAcfField(acf, ...keywords);
  if (!value) return null;
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

function extractAcfArray(acf: Record<string, unknown> | undefined, ...keywords: string[]): string[] {
  if (!acf) return [];
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
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

interface LocationMaps {
  termIdMap: Map<number, string>;
}

function normalizeSiteUrl(url: string): string {
  let normalized = url.trim();
  
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  
  normalized = normalized.replace(/\/$/, '');
  
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

    const { action, agentId, siteUrl, homeEndpoint, useAiExtraction } = await req.json();

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

    // Handle test action
    if (action === 'test') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      // Use provided endpoint, stored config, or try auto-detection
      const endpoint = homeEndpoint || wpConfig?.home_endpoint;
      
      const testResult = await testWordPressHomesEndpoint(normalizedUrl, endpoint);
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
      const endpoint = homeEndpoint || wpConfig?.home_endpoint;
      
      if (!urlToSync) {
        return new Response(
          JSON.stringify({ error: 'No WordPress site URL configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Starting WordPress homes sync for agent ${agentId} from ${urlToSync}${endpoint ? ` using endpoint /${endpoint}` : ''}`);

      // Get or create WordPress knowledge source
      const knowledgeSourceId = await getOrCreateWordPressSource(
        supabase,
        agentId,
        agent.user_id,
        urlToSync
      );

      // Get locations with WordPress community term IDs for auto-matching
      const { data: locations } = await supabase
        .from('locations')
        .select('id, wordpress_community_term_id')
        .eq('agent_id', agentId)
        .not('wordpress_community_term_id', 'is', null);

      const termIdMap = new Map<number, string>();
      for (const loc of locations || []) {
        if (loc.wordpress_community_term_id) {
          termIdMap.set(loc.wordpress_community_term_id, loc.id);
        }
      }
      
      const locationMaps: LocationMaps = { termIdMap };
      console.log(`Built location map with ${termIdMap.size} WordPress taxonomy term IDs`);

      // Fetch homes from WordPress using configured endpoint
      const homes = await fetchWordPressHomes(urlToSync, endpoint);
      console.log(`Fetched ${homes.length} homes from WordPress`);

      // Sync homes to properties
      const result = await syncHomesToProperties(
        supabase,
        agentId,
        knowledgeSourceId,
        locationMaps,
        homes
      );

      // Update agent's deployment_config with sync info
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          site_url: urlToSync,
          ...(endpoint && { home_endpoint: endpoint }),
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
async function testWordPressHomesEndpoint(
  siteUrl: string, 
  endpoint?: string
): Promise<{ success: boolean; message: string; homeCount?: number; detectedEndpoint?: string }> {
  try {
    let formattedUrl = siteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    formattedUrl = formattedUrl.replace(/\/$/, '');

    // If endpoint provided, use it directly
    if (endpoint) {
      const response = await fetch(`${formattedUrl}/wp-json/wp/v2/${endpoint}?per_page=1`, {
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const total = response.headers.get('X-WP-Total');
        return {
          success: true,
          message: `Found homes endpoint at /${endpoint}`,
          homeCount: total ? parseInt(total, 10) : 0,
          detectedEndpoint: endpoint,
        };
      } else {
        return {
          success: false,
          message: `Endpoint /${endpoint} not found (status ${response.status})`,
        };
      }
    }

    // Try auto-detecting common endpoints
    const endpoints = [
      'home',
      'homes',
      'property',
      'properties',
      'listing',
      'listings',
      'available-homes',
      'units',
    ];

    for (const ep of endpoints) {
      try {
        const response = await fetch(`${formattedUrl}/wp-json/wp/v2/${ep}?per_page=1`, {
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const total = response.headers.get('X-WP-Total');
          return {
            success: true,
            message: `Found homes endpoint at /${ep}`,
            homeCount: total ? parseInt(total, 10) : 0,
            detectedEndpoint: ep,
          };
        }
      } catch {
        continue;
      }
    }

    return {
      success: false,
      message: 'No homes/properties endpoint found. Configure a custom endpoint slug in Advanced Settings.',
    };
  } catch (error) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}

/**
 * Fetch homes from WordPress
 */
async function fetchWordPressHomes(
  siteUrl: string, 
  endpoint?: string
): Promise<WordPressHome[]> {
  let formattedUrl = siteUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  formattedUrl = formattedUrl.replace(/\/$/, '');

  // Determine which endpoint to use
  let activeEndpoint = endpoint;
  
  if (!activeEndpoint) {
    // Auto-detect endpoint
    const endpoints = ['home', 'homes', 'property', 'properties', 'listing', 'listings', 'available-homes', 'units'];
    
    for (const ep of endpoints) {
      try {
        const response = await fetch(`${formattedUrl}/wp-json/wp/v2/${ep}?per_page=1`, {
          headers: { 'Accept': 'application/json' },
        });
        if (response.ok) {
          activeEndpoint = ep;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (!activeEndpoint) {
    console.warn('No homes endpoint found');
    return [];
  }

  console.log(`Using homes endpoint: /${activeEndpoint}`);

  const homes: WordPressHome[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const apiUrl = `${formattedUrl}/wp-json/wp/v2/${activeEndpoint}?per_page=${perPage}&page=${page}&_embed`;
    console.log(`Fetching WordPress homes page ${page}: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'ChatPad/1.0' },
    });

    if (!response.ok) {
      if (response.status === 400 && page > 1) {
        break;
      }
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    homes.push(...data);

    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  return homes;
}

async function getOrCreateWordPressSource(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  userId: string,
  siteUrl: string
): Promise<string> {
  const sourceName = `WordPress: ${siteUrl}`;
  
  const { data: existing } = await supabase
    .from('knowledge_sources')
    .select('id')
    .eq('agent_id', agentId)
    .eq('source', sourceName)
    .eq('type', 'api')
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data: newSource, error } = await supabase
    .from('knowledge_sources')
    .insert({
      agent_id: agentId,
      user_id: userId,
      source: sourceName,
      type: 'api',
      source_type: 'wordpress_home',
      status: 'ready',
      metadata: { wordpress_homes: true },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge source: ${error.message}`);
  }

  return newSource.id;
}

async function syncHomesToProperties(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  knowledgeSourceId: string,
  locationMaps: LocationMaps,
  homes: WordPressHome[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] };
  
  // Get IDs of homes from WordPress
  const wpHomeIds = new Set(homes.map(h => String(h.id)));
  
  // Get existing WordPress properties for this agent
  const { data: existingProperties } = await supabase
    .from('properties')
    .select('id, external_id')
    .eq('agent_id', agentId)
    .eq('knowledge_source_id', knowledgeSourceId);
  
  // Delete properties that no longer exist in WordPress (hard delete)
  for (const prop of existingProperties || []) {
    if (prop.external_id && !wpHomeIds.has(prop.external_id)) {
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', prop.id);
      
      if (deleteError) {
        result.errors.push(`Failed to delete orphan property ${prop.id}: ${deleteError.message}`);
      } else {
        result.deleted++;
        console.log(`🗑️ Deleted orphaned property (WP ID ${prop.external_id} no longer exists)`);
      }
    }
  }

  // Create/update properties from WordPress
  for (const home of homes) {
    try {
      const acf = home.acf;
      
      // Extract property data from ACF
      const address = extractAcfField(acf, 'address', 'full_address', 'street_address');
      const lotNumber = extractAcfField(acf, 'lot', 'lot_number', 'lot_num', 'site_number', 'unit_number', 'home_unit_number');
      const city = extractAcfField(acf, 'city');
      const state = extractAcfField(acf, 'state');
      const zip = extractAcfField(acf, 'zip', 'zipcode', 'postal_code') || extractZipFromAddress(address);
      
      // Price handling - convert to cents
      let price: number | null = null;
      const priceValue = extractAcfNumber(acf, 'price', 'asking_price', 'list_price', 'sale_price');
      if (priceValue != null) {
        price = Math.round(priceValue * 100);
      }
      
      const priceType = extractAcfField(acf, 'price_type', 'listing_type') || 'sale';
      const beds = extractAcfNumber(acf, 'beds', 'bedrooms', 'bed', 'bedroom');
      const baths = extractAcfNumber(acf, 'baths', 'bathrooms', 'bath', 'bathroom');
      const sqft = extractAcfNumber(acf, 'sqft', 'square_feet', 'sq_ft', 'square_footage', 'size');
      const yearBuilt = extractAcfNumber(acf, 'year_built', 'year', 'built');
      const status = extractAcfField(acf, 'status', 'listing_status', 'availability') || 'available';
      const description = extractAcfField(acf, 'description', 'details', 'summary') || 
                          home.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() ||
                          home.content?.rendered?.replace(/<[^>]*>/g, '').substring(0, 500).trim();
      
      const features = extractAcfArray(acf, 'features', 'amenities', 'highlights');
      
      // Get images
      const images: Array<{ url: string; alt?: string }> = [];
      if (home._embedded?.['wp:featuredmedia']?.[0]) {
        const featured = home._embedded['wp:featuredmedia'][0];
        images.push({ url: featured.source_url, alt: featured.alt_text });
      }
      
      // Match to location via taxonomy term ID
      let locationId: string | null = null;
      if (home.home_community?.[0]) {
        const termId = home.home_community[0];
        locationId = locationMaps.termIdMap.get(termId) || null;
      }

      const propertyData = {
        agent_id: agentId,
        knowledge_source_id: knowledgeSourceId,
        external_id: String(home.id),
        listing_url: home.link,
        address,
        lot_number: lotNumber,
        city,
        state,
        zip,
        price,
        price_type: priceType as 'sale' | 'rent' | 'lease' | null,
        beds,
        baths,
        sqft,
        year_built: yearBuilt,
        status: normalizeStatus(status),
        description,
        features: features.length > 0 ? features : null,
        images: images.length > 0 ? images : null,
        location_id: locationId,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if property already exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId)
        .eq('external_id', String(home.id))
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', existing.id);

        if (updateError) {
          result.errors.push(`Failed to update home ${home.slug}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      } else {
        const { error: insertError } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            first_seen_at: new Date().toISOString(),
          });

        if (insertError) {
          result.errors.push(`Failed to create home ${home.slug}: ${insertError.message}`);
        } else {
          result.created++;
        }
      }
    } catch (error) {
      result.errors.push(`Error processing home ${home.slug}: ${error.message}`);
    }
  }

  return result;
}

function normalizeStatus(status: string | null): 'available' | 'pending' | 'sold' | 'rented' | 'off_market' | null {
  if (!status) return null;
  const lower = status.toLowerCase();
  if (lower.includes('available') || lower.includes('active') || lower.includes('for sale')) return 'available';
  if (lower.includes('pending') || lower.includes('under contract')) return 'pending';
  if (lower.includes('sold') || lower.includes('closed')) return 'sold';
  if (lower.includes('rented') || lower.includes('leased')) return 'rented';
  if (lower.includes('off') || lower.includes('inactive') || lower.includes('withdrawn')) return 'off_market';
  return 'available';
}
