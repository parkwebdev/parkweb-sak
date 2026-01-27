
## Fix: Add Full Resync Option to WordPress Integration UI

### Problem
The dropdown with "Quick Sync" and "Full Resync" was added to `WordPressHomesCard.tsx`, but that component is **not used anywhere in the app**. The actual WordPress sync UI is in:
- `WordPressIntegrationSheet.tsx` - The modal accessed from Settings
- `WordPressIntegrationSection.tsx` - An older inline section

Both use simple buttons that call `syncHomes()` without the `forceFullSync` parameter.

### Solution
Add the dropdown menu with Quick Sync and Full Resync options to the **actual components being used**.

---

### File Changes

#### 1. `src/components/agents/locations/WordPressIntegrationSheet.tsx`

**Replace the simple sync button (lines 546-559) with a dropdown menu:**

```tsx
// Before: Simple icon button
<Button
  variant="ghost"
  size="sm"
  onClick={handleSyncHomes}
  disabled={isLoading}
  className="h-8 w-8 p-0"
>
  <RefreshCw01 ... />
</Button>

// After: Dropdown with options
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
        className={homesSyncing ? 'animate-spin' : ''} 
        aria-hidden="true" 
      />
      <span className="sr-only">Sync properties</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => syncHomes(undefined, extractionMode === 'ai')}>
      Quick Sync
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => syncHomes(undefined, extractionMode === 'ai', undefined, true)}>
      Full Resync
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Add necessary imports:**
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
```

---

#### 2. `src/components/agents/locations/WordPressIntegrationSection.tsx`

**Replace the "Sync Homes" button (lines 476-493) with a dropdown menu:**

```tsx
// Before: Simple button
<Button
  size="sm"
  onClick={handleSyncHomes}
  disabled={homesSyncing}
  className="h-7"
>
  {homesSyncing ? (
    <>
      <RefreshCw01 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      Syncing...
    </>
  ) : (
    <>
      <RefreshCw01 className="h-3.5 w-3.5 mr-1.5" />
      Sync Homes
    </>
  )}
</Button>

// After: Dropdown with options
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" disabled={homesSyncing} className="h-7">
      {homesSyncing ? (
        <>
          <RefreshCw01 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          Syncing...
        </>
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
    <DropdownMenuItem onClick={() => syncHomes(undefined, useAiExtraction)}>
      Quick Sync (new changes only)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => syncHomes(undefined, useAiExtraction, undefined, true)}>
      Full Resync (all properties)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Add necessary imports:**
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from '@untitledui/icons';
```

---

### Result

| Component | Before | After |
|-----------|--------|-------|
| WordPressIntegrationSheet | Simple refresh icon button | Dropdown with Quick/Full Sync |
| WordPressIntegrationSection | "Sync Homes" button | Dropdown with Quick/Full Sync |

Both UIs will now have explicit options for incremental vs full resync, matching what was intended in the original plan.
