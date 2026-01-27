
## Fix: WordPress Sync Should Re-fetch All Properties When Local Data Is Missing

### Problem
After deleting all properties locally, clicking "Sync Homes" says "No changes" and doesn't restore the properties. This happens because:

1. The sync uses **incremental mode** by default when `last_home_sync` exists
2. Incremental sync adds `modified_after` to the WordPress API call, only fetching homes modified since last sync
3. Since WordPress homes weren't *modified* (you deleted local copies), WordPress returns 0 homes
4. Result: 0 created, 0 updated, 0 deleted → user is stuck

**Evidence from logs:**
```
Starting WordPress homes sync... (incremental)
Fetching: ...&modified_after=2026-01-27T00%3A42%3A54.345Z
Fetched 0 homes from WordPress
```

### Solution
Add **smart detection** to automatically switch to a full sync when local properties are missing, plus give users an explicit "Full Resync" option.

---

### File Changes

#### 1. Edge Function: `supabase/functions/sync-wordpress-homes/index.ts`

**Before sync (around line 306-307):**
Add a check for local property count vs WordPress count. If local is 0 but WordPress has homes, force a full sync:

```typescript
// Determine if this is an incremental sync
const lastSync = modifiedAfter || wpConfig?.last_home_sync;
let isIncremental = !!lastSync;

// Check if we should force full sync due to missing local data
if (isIncremental && !forceFullSync) {
  const knowledgeSourceId = await getOrCreateWordPressSource(...);
  
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
```

**Also accept `forceFullSync` parameter** in the request body to allow explicit full resync:

```typescript
const { action, agentId, siteUrl, homeEndpoint, useAiExtraction, modifiedAfter, forceFullSync } = await req.json();

// If forceFullSync is true, bypass incremental logic
if (forceFullSync) {
  isIncremental = false;
}
```

---

#### 2. Hook: `src/hooks/useWordPressHomes.ts`

Add a `forceFullSync` parameter to `syncHomes`:

```typescript
const syncHomes = useCallback(async (
  url?: string, 
  useAiExtraction?: boolean, 
  endpoint?: string,
  forceFullSync?: boolean  // NEW
): Promise<SyncResult> => {
  // ...
  const { data, error } = await supabase.functions.invoke('sync-wordpress-homes', {
    body: {
      action: 'sync',
      agentId: agent.id,
      siteUrl: syncUrl,
      homeEndpoint: endpoint || homeEndpoint || undefined,
      useAiExtraction: useAiExtraction ?? false,
      forceFullSync: forceFullSync ?? false,  // NEW
    },
  });
```

---

#### 3. Component: `src/components/agents/locations/WordPressHomesCard.tsx`

Add a "Full Resync" option in a dropdown or as an alternate action when properties are empty:

**Option A - Add dropdown menu to Sync button:**
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from '@untitledui/icons';

// In actions section:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" disabled={isSyncing}>
      {isSyncing ? (
        <>
          <RefreshCw01 className="h-4 w-4 mr-1.5 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw01 className="h-4 w-4 mr-1.5" />
          Sync
          <ChevronDown className="h-3 w-3 ml-1" />
        </>
      )}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => syncHomes(undefined, useAiExtraction)}>
      Quick Sync (new changes only)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => syncHomes(undefined, useAiExtraction, undefined, true)}>
      Full Resync (all properties)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Technical Details

| Scenario | Before | After |
|----------|--------|-------|
| Deleted all properties locally | "No changes" - stuck | Auto-detects 0 properties, forces full sync |
| WordPress modified a home | Fetches only that home | Same - incremental works |
| User wants fresh data | No option | "Full Resync" menu option |

### Edge Cases Handled

1. **First sync** - `lastSync` is null → full sync (existing behavior)
2. **Incremental with changes** - modified_after finds changes → works normally
3. **Incremental with no changes** - 0 homes from WP, 0 created → BUT now checks if local is also 0
4. **Local deleted, WP unchanged** - local=0, config.home_count>0 → forces full sync
5. **Explicit full resync** - user clicks "Full Resync" → bypasses incremental

### Result

Users who delete properties and resync will see them restored automatically. Power users also get an explicit "Full Resync" option for maximum control.
