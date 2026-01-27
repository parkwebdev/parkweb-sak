
# Plan: Complete Property Field Mapping Integration

## Problem Identified

The WordPress Field Mapping system is **working correctly for Communities** but **not for Properties**. Specifically:

- The `sync-wordpress-homes/index.ts` edge function does NOT read or use the `property_field_mappings` configuration
- The `syncHomesToProperties()` function doesn't accept field mappings as a parameter
- The `getValueByPath()` helper function exists in the communities function but NOT in the homes function

When users configure field mappings for properties in the UI, those mappings are saved but never used during property sync.

## Solution

Update `sync-wordpress-homes/index.ts` to mirror the community sync implementation:

1. Add the `getValueByPath()` helper function
2. Update `syncHomesToProperties()` signature to accept field mappings
3. Pass `wpConfig?.property_field_mappings` when calling the sync function
4. Implement mapping-based extraction with priority over keyword guessing

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-wordpress-homes/index.ts` | Add `getValueByPath()`, update sync function to use property field mappings |

## Implementation Details

### 1. Add `getValueByPath()` Helper

Add after line ~110 (after `extractAcfField`):

```typescript
/**
 * Get a value from an object using dot-notation path
 * e.g., getValueByPath(obj, 'acf.phone') returns obj.acf.phone
 */
function getValueByPath(obj: Record<string, unknown>, path: string | undefined): unknown {
  if (!path) return null;
  
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    if (typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[part];
  }
  
  if (current === null || current === undefined) return null;
  if (typeof current === 'object') {
    const asObj = current as Record<string, unknown>;
    if ('rendered' in asObj) return asObj.rendered;
    return null;
  }
  return current;
}
```

### 2. Update `syncHomesToProperties()` Function Signature

Change line ~629 from:
```typescript
async function syncHomesToProperties(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  knowledgeSourceId: string,
  locationMaps: LocationMaps,
  homes: WordPressHome[],
  isIncremental: boolean,
  useAiExtraction: boolean = false
): Promise<SyncResult>
```

To:
```typescript
async function syncHomesToProperties(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  knowledgeSourceId: string,
  locationMaps: LocationMaps,
  homes: WordPressHome[],
  isIncremental: boolean,
  useAiExtraction: boolean = false,
  fieldMappings?: Record<string, string>  // NEW PARAMETER
): Promise<SyncResult>
```

### 3. Add Field Mapping Extraction Logic

After line ~700 (inside the home processing loop), add priority-based extraction:

```typescript
// PRIORITY 1: Use explicit field mappings if provided
if (fieldMappings && Object.keys(fieldMappings).length > 0) {
  console.log(`📋 Using custom field mappings for property: ${home.slug}`);
  address = getValueByPath(home, fieldMappings.address) as string | null;
  lotNumber = getValueByPath(home, fieldMappings.lot_number) as string | null;
  city = getValueByPath(home, fieldMappings.city) as string | null;
  state = getValueByPath(home, fieldMappings.state) as string | null;
  zip = getValueByPath(home, fieldMappings.zip) as string | null;
  const priceValue = getValueByPath(home, fieldMappings.price);
  if (priceValue != null) price = Math.round(parseFloat(String(priceValue)) * 100);
  priceType = (getValueByPath(home, fieldMappings.price_type) as string) || 'sale';
  const bedsValue = getValueByPath(home, fieldMappings.beds);
  if (bedsValue != null) beds = parseInt(String(bedsValue), 10) || null;
  const bathsValue = getValueByPath(home, fieldMappings.baths);
  if (bathsValue != null) baths = parseFloat(String(bathsValue)) || null;
  const sqftValue = getValueByPath(home, fieldMappings.sqft);
  if (sqftValue != null) sqft = parseInt(String(sqftValue), 10) || null;
  const yearValue = getValueByPath(home, fieldMappings.year_built);
  if (yearValue != null) yearBuilt = parseInt(String(yearValue), 10) || null;
  status = (getValueByPath(home, fieldMappings.status) as string) || 'available';
  description = getValueByPath(home, fieldMappings.description) as string | null;
  // Features may need special handling for arrays
  const featuresValue = getValueByPath(home, fieldMappings.features);
  if (Array.isArray(featuresValue)) features = featuresValue.map(String);
}

// PRIORITY 2: AI extraction (if enabled and fields still missing)
if (useAiExtraction && !address) {
  // ... existing AI extraction code
}

// PRIORITY 3: Keyword-based ACF fallback
if (!address) address = extractAcfField(acf, ...);
// ... rest of existing fallback logic
```

### 4. Update Sync Call to Pass Mappings

Change line ~367-375 from:
```typescript
const result = await syncHomesToProperties(
  supabase,
  agentId,
  knowledgeSourceId,
  locationMaps,
  homes,
  isIncremental,
  useAiExtraction ?? false
);
```

To:
```typescript
const result = await syncHomesToProperties(
  supabase,
  agentId,
  knowledgeSourceId,
  locationMaps,
  homes,
  isIncremental,
  useAiExtraction ?? false,
  wpConfig?.property_field_mappings  // NEW: Pass field mappings
);
```

## Testing Checklist

After implementation:
1. Configure WordPress URL and select property endpoint
2. In field mapping step, map property fields (price, beds, etc.)
3. Save mappings and trigger property sync
4. Check edge function logs for: `📋 Using custom field mappings for property: ...`
5. Verify property data uses mapped field values, not keyword guessing
6. Test with a WordPress site that has non-standard field names

## Priority Order During Sync

After this fix, property extraction will follow this priority:

1. **Explicit field mappings** (from user configuration)
2. **AI extraction** (if enabled, for unmapped fields)
3. **Keyword-based ACF guessing** (fallback for any remaining fields)

This matches how community sync already works.
