# Plan: WordPress Sync Improvements

## Completed ✅

### Fix: WordPress Sync Should Re-fetch All Properties When Local Data Is Missing

**Problem:** After deleting all properties locally, clicking "Sync Homes" said "No changes" and didn't restore properties because incremental sync only fetched WordPress changes since last sync.

**Solution Implemented:**

1. **Edge Function** (`supabase/functions/sync-wordpress-homes/index.ts`):
   - Added `forceFullSync` parameter to request body
   - Added smart detection: if local property count is 0 but config.home_count > 0, automatically forces full sync
   - Changed `isIncremental` to `let` variable to allow modification

2. **Hook** (`src/hooks/useWordPressHomes.ts`):
   - Added `forceFullSync` optional parameter to `syncHomes` function
   - Passes the flag to the edge function

3. **Component** (`src/components/agents/locations/WordPressHomesCard.tsx`):
   - Replaced single Sync button with dropdown menu
   - Added "Quick Sync (new changes only)" option
   - Added "Full Resync (all properties)" option

**Result:** Users who delete properties can now restore them automatically (smart detection) or manually (Full Resync option).
