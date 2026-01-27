
## Add Full Resync Option for Communities

### Problem
The communities sync has the **exact same issue** as properties - after deleting all communities locally, clicking "Sync" uses incremental sync (with `modified_after`) and returns 0 results because nothing changed on WordPress.

### Solution
Apply the same fix pattern used for homes/properties:
1. Add `forceFullSync` parameter to communities sync
2. Add smart detection when local count is 0
3. Add Quick Sync / Full Resync dropdown to UI

---

### File Changes

#### 1. Edge Function: `supabase/functions/sync-wordpress-communities/index.ts`

**Add forceFullSync parameter extraction (~line 510):**
```typescript
const { action, agentId, siteUrl, communityEndpoint, homeEndpoint, 
        communitySyncInterval, homeSyncInterval, deleteLocations, 
        useAiExtraction, modifiedAfter, forceFullSync } = await req.json();
```

**Add smart detection logic in sync action (~line 621-624):**
```typescript
// Determine if this is an incremental sync
const lastSync = modifiedAfter || wpConfig?.last_community_sync;
let isIncremental = !!lastSync && !forceFullSync;

// Smart detection: if local communities is 0 but we had some before, force full sync
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
```

---

#### 2. Hook: `src/hooks/useWordPressConnection.ts`

**Update `importCommunities` to accept `forceFullSync` (~line 268-288):**
```typescript
const importCommunities = useCallback(async (
  url?: string, 
  endpoint?: string, 
  useAiExtraction?: boolean,
  forceFullSync?: boolean  // NEW parameter
): Promise<SyncResult | null> => {
  // ...
  body: {
    action: 'sync',
    agentId: agent.id,
    siteUrl: url,
    communityEndpoint: endpoint || communityEndpoint || undefined,
    useAiExtraction: useAiExtraction ?? false,
    forceFullSync: forceFullSync ?? false,  // NEW
  },
```

---

#### 3. UI: `src/components/agents/locations/WordPressIntegrationSheet.tsx`

**Update `handleSyncCommunities` to support forceFullSync (~line 301):**
```typescript
const handleSyncCommunities = (forceFullSync = false) => 
  importCommunities(undefined, undefined, extractionMode === 'ai', forceFullSync);
```

**Replace the simple sync button with a dropdown (~lines 502-516):**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="sm"
      disabled={isLoading}
      className="h-8 w-8 p-0"
    >
      <RefreshCw01 
        size={16} 
        className={connectionSyncing ? 'animate-spin' : ''} 
        aria-hidden="true" 
      />
      <span className="sr-only">Sync communities</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleSyncCommunities(false)}>
      Quick Sync
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleSyncCommunities(true)}>
      Full Resync
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

#### 4. UI: `src/components/agents/locations/WordPressIntegrationSection.tsx`

**Update `handleImportCommunities` to support forceFullSync (~line 148):**
```typescript
const handleImportCommunities = async (forceFullSync = false) => {
  const url = inputUrl.trim() || undefined;
  await importCommunities(url, undefined, undefined, forceFullSync);
  setIsEditing(false);
};
```

**Replace the simple "Sync Now" button with a dropdown (~lines 381-396):**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      size="sm"
      variant="outline"
      disabled={connectionSyncing}
      className="h-7"
    >
      {connectionSyncing ? (
        <RefreshCw01 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <RefreshCw01 className="h-3.5 w-3.5 mr-1.5" />
          Sync
          <ChevronDown className="h-3 w-3 ml-1" />
        </>
      )}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleImportCommunities(false)}>
      Quick Sync
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleImportCommunities(true)}>
      Full Resync
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Summary

| Component | Change |
|-----------|--------|
| Edge function | Add `forceFullSync` param + smart detection |
| useWordPressConnection hook | Add `forceFullSync` to `importCommunities` |
| WordPressIntegrationSheet | Dropdown for Communities sync |
| WordPressIntegrationSection | Dropdown for Communities sync |

Both properties **and** communities will now have Quick Sync / Full Resync options with automatic smart detection.
