import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

console.log('cleanup-orphaned-sources function initialized');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Starting orphaned sources cleanup...');

    // Step 1: Find all child sources (sources with parent_source_id in metadata)
    const { data: childSources, error: fetchError } = await supabase
      .from('knowledge_sources')
      .select('id, metadata')
      .not('metadata->parent_source_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching child sources:', fetchError);
      throw fetchError;
    }

    if (!childSources || childSources.length === 0) {
      console.log('No child sources found');
      return new Response(
        JSON.stringify({ success: true, orphansDeleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${childSources.length} child sources to check`);

    // Step 2: Get all unique parent IDs
    const parentIds = new Set<string>();
    for (const source of childSources) {
      const metadata = source.metadata as Record<string, unknown>;
      if (metadata?.parent_source_id) {
        parentIds.add(metadata.parent_source_id as string);
      }
    }

    console.log(`Checking ${parentIds.size} unique parent IDs`);

    // Step 3: Check which parents still exist
    const { data: existingParents, error: parentsError } = await supabase
      .from('knowledge_sources')
      .select('id')
      .in('id', Array.from(parentIds));

    if (parentsError) {
      console.error('Error fetching parent sources:', parentsError);
      throw parentsError;
    }

    const existingParentIds = new Set((existingParents || []).map(p => p.id));
    console.log(`${existingParentIds.size} parents still exist`);

    // Step 4: Find orphaned children (parent no longer exists)
    const orphanedSourceIds: string[] = [];
    for (const source of childSources) {
      const metadata = source.metadata as Record<string, unknown>;
      const parentId = metadata?.parent_source_id as string;
      if (parentId && !existingParentIds.has(parentId)) {
        orphanedSourceIds.push(source.id);
      }
    }

    if (orphanedSourceIds.length === 0) {
      console.log('No orphaned sources found');
      return new Response(
        JSON.stringify({ success: true, orphansDeleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${orphanedSourceIds.length} orphaned sources to delete`);

    // Step 5: Delete orphaned sources in batches
    const batchSize = 100;
    let totalDeleted = 0;

    for (let i = 0; i < orphanedSourceIds.length; i += batchSize) {
      const batch = orphanedSourceIds.slice(i, i + batchSize);
      
      // First delete associated chunks
      const { error: chunksError } = await supabase
        .from('knowledge_chunks')
        .delete()
        .in('source_id', batch);

      if (chunksError) {
        console.error(`Error deleting chunks for batch ${i}:`, chunksError);
      }

      // Then delete the sources
      const { error: deleteError } = await supabase
        .from('knowledge_sources')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`Error deleting orphaned sources batch ${i}:`, deleteError);
      } else {
        totalDeleted += batch.length;
        console.log(`Deleted batch ${i / batchSize + 1}: ${batch.length} orphaned sources`);
      }
    }

    console.log(`Cleanup complete: ${totalDeleted} orphaned sources deleted`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orphansDeleted: totalDeleted,
        checkedChildren: childSources.length,
        uniqueParents: parentIds.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup-orphaned-sources:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
