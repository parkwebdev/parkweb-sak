

# Plan: Complete WordPress Data Integration - Missing Field Implementation

## Problem Summary

The database schema, types, parsing utilities, and frontend UI are complete, BUT the actual sync functions that write data to the database are NOT using the new fields. Data extraction and saving is incomplete.

## Issues Identified

### Issue 1: Properties Sync Not Saving New Fields
**File:** `supabase/functions/sync-wordpress-homes/index.ts`

The `propertyData` object (lines 965-989) is missing:
- `manufacturer`
- `model`
- `lot_rent`
- `virtual_tour_url`
- `community_type`

These fields need to be:
1. Extracted from field mappings (Priority 1)
2. Extracted from AI (Priority 2)
3. Extracted from ACF keywords (Priority 3)
4. Included in `propertyData` when saving

### Issue 2: Communities Sync Putting New Fields in Metadata Instead of Columns
**File:** `supabase/functions/sync-wordpress-communities/index.ts`

The `locationData` object (lines 1542-1558) is missing:
- `amenities` (currently not extracted at all)
- `pet_policy` (currently not extracted at all)
- `utilities_included` (currently not extracted at all)
- `age_category` (extracted but put in metadata)
- `description` (extracted but put in metadata)

### Issue 3: AI Extraction Schema Incomplete
**File:** `supabase/functions/_shared/ai/wordpress-extraction.ts`

`ExtractedPropertyData` interface (lines 33-49) missing:
- `manufacturer`
- `model`
- `lot_rent`
- `virtual_tour_url`
- `community_type`

Claude tool schema for `extract_property` doesn't include these fields.

`ExtractedCommunityData` interface (lines 17-31) is already correct with `amenities`, `pet_policy`.

---

## Implementation Details

### Part 1: Update AI Extraction Schema

**File:** `supabase/functions/_shared/ai/wordpress-extraction.ts`

Add to `ExtractedPropertyData` interface:
```typescript
export interface ExtractedPropertyData {
  // ... existing fields ...
  manufacturer?: string | null;
  model?: string | null;
  lot_rent?: number | null;  // in dollars
  virtual_tour_url?: string | null;
  community_type?: string | null;
}
```

Update the Claude tool schema in `extractPropertyData()` to include these fields in the `properties` object.

Update the system prompt to instruct Claude to extract:
- manufacturer: Home manufacturer/builder name
- model: Home model name
- lot_rent: Monthly lot/site rent in dollars
- virtual_tour_url: Link to virtual tour/3D walkthrough
- community_type: Type of community (55+, All Ages, Family, etc.)

### Part 2: Update Properties Sync Function

**File:** `supabase/functions/sync-wordpress-homes/index.ts`

**Step A: Add new field variables (after line 830):**
```typescript
let manufacturer: string | null = null;
let model: string | null = null;
let lotRent: number | null = null;
let virtualTourUrl: string | null = null;
let communityType: string | null = null;
```

**Step B: Extract from field mappings (Priority 1, after line 858):**
```typescript
if (fieldMappings) {
  manufacturer = getValueByPath(home, fieldMappings.manufacturer) as string | null;
  model = getValueByPath(home, fieldMappings.model) as string | null;
  const lotRentValue = getValueByPath(home, fieldMappings.lot_rent);
  if (lotRentValue != null) lotRent = Math.round(parseFloat(String(lotRentValue)) * 100);
  virtualTourUrl = getValueByPath(home, fieldMappings.virtual_tour_url) as string | null;
  communityType = getValueByPath(home, fieldMappings.community_type) as string | null;
}
```

**Step C: Extract from AI (Priority 2, after line 880):**
```typescript
if (aiData) {
  if (!manufacturer) manufacturer = aiData.manufacturer || null;
  if (!model) model = aiData.model || null;
  if (lotRent == null && aiData.lot_rent != null) lotRent = Math.round(aiData.lot_rent * 100);
  if (!virtualTourUrl) virtualTourUrl = aiData.virtual_tour_url || null;
  if (!communityType) communityType = aiData.community_type || null;
}
```

**Step D: Extract from ACF keywords (Priority 3, after line 926):**
```typescript
if (!manufacturer) manufacturer = extractAcfField(acf, 'manufacturer', 'make', 'builder', 'brand');
if (!model) model = extractAcfField(acf, 'model', 'model_name', 'home_model');
if (lotRent == null) {
  const lotRentValue = extractAcfNumber(acf, 'lot_rent', 'space_rent', 'site_rent', 'lot_fee');
  if (lotRentValue != null) lotRent = Math.round(lotRentValue * 100);
}
if (!virtualTourUrl) virtualTourUrl = extractAcfField(acf, 'virtual_tour', 'tour_url', 'matterport', '3d_tour', 'video_tour');
if (!communityType) communityType = extractAcfField(acf, 'community_type', 'age_restriction', 'age_category', '55_plus');
```

