

# Plan: Fix Field Mapping Array Value Extraction

## Root Cause Identified

WordPress returns `agency_meta` fields as **arrays**, not strings:

```json
"agency_meta": {
  "fave_agency_email": ["patrick@thefoleygrove.com"],
  "fave_agency_phone": ["(251) 971-1033"],
  "fave_agency_address": ["8648 Co Rd 65, Foley, AL 36535"]
}
```

The `getValueByPath` function doesn't handle arrays - when it encounters `["value"]`, it returns `null` instead of extracting `"value"`.

## Current Broken Logic (line 131-136)

```typescript
if (typeof current === 'object') {
  const asObj = current as Record<string, unknown>;
  if ('rendered' in asObj) return asObj.rendered;
  return null;  // ❌ Arrays fall through here and return null!
}
```

## Solution

Update `getValueByPath` to handle arrays by extracting the first non-empty element:

```typescript
if (typeof current === 'object') {
  // Handle arrays - extract first element
  if (Array.isArray(current)) {
    if (current.length === 0) return null;
    const firstItem = current[0];
    // If first item is an object with 'rendered', extract it
    if (typeof firstItem === 'object' && firstItem !== null && 'rendered' in firstItem) {
      return (firstItem as Record<string, unknown>).rendered;
    }
    return firstItem;
  }
  
  // Handle objects with 'rendered' (like title.rendered)
  const asObj = current as Record<string, unknown>;
  if ('rendered' in asObj) return asObj.rendered;
  return null;
}
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-wordpress-communities/index.ts` | Update `getValueByPath` to handle arrays |
| `supabase/functions/sync-wordpress-homes/index.ts` | Update `getValueByPath` to handle arrays (same fix) |

## Expected Result After Fix

With the fix, the sync will properly extract:
- `agency_meta.fave_agency_address` → `"8648 Co Rd 65, Foley, AL 36535"` 
- `agency_meta.fave_agency_email` → `"patrick@thefoleygrove.com"`
- `agency_meta.fave_agency_phone` → `"(251) 971-1033"`
- `yoast_head_json.description` → `"The Foley Grove in Foley, AL, is a 55+ manufactured home community..."`

Then the address parser we just added will further split the address into city/state/zip:
- **City**: `Foley`
- **State**: `AL`
- **ZIP**: `36535`

## Testing

After deploying the fix:
1. Run a Full Resync from the WordPress integration sheet
2. The locations table should now show populated `address`, `city`, `state`, `zip`, `email`, `phone` columns

