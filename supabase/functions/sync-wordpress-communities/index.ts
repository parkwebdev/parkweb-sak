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
  last_community_sync?: string;
  community_count?: number;
}

interface WordPressCommunity {
  id: number;
  slug: string;
  title: { rendered: string };
  acf?: Record<string, unknown>;
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
    if (longitude >= -67 && longitude < -71) return 'America/New_York'; // Eastern edge
    if (longitude >= -71 && longitude < -85) return 'America/New_York'; // Eastern
    if (longitude >= -85 && longitude < -100) return 'America/Chicago'; // Central
    if (longitude >= -100 && longitude < -115) return 'America/Denver'; // Mountain
    if (longitude >= -115 && longitude < -125) return 'America/Los_Angeles'; // Pacific
    if (longitude >= -125 && longitude < -140) return 'America/Anchorage'; // Alaska
    if (longitude >= -155 && longitude < -162) return 'Pacific/Honolulu'; // Hawaii
  }
  
  if (!state) return 'America/New_York';
  
  const normalized = state.toLowerCase().trim();
  
  // Map state names and abbreviations to timezones
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
  if (normalized === 'az' || normalized === 'arizona') return 'America/Phoenix'; // No DST
  if (normalized === 'hi' || normalized === 'hawaii') return 'Pacific/Honolulu';
  if (normalized === 'ak' || normalized === 'alaska') return 'America/Anchorage';
  if (normalized === 'in' || normalized === 'indiana') return 'America/Indiana/Indianapolis';
  
  if (eastern.includes(normalized)) return 'America/New_York';
  if (central.includes(normalized)) return 'America/Chicago';
  if (mountain.includes(normalized)) return 'America/Denver';
  if (pacific.includes(normalized)) return 'America/Los_Angeles';
  
  return 'America/New_York'; // Default fallback
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

    const { action, agentId, siteUrl } = await req.json();

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

    // Handle test connection action
    if (action === 'test') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedUrl = normalizeSiteUrl(siteUrl);
      const testResult = await testWordPressConnection(normalizedUrl);
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

      console.log(`Starting WordPress community sync for agent ${agentId} from ${urlToSync}`);

      // Fetch communities from WordPress
      const communities = await fetchWordPressCommunities(urlToSync);
      console.log(`Fetched ${communities.length} communities from WordPress`);

      // Sync communities to locations
      const result = await syncCommunitiesToLocations(
        supabase,
        agentId,
        agent.user_id,
        communities
      );

      // Update agent's deployment_config with sync info
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          site_url: urlToSync,
          last_community_sync: new Date().toISOString(),
          community_count: communities.length,
        },
      };

      await supabase
        .from('agents')
        .update({ deployment_config: updatedConfig })
        .eq('id', agentId);

      console.log(`Sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);

      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          total: communities.length,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle save config action (saves URL and sync settings without syncing)
    if (action === 'save') {
      const { communitySyncInterval, homeSyncInterval } = await req.json().catch(() => ({}));
      
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const normalizedUrl = siteUrl ? normalizeSiteUrl(siteUrl) : wpConfig?.site_url;
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          ...(normalizedUrl && { site_url: normalizedUrl }),
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

    // Handle disconnect action (clears WordPress config)
    if (action === 'disconnect') {
      const { deleteLocations } = await req.json().catch(() => ({}));
      
      // Optionally delete synced locations
      if (deleteLocations) {
        await supabase
          .from('locations')
          .delete()
          .eq('agent_id', agentId)
          .not('wordpress_community_id', 'is', null);
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
      JSON.stringify({ error: 'Invalid action. Use "test", "sync", "save", or "disconnect"' }),
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

async function testWordPressConnection(siteUrl: string): Promise<{ success: boolean; message: string; communityCount?: number }> {
  try {
    // Normalize URL
    const normalizedUrl = siteUrl.replace(/\/$/, '');
    const apiUrl = `${normalizedUrl}/wp-json/wp/v2/community?per_page=1`;

    console.log(`Testing WordPress connection: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChatPad/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, message: 'Community endpoint not found. Ensure your WordPress site has a "community" custom post type with REST API enabled.' };
      }
      return { success: false, message: `WordPress API returned status ${response.status}` };
    }

    // Check X-WP-Total header for total count
    const totalCount = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { success: false, message: 'Invalid response format from WordPress API' };
    }

    return { 
      success: true, 
      message: `Connection successful! Found ${totalCount} communities.`,
      communityCount: totalCount,
    };
  } catch (error) {
    console.error('WordPress connection test error:', error);
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}

async function fetchWordPressCommunities(siteUrl: string): Promise<WordPressCommunity[]> {
  const normalizedUrl = siteUrl.replace(/\/$/, '');
  const communities: WordPressCommunity[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const apiUrl = `${normalizedUrl}/wp-json/wp/v2/community?per_page=${perPage}&page=${page}&_embed`;
    console.log(`Fetching WordPress communities page ${page}: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChatPad/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 400 && page > 1) {
        // No more pages
        break;
      }
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    communities.push(...data);

    // Check if there are more pages
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  return communities;
}

async function syncCommunitiesToLocations(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  userId: string,
  communities: WordPressCommunity[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const community of communities) {
    try {
      // Intelligently extract fields from ACF data
      const acf = community.acf;
      const address = extractAcfField(acf, 'full_address', 'address', 'street');
      const city = extractAcfField(acf, 'city');
      const state = extractAcfField(acf, 'state');
      const zip = extractAcfField(acf, 'zip', 'zipcode', 'postal', 'postal_code') || extractZipFromAddress(address);
      const phone = extractAcfField(acf, 'phone', 'telephone', 'tel', 'phone_number');
      const email = extractAcfField(acf, 'email', 'mail', 'email_address', 'contact_email', 'e_mail');
      const latitude = extractAcfNumber(acf, 'latitude', 'lat');
      const longitude = extractAcfNumber(acf, 'longitude', 'lng', 'long');
      
      // Auto-detect timezone from state or coordinates
      const timezone = inferTimezone(state, latitude, longitude);
      
      // Build metadata with any extra fields we find
      const metadata: Record<string, unknown> = {};
      if (latitude != null) metadata.latitude = latitude;
      if (longitude != null) metadata.longitude = longitude;
      const ageCategory = extractAcfField(acf, 'age', 'age_category', 'age_restriction');
      if (ageCategory) metadata.age_category = ageCategory;
      const communityType = extractAcfField(acf, 'type', 'community_type');
      if (communityType) metadata.community_type = communityType;

      const locationData = {
        agent_id: agentId,
        user_id: userId,
        name: decodeHtmlEntities(community.title.rendered),
        wordpress_community_id: community.id,
        wordpress_slug: community.slug,
        address,
        city,
        state,
        zip,
        phone,
        email,
        timezone,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Check if location already exists (including soft-deleted ones)
      const { data: existing } = await supabase
        .from('locations')
        .select('id, is_active')
        .eq('agent_id', agentId)
        .eq('wordpress_community_id', community.id)
        .maybeSingle();

      // Skip if location was soft-deleted by user - respect their deletion
      if (existing && !existing.is_active) {
        result.skipped++;
        continue;
      }

      if (existing) {
        // Update existing active location (don't set is_active to avoid resurrection)
        const { is_active: _, ...updateData } = locationData;
        const { error: updateError } = await supabase
          .from('locations')
          .update(updateData)
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
