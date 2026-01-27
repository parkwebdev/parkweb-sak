

## Fix: Communities Sync Button Missing Dropdown

### Problem Found
The dropdown menu with "Quick Sync" and "Full Resync" was only added to the **Property Listings** sync button. The **Communities** sync button at lines 502-515 still uses a simple `<Button>` without a dropdown:

```tsx
// Current code - NO dropdown
<Button
  variant="ghost"
  size="sm"
  onClick={handleSyncCommunities}
  disabled={isLoading}
  className="h-8 w-8 p-0"
>
  <RefreshCw01 ... />
</Button>
```

### Solution
Replace the Communities sync button with the same dropdown pattern used for Properties.

---

### File Changes

#### 1. Edge Function: `supabase/functions/sync-wordpress-communities/index.ts`

Add `forceFullSync` parameter support and smart detection logic (same pattern as homes).

#### 2. Hook: `src/hooks/useWordPressConnection.ts`

Update `importCommunities` function signature to accept `forceFullSync` parameter.

#### 3. Component: `src/components/agents/locations/WordPressIntegrationSheet.tsx`

**Replace lines 502-515** (Communities sync button) with a dropdown:

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
    <DropdownMenuItem onClick={() => importCommunities(undefined, undefined, undefined, false)}>
      Quick Sync
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => importCommunities(undefined, undefined, undefined, true)}>
      Full Resync
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Summary

| Button | Before | After |
|--------|--------|-------|
| Communities Sync | Simple button, no options | Dropdown with Quick/Full Resync |
| Property Sync | Already has dropdown | No change needed |

This will give both sync buttons the same Quick Sync / Full Resync dropdown menu.

