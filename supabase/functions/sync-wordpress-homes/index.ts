/**
 * Sync WordPress Homes Edge Function
 * 
 * Fetches homes from a WordPress REST API and upserts them as properties.
 * Supports configurable endpoints and AI extraction fallback.
 * 
 * Optimizations:
 * - Content hashing to skip unchanged records
 * - Batch database queries to reduce N+1 patterns
 * - Incremental sync using modified_after parameter
 * 
 * @module functions/sync-wordpress-homes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { extractPropertyData, type ExtractedPropertyData } from '../_shared/ai/wordpress-extraction.ts';

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
  /** Field mappings: target field → source field path */
  community_field_mappings?: Record<string, string>;
  /** Field mappings: target field → source field path */
  property_field_mappings?: Record<string, string>;
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

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  errors: string[];
  sync_type: 'full' | 'incremental';
}

interface LocationMaps {
  termIdMap: Map<number, string>;
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
  
  if (current === null || current === undefined) return null;
  if (typeof current === 'object') {
    const asObj = current as Record<string, unknown>;
    if ('rendered' in asObj) return asObj.rendered;
    return null;
  }
  return current;
}

function extractZipFromAddress(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(-\d{4})?\b/);
  return match ? match[1] : null;
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

    const { action, agentId, siteUrl, homeEndpoint, useAiExtraction, modifiedAfter, forceFullSync } = await req.json();

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
      const startTime = Date.now();
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const urlToSync = normalizeSiteUrl(siteUrl || wpConfig?.site_url || '');
      const endpoint = homeEndpoint || wpConfig?.home_endpoint;
      
      // Determine if this is an incremental sync
      const lastSync = modifiedAfter || wpConfig?.last_home_sync;
      let isIncremental = !!lastSync && !forceFullSync;
      
      if (!urlToSync) {
        return new Response(
          JSON.stringify({ error: 'No WordPress site URL configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get or create WordPress knowledge source
      const knowledgeSourceId = await getOrCreateWordPressSource(
        supabase,
        agentId,
        agent.user_id,
        urlToSync
      );

      // Smart detection: Force full sync if local properties are missing
      if (isIncremental && !forceFullSync) {
        const { count: localCount } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', agentId)
          .eq('knowledge_source_id', knowledgeSourceId);
        
        // If we have 0 local properties but config says we had some, force full sync
        if (localCount === 0 && wpConfig?.home_count && wpConfig.home_count > 0) {
          console.log(`Detected missing local properties (0 vs ${wpConfig.home_count} expected). Forcing full sync.`);
          isIncremental = false;
        }
      }

      console.log(`Starting WordPress homes sync for agent ${agentId} from ${urlToSync}${endpoint ? ` using endpoint /${endpoint}` : ''} (${isIncremental ? 'incremental' : 'full'}${forceFullSync ? ', forced' : ''})`);

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
      const homes = await fetchWordPressHomes(urlToSync, endpoint, isIncremental ? lastSync : undefined);
      console.log(`Fetched ${homes.length} homes from WordPress`);

      // Sync homes to properties with optimizations
      const result = await syncHomesToProperties(
        supabase,
        agentId,
        knowledgeSourceId,
        locationMaps,
        homes,
        isIncremental,
        useAiExtraction ?? false,
        wpConfig?.property_field_mappings
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

      const duration = Date.now() - startTime;
      console.log(`WordPress homes sync completed in ${duration}ms: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged, ${result.deleted} deleted`);

      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          total: homes.length,
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "test" or "sync"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
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
  } catch (error: unknown) {
    return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Fetch homes from WordPress with optional incremental sync
 */
async function fetchWordPressHomes(
  siteUrl: string, 
  endpoint?: string,
  modifiedAfter?: string
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
    let apiUrl = `${formattedUrl}/wp-json/wp/v2/${activeEndpoint}?per_page=${perPage}&page=${page}&_embed`;
    
    // Add modified_after for incremental sync
    if (modifiedAfter) {
      apiUrl += `&modified_after=${encodeURIComponent(modifiedAfter)}`;
    }
    
    console.log(`Fetching WordPress homes page ${page}: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Pilot/1.0' },
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

/**
 * Sync homes to properties with batching and content hashing
 */
async function syncHomesToProperties(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  knowledgeSourceId: string,
  locationMaps: LocationMaps,
  homes: WordPressHome[],
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
  
  // Get IDs of homes from WordPress
  const wpHomeIds = homes.map(h => String(h.id));
  
  // OPTIMIZATION: Batch fetch all existing WordPress properties for this agent
  const { data: existingProperties } = await supabase
    .from('properties')
    .select('id, external_id, content_hash')
    .eq('agent_id', agentId)
    .eq('knowledge_source_id', knowledgeSourceId);
  
  // Build lookup map for O(1) access
  const existingMap = new Map(
    (existingProperties || []).map(prop => [prop.external_id, prop])
  );
  
  // Delete properties that no longer exist in WordPress (only for full sync)
  if (!isIncremental) {
    const wpHomeIdSet = new Set(wpHomeIds);
    for (const prop of existingProperties || []) {
      if (prop.external_id && !wpHomeIdSet.has(prop.external_id)) {
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
  }

  // Create/update properties from WordPress
  for (const home of homes) {
    try {
      let address: string | null = null;
      let lotNumber: string | null = null;
      let city: string | null = null;
      let state: string | null = null;
      let zip: string | null = null;
      let price: number | null = null;
      let priceType: string | null = 'sale';
      let beds: number | null = null;
      let baths: number | null = null;
      let sqft: number | null = null;
      let yearBuilt: number | null = null;
      let status: string | null = 'available';
      let description: string | null = null;
      let features: string[] = [];
      
      const acf = home.acf;
      
      // PRIORITY 1: Use explicit field mappings if provided
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        console.log(`📋 Using custom field mappings for property: ${home.slug}`);
        address = getValueByPath(home as Record<string, unknown>, fieldMappings.address) as string | null;
        lotNumber = getValueByPath(home as Record<string, unknown>, fieldMappings.lot_number) as string | null;
        city = getValueByPath(home as Record<string, unknown>, fieldMappings.city) as string | null;
        state = getValueByPath(home as Record<string, unknown>, fieldMappings.state) as string | null;
        zip = getValueByPath(home as Record<string, unknown>, fieldMappings.zip) as string | null;
        const priceValue = getValueByPath(home as Record<string, unknown>, fieldMappings.price);
        if (priceValue != null) price = Math.round(parseFloat(String(priceValue)) * 100);
        priceType = (getValueByPath(home as Record<string, unknown>, fieldMappings.price_type) as string) || 'sale';
        const bedsValue = getValueByPath(home as Record<string, unknown>, fieldMappings.beds);
        if (bedsValue != null) beds = parseInt(String(bedsValue), 10) || null;
        const bathsValue = getValueByPath(home as Record<string, unknown>, fieldMappings.baths);
        if (bathsValue != null) baths = parseFloat(String(bathsValue)) || null;
        const sqftValue = getValueByPath(home as Record<string, unknown>, fieldMappings.sqft);
        if (sqftValue != null) sqft = parseInt(String(sqftValue), 10) || null;
        const yearValue = getValueByPath(home as Record<string, unknown>, fieldMappings.year_built);
        if (yearValue != null) yearBuilt = parseInt(String(yearValue), 10) || null;
        status = (getValueByPath(home as Record<string, unknown>, fieldMappings.status) as string) || 'available';
        description = getValueByPath(home as Record<string, unknown>, fieldMappings.description) as string | null;
        // Features may need special handling for arrays
        const featuresValue = getValueByPath(home as Record<string, unknown>, fieldMappings.features);
        if (Array.isArray(featuresValue)) features = featuresValue.map(String);
      }
      
      // PRIORITY 2: Use AI extraction if enabled (for fields still missing)
      if (useAiExtraction && !address) {
        console.log(`🤖 Using AI extraction for property: ${home.slug}`);
        const aiData = await extractPropertyData(home);
        
        if (aiData) {
          if (!address) address = aiData.address || null;
          if (!lotNumber) lotNumber = aiData.lot_number || null;
          if (!city) city = aiData.city || null;
          if (!state) state = aiData.state || null;
          if (!zip) zip = aiData.zip || null;
          if (price == null && aiData.price != null) price = Math.round(aiData.price * 100);
          if (!priceType || priceType === 'sale') priceType = aiData.price_type || 'sale';
          if (beds == null) beds = aiData.beds || null;
          if (baths == null) baths = aiData.baths || null;
          if (sqft == null) sqft = aiData.sqft || null;
          if (yearBuilt == null) yearBuilt = aiData.year_built || null;
          if (!status || status === 'available') status = aiData.status || 'available';
          if (!description) description = aiData.description || null;
          if (features.length === 0) features = aiData.features || [];
        }
      }
      
      // PRIORITY 3: Fall back to keyword-based ACF extraction
      if (!address) address = extractAcfField(acf, 'address', 'full_address', 'street_address');
      if (!lotNumber) lotNumber = extractAcfField(acf, 'lot', 'lot_number', 'lot_num', 'site_number', 'unit_number', 'home_unit_number');
      if (!city) city = extractAcfField(acf, 'city');
      if (!state) state = extractAcfField(acf, 'state');
      if (!zip) zip = extractAcfField(acf, 'zip', 'zipcode', 'postal_code') || extractZipFromAddress(address);
      
      if (price == null) {
        const priceValue = extractAcfNumber(acf, 'price', 'asking_price', 'list_price', 'sale_price');
        if (priceValue != null) price = Math.round(priceValue * 100);
      }
      
      if (!priceType || priceType === 'sale') priceType = extractAcfField(acf, 'price_type', 'listing_type') || 'sale';
      if (beds == null) beds = extractAcfNumber(acf, 'beds', 'bedrooms', 'bed', 'bedroom');
      if (baths == null) baths = extractAcfNumber(acf, 'baths', 'bathrooms', 'bath', 'bathroom');
      if (sqft == null) sqft = extractAcfNumber(acf, 'sqft', 'square_feet', 'sq_ft', 'square_footage', 'size');
      if (yearBuilt == null) yearBuilt = extractAcfNumber(acf, 'year_built', 'year', 'built');
      if (!status || status === 'available') status = extractAcfField(acf, 'status', 'listing_status', 'availability') || 'available';
      if (!description) {
        description = extractAcfField(acf, 'description', 'details', 'summary') || 
                      home.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() ||
                      home.content?.rendered?.replace(/<[^>]*>/g, '').substring(0, 500).trim();
      }
      
      if (features.length === 0) features = extractAcfArray(acf, 'features', 'amenities', 'highlights');
      
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
      
      // Data to be hashed for change detection
      const hashableData = {
        listing_url: home.link,
        address,
        lot_number: lotNumber,
        city,
        state,
        zip,
        price,
        price_type: priceType,
        beds,
        baths,
        sqft,
        year_built: yearBuilt,
        status,
        description,
        features,
        images,
        location_id: locationId,
      };
      
      const contentHash = generateContentHash(hashableData);

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
        content_hash: contentHash,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if property already exists using our lookup map
      const existing = existingMap.get(String(home.id));

      if (existing) {
        // OPTIMIZATION: Skip update if content hash matches
        if (existing.content_hash === contentHash) {
          result.unchanged++;
          continue;
        }
        
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
    } catch (error: unknown) {
      result.errors.push(`Error processing home ${home.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
