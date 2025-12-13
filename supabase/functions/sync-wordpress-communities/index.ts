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
  acf?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  };
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
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

    // Check account access (owner or team member)
    const { data: hasAccess } = await supabase.rpc('has_account_access', {
      account_owner_id: agent.user_id
    });

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

      const testResult = await testWordPressConnection(siteUrl);
      return new Response(
        JSON.stringify(testResult),
        { status: testResult.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle sync action
    if (action === 'sync') {
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const urlToSync = siteUrl || wpConfig?.site_url;
      
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

    // Handle save config action (just saves URL without syncing)
    if (action === 'save') {
      if (!siteUrl) {
        return new Response(
          JSON.stringify({ error: 'Site URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;
      
      const updatedConfig = {
        ...deploymentConfig,
        wordpress: {
          ...wpConfig,
          site_url: siteUrl,
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

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "test", "sync", or "save"' }),
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
      const locationData = {
        agent_id: agentId,
        user_id: userId,
        name: decodeHtmlEntities(community.title.rendered),
        wordpress_community_id: community.id,
        wordpress_slug: community.slug,
        address: community.acf?.address || null,
        city: community.acf?.city || null,
        state: community.acf?.state || null,
        zip: community.acf?.zip || null,
        phone: community.acf?.phone || null,
        email: community.acf?.email || null,
        timezone: community.acf?.timezone || 'America/New_York',
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Check if location already exists
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('agent_id', agentId)
        .eq('wordpress_community_id', community.id)
        .single();

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
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, ''')
    .replace(/&#8217;/g, ''')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}
