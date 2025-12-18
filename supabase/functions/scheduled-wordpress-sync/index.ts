/**
 * Scheduled WordPress Sync Edge Function
 * 
 * Runs on a cron schedule to automatically sync WordPress communities and homes
 * for agents that have configured automatic sync intervals.
 * 
 * Schedule: Runs every hour (0 * * * *)
 * 
 * @module functions/scheduled-wordpress-sync
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressConfig {
  site_url: string;
  last_community_sync?: string;
  last_home_sync?: string;
  community_sync_interval?: string;
  home_sync_interval?: string;
  community_count?: number;
  home_count?: number;
}

/**
 * Convert sync interval string to minutes
 */
function intervalToMinutes(interval: string): number | null {
  const intervalMap: Record<string, number> = {
    'hourly_1': 60,
    'hourly_2': 120,
    'hourly_4': 240,
    'hourly_6': 360,
    'hourly_12': 720,
    'daily': 1440,
  };
  return intervalMap[interval] ?? null;
}

/**
 * Check if sync is due based on interval and last sync time
 */
function isSyncDue(lastSync: string | undefined, intervalMinutes: number): boolean {
  if (!lastSync) return true; // Never synced, always due
  
  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  const minutesSinceSync = (now - lastSyncTime) / 60000;
  
  return minutesSinceSync >= intervalMinutes;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🕐 Starting scheduled WordPress sync check...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all agents with WordPress configuration
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, user_id, deployment_config')
      .not('deployment_config->wordpress', 'is', null);

    if (agentsError) {
      console.error('Failed to fetch agents:', agentsError);
      throw agentsError;
    }

    console.log(`📊 Found ${agents?.length || 0} agents with WordPress configuration`);

    const results = {
      communitySyncs: 0,
      homeSyncs: 0,
      errors: [] as string[],
    };

    // Process each agent
    for (const agent of agents || []) {
      const deploymentConfig = agent.deployment_config as Record<string, unknown> | null;
      const wpConfig = deploymentConfig?.wordpress as WordPressConfig | undefined;

      if (!wpConfig?.site_url) {
        console.log(`⏭️ Agent ${agent.id}: No site URL configured, skipping`);
        continue;
      }

      // Check community sync
      const communityInterval = wpConfig.community_sync_interval;
      const communityIntervalMinutes = communityInterval ? intervalToMinutes(communityInterval) : null;

      if (communityIntervalMinutes && isSyncDue(wpConfig.last_community_sync, communityIntervalMinutes)) {
        console.log(`🏘️ Agent ${agent.id}: Community sync is due (interval: ${communityInterval}, last: ${wpConfig.last_community_sync || 'never'})`);
        
        try {
          const { data, error } = await supabase.functions.invoke('sync-wordpress-communities', {
            body: {
              action: 'sync',
              agentId: agent.id,
              siteUrl: wpConfig.site_url,
            },
            headers: {
              // Use service role for internal calls - create a mock auth header
              // The function will use service role key directly for scheduled calls
              'x-scheduled-sync': 'true',
            },
          });

          if (error) {
            console.error(`❌ Agent ${agent.id}: Community sync failed:`, error);
            results.errors.push(`Agent ${agent.id} community sync: ${error.message}`);
          } else {
            console.log(`✅ Agent ${agent.id}: Community sync complete - ${data?.created || 0} created, ${data?.updated || 0} updated`);
            results.communitySyncs++;
          }
        } catch (syncError) {
          console.error(`❌ Agent ${agent.id}: Community sync exception:`, syncError);
          results.errors.push(`Agent ${agent.id} community sync: ${syncError.message}`);
        }
      }

      // Check home sync
      const homeInterval = wpConfig.home_sync_interval;
      const homeIntervalMinutes = homeInterval ? intervalToMinutes(homeInterval) : null;

      if (homeIntervalMinutes && isSyncDue(wpConfig.last_home_sync, homeIntervalMinutes)) {
        console.log(`🏠 Agent ${agent.id}: Home sync is due (interval: ${homeInterval}, last: ${wpConfig.last_home_sync || 'never'})`);
        
        try {
          const { data, error } = await supabase.functions.invoke('sync-wordpress-homes', {
            body: {
              action: 'sync',
              agentId: agent.id,
              siteUrl: wpConfig.site_url,
            },
            headers: {
              'x-scheduled-sync': 'true',
            },
          });

          if (error) {
            console.error(`❌ Agent ${agent.id}: Home sync failed:`, error);
            results.errors.push(`Agent ${agent.id} home sync: ${error.message}`);
          } else {
            console.log(`✅ Agent ${agent.id}: Home sync complete - ${data?.created || 0} created, ${data?.updated || 0} updated`);
            results.homeSyncs++;
          }
        } catch (syncError) {
          console.error(`❌ Agent ${agent.id}: Home sync exception:`, syncError);
          results.errors.push(`Agent ${agent.id} home sync: ${syncError.message}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🏁 Scheduled sync complete in ${duration}ms: ${results.communitySyncs} community syncs, ${results.homeSyncs} home syncs, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Scheduled WordPress sync failed:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