**Step E: Include in hashable data (line 943-961):**
```typescript
const hashableData = {
  // ... existing fields ...
  manufacturer,
  model,
  lot_rent: lotRent,
  virtual_tour_url: virtualTourUrl,
  community_type: communityType,
};
```

**Step F: Include in propertyData (lines 965-989):**
```typescript
const propertyData = {
  // ... existing fields ...
  manufacturer,
  model,
  lot_rent: lotRent,
  virtual_tour_url: virtualTourUrl,
  community_type: communityType,
};
```

### Part 3: Update Communities Sync Function

**File:** `supabase/functions/sync-wordpress-communities/index.ts`

**Step A: Add new field variables (after line 1438):**
```typescript
let amenities: string[] = [];
let petPolicy: string | null = null;
let utilitiesIncluded: Record<string, boolean> | null = null;
// Note: description and ageCategory already exist
```

**Step B: Extract from field mappings (Priority 1, after line 1459):**
```typescript
if (fieldMappings) {
  // Handle amenities array
  const amenitiesValue = getValueByPath(community, fieldMappings.amenities);
  if (Array.isArray(amenitiesValue)) {
    amenities = amenitiesValue.map(a => 
      typeof a === 'object' && a !== null && 'amenity' in a 
        ? String(a.amenity) 
        : String(a)
    ).filter(Boolean);
  } else if (typeof amenitiesValue === 'string') {
    amenities = amenitiesValue.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  petPolicy = getValueByPath(community, fieldMappings.pet_policy) as string | null;
  
  // Handle utilities - could be object or individual fields
  const utilitiesValue = getValueByPath(community, fieldMappings.utilities_included);
  if (utilitiesValue && typeof utilitiesValue === 'object') {
    utilitiesIncluded = utilitiesValue as Record<string, boolean>;
  }
}
```

**Step C: Extract from AI (Priority 2, enhance existing block ~line 1467):**
```typescript
if (aiData) {
  // ... existing assignments ...
  if (amenities.length === 0 && aiData.amenities) amenities = aiData.amenities;
  if (!petPolicy) petPolicy = aiData.pet_policy || null;
}
```

**Step D: Extract from ACF keywords (Priority 3, after line 1509):**
```typescript
// Amenities - handle repeater format
if (amenities.length === 0) {
  const amenitiesRepeater = acf?.community_amenities_repeater || acf?.amenities_repeater || acf?.amenities;
  if (Array.isArray(amenitiesRepeater)) {
    amenities = amenitiesRepeater
      .map(item => typeof item === 'object' && item !== null && 'amenity' in item 
        ? String(item.amenity) 
        : String(item))
      .filter(Boolean);
  }
}

if (!petPolicy) petPolicy = extractAcfField(acf, 'pet_policy', 'pets', 'pet_rules', 'pet_friendly');

// Utilities
if (!utilitiesIncluded) {
  const waterTrash = acf?.water_trash_electric || acf?.utilities;
  if (waterTrash && typeof waterTrash === 'object') {
    const utils = waterTrash as Record<string, unknown>;
    utilitiesIncluded = {
      water: utils.water === true || utils.water === 'yes' || utils.water === '1',
      trash: utils.trash === true || utils.trash === 'yes' || utils.trash === '1',
      electric: utils.electric === true || utils.electric === 'yes' || utils.electric === '1',
    };
  }
}
```

**Step E: Remove these from metadata object (lines 1513-1518):**
Remove `description`, `age_category`, `community_type` from metadata since they now have proper columns.

**Step F: Update hashableData (lines 1525-1538):**
```typescript
const hashableData = {
  // ... existing fields ...
  amenities: amenities.length > 0 ? amenities : null,
  pet_policy: petPolicy,
  utilities_included: utilitiesIncluded,
  age_category: ageCategory,
  description,
};
```

**Step G: Update locationData (lines 1542-1558):**
```typescript
const locationData = {
  // ... existing fields ...
  amenities: amenities.length > 0 ? amenities : null,
  pet_policy: petPolicy,
  utilities_included: utilitiesIncluded,
  age_category: ageCategory,
  description,
  metadata: Object.keys(metadata).length > 0 ? metadata : null, // Now only contains lat/lng
};
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/ai/wordpress-extraction.ts` | Add new property fields to interface and Claude schema |
| `supabase/functions/sync-wordpress-homes/index.ts` | Extract and save manufacturer, model, lot_rent, virtual_tour_url, community_type |
| `supabase/functions/sync-wordpress-communities/index.ts` | Extract and save amenities, pet_policy, utilities_included, age_category, description to proper columns |

---

## Testing Plan

After implementation:
1. Run a Full Resync for properties with a WordPress site that has manufacturer/model data (MHP Communities)
2. Verify new fields appear in the properties table
3. Run a Full Resync for communities
4. Verify amenities, pet_policy, utilities_included, age_category, description appear in proper columns (not just metadata)
5. Verify AI extraction populates these fields when ACF data is missing

